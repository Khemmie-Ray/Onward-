// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {OnwardClaims} from "../src/OnwardClaims.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Minimal mocks so tests control verification and balances
contract MockG is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply;
    function mint(address to, uint256 a) external { balanceOf[to]+=a; totalSupply+=a; }
    function transfer(address to, uint256 a) external returns (bool) {
        balanceOf[msg.sender]-=a; balanceOf[to]+=a; return true;
    }
    function transferFrom(address f,address t,uint256 a) external returns (bool){
        allowance[f][msg.sender]-=a; balanceOf[f]-=a; balanceOf[t]+=a; return true;
    }
    function approve(address s,uint256 a) external returns (bool){ allowance[msg.sender][s]=a; return true; }
}

contract MockIdentity {
    mapping(address => address) public root;
    function setVerified(address u, bool v) external { root[u] = v ? u : address(0); }
    function getWhitelistedRoot(address u) external view returns (address) { return root[u]; }
}

contract OnwardClaimsTest is Test {
    OnwardClaims claims;
    MockG g;
    MockIdentity id;
    address owner = address(0xA0);
    address signer = address(0x51);
    address alice = address(0xA11CE);
    address eve   = address(0xEEEE);
    bytes32 constant CID = keccak256("claim-1");

    function setUp() public {
        g = new MockG();
        id = new MockIdentity();
        OnwardClaims impl = new OnwardClaims();
        bytes memory init = abi.encodeCall(
            OnwardClaims.initialize, (owner, signer, address(g), address(id))
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), init);
        claims = OnwardClaims(address(proxy));

        g.mint(address(claims), 20000e18);   
        id.setVerified(alice, true);          
    }

    function _settle(address u, uint256 p, bytes32 cid) internal returns (uint256) {
        vm.prank(signer);
        return claims.settle(u, p, cid);
    }

    function test_settle_pays_1to1() public {
        uint256 got = _settle(alice, 100, CID);
        assertEq(got, 100e18);
        assertEq(g.balanceOf(alice), 100e18);
    }

    function test_replay_reverts() public {
        _settle(alice, 100, CID);
        vm.prank(signer);
        vm.expectRevert(OnwardClaims.AlreadySettled.selector);
        claims.settle(alice, 100, CID);
    }

    function test_unverified_reverts() public {
        vm.prank(signer);
        vm.expectRevert(OnwardClaims.NotVerified.selector);
        claims.settle(eve, 100, keccak256("x"));
    }

    function test_below_min_reverts() public {
        vm.prank(signer);
        vm.expectRevert(OnwardClaims.BelowMinimum.selector);
        claims.settle(alice, 99, keccak256("x"));
    }

    function test_only_signer() public {
        vm.prank(alice);
        vm.expectRevert(OnwardClaims.NotSigner.selector);
        claims.settle(alice, 100, keccak256("x"));
    }

    function test_daily_cap() public {
        _settle(alice, 100, keccak256("a"));
        _settle(alice, 100, keccak256("b"));   // 200 = cap
        vm.prank(signer);
        vm.expectRevert(OnwardClaims.ExceedsUserDailyCap.selector);
        claims.settle(alice, 100, keccak256("c"));
    }

    function test_weekly_cap_across_days() public {
        for (uint i; i < 5; i++) {
            _settle(alice, 200, keccak256(abi.encode(i)));
            vm.warp(block.timestamp + 1 days);
            id.setVerified(alice, true); 
        }
    
        vm.prank(signer);
        vm.expectRevert(OnwardClaims.ExceedsUserWeeklyCap.selector);
        claims.settle(alice, 100, keccak256("over"));
    }

    function test_insufficient_reserve() public {
        vm.prank(owner);
        claims.withdrawReserve(owner, 20000e18 - 50e18);
        vm.prank(signer);
        vm.expectRevert(OnwardClaims.InsufficientReserve.selector);
        claims.settle(alice, 100, keccak256("x"));
    }

    function test_volume_tracks() public {
        _settle(alice, 100, CID);
        vm.prank(signer);
        claims.recordUbiClaim(alice, 5e18, keccak256("ubi"));
        assertEq(claims.totalVolumeG(), 105e18);
    }

    function test_claimableNow_matches() public view {
        assertEq(claims.claimableNow(alice), 200e18); // fresh, capped at daily
    }

    function test_pause_blocks() public {
        vm.prank(owner);
        claims.pause();
        vm.prank(signer);
        vm.expectRevert();
        claims.settle(alice, 100, CID);
    }
}