// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {OnwardBadges} from "../src/OnwardBadges.sol";
import {WhackStake} from "../src/WhackStake.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {
    ERC1967Proxy
} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * Mock G$ token for testing. 1B initial supply minted to deployer.
 */
contract MockGDollar is ERC20 {
    constructor() ERC20("Mock GoodDollar", "G$") {
        _mint(msg.sender, 1_000_000_000 ether);
    }
}

contract ContractsTest is Test {
    OnwardBadges badges;
    WhackStake stakeContract;
    MockGDollar gd;

    address owner = makeAddr("owner");
    address signer = makeAddr("signer");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    uint256 constant STAKE = 10 ether;
    uint256 constant BONUS = 5 ether;

    function setUp() public {
        gd = new MockGDollar();

        // Deploy badges proxy
        OnwardBadges badgesImpl = new OnwardBadges();
        bytes memory badgesInit = abi.encodeCall(
            OnwardBadges.initialize,
            (owner, signer, address(gd))
        );
        ERC1967Proxy badgesProxy = new ERC1967Proxy(
            address(badgesImpl),
            badgesInit
        );
        badges = OnwardBadges(address(badgesProxy));

        // Deploy stake proxy
        WhackStake stakeImpl = new WhackStake();
        bytes memory stakeInit = abi.encodeCall(
            WhackStake.initialize,
            (owner, signer, address(gd), address(badges), STAKE, BONUS)
        );
        ERC1967Proxy stakeProxy = new ERC1967Proxy(
            address(stakeImpl),
            stakeInit
        );
        stakeContract = WhackStake(address(stakeProxy));

        // Fund reserves
        gd.transfer(address(badges), 10_000 ether);
        gd.transfer(address(stakeContract), 1_000 ether); // bonus pool
        gd.transfer(alice, 100 ether);
        gd.transfer(bob, 100 ether);

        // Configure a module URI
        vm.prank(owner);
        badges.setModuleURI("test-module", "ipfs://test/test-module.json");
    }

    // ============================================================
    // OnwardBadges
    // ============================================================

    function testMintBadge() public {
        vm.prank(signer);
        badges.mint(alice, "test-module");
        assertEq(badges.balanceOf(alice), 1);
        assertEq(badges.ownerOf(1), alice);
    }

    function testMintRevertsForNonSigner() public {
        vm.prank(alice);
        vm.expectRevert(OnwardBadges.NotSigner.selector);
        badges.mint(alice, "test-module");
    }

    function testMintRevertsOnDuplicate() public {
        vm.startPrank(signer);
        badges.mint(alice, "test-module");
        vm.expectRevert(OnwardBadges.AlreadyEarned.selector);
        badges.mint(alice, "test-module");
        vm.stopPrank();
    }

    function testSoulboundCannotTransfer() public {
        vm.prank(signer);
        badges.mint(alice, "test-module");

        vm.prank(alice);
        vm.expectRevert(OnwardBadges.SoulboundCannotTransfer.selector);
        badges.transferFrom(alice, bob, 1);
    }

    function testDistributeReward() public {
        bytes32 claimId = keccak256("alice:claim1");
        uint256 before = gd.balanceOf(alice);

        vm.prank(signer);
        badges.distribute(alice, 5 ether, claimId);

        assertEq(gd.balanceOf(alice), before + 5 ether);
        assertEq(badges.totalDistributed(), 5 ether);
        assertTrue(badges.claimed(claimId));
    }

    function testDistributeIdempotent() public {
        bytes32 claimId = keccak256("alice:claim1");
        vm.startPrank(signer);
        badges.distribute(alice, 5 ether, claimId);

        vm.expectRevert(OnwardBadges.AlreadyClaimed.selector);
        badges.distribute(alice, 5 ether, claimId);
        vm.stopPrank();
    }

    function testPauseStopsMint() public {
        vm.prank(owner);
        badges.pause();

        vm.prank(signer);
        vm.expectRevert();
        badges.mint(alice, "test-module");
    }

    function testReplenishReserve() public {
        uint256 before = badges.reserveBalance();

        vm.prank(alice);
        gd.approve(address(badges), 50 ether);
        vm.prank(alice);
        badges.replenishReserve(50 ether, "manual-topup");

        assertEq(badges.reserveBalance(), before + 50 ether);
        assertEq(badges.totalReplenished(), 50 ether);
    }

    function testRenounceUpgradeability() public {
        vm.prank(owner);
        badges.renounceUpgradeability();
        assertTrue(badges.upgradeRenounced());
    }

    // ============================================================
    // WhackStake
    // ============================================================

    function testStake() public {
        bytes32 roundId = keccak256("round1");
        uint256 before = gd.balanceOf(alice);

        vm.prank(alice);
        gd.approve(address(stakeContract), STAKE);
        vm.prank(alice);
        stakeContract.stake(roundId);

        assertEq(gd.balanceOf(alice), before - STAKE);
        (address staker, uint256 amount, bool resolved) = stakeContract.stakes(
            roundId
        );
        assertEq(staker, alice);
        assertEq(amount, STAKE);
        assertFalse(resolved);
    }

    function testResolveWin() public {
        bytes32 roundId = keccak256("round1");
        vm.prank(alice);
        gd.approve(address(stakeContract), STAKE);
        vm.prank(alice);
        stakeContract.stake(roundId);

        uint256 beforeBalance = gd.balanceOf(alice);

        vm.prank(signer);
        stakeContract.resolve(roundId, true);

        // Alice gets stake back + bonus
        assertEq(gd.balanceOf(alice), beforeBalance + STAKE + BONUS);
    }

    function testResolveLossForfeitsToReserve() public {
        bytes32 roundId = keccak256("round1");
        vm.prank(alice);
        gd.approve(address(stakeContract), STAKE);
        vm.prank(alice);
        stakeContract.stake(roundId);

        uint256 reserveBefore = badges.reserveBalance();

        vm.prank(signer);
        stakeContract.resolve(roundId, false);

        assertEq(badges.reserveBalance(), reserveBefore + STAKE);
        assertEq(badges.totalReplenished(), STAKE);
        assertEq(stakeContract.totalForfeited(), STAKE);
    }

    function testResolveIdempotent() public {
        bytes32 roundId = keccak256("round1");
        vm.prank(alice);
        gd.approve(address(stakeContract), STAKE);
        vm.prank(alice);
        stakeContract.stake(roundId);

        vm.startPrank(signer);
        stakeContract.resolve(roundId, true);
        vm.expectRevert(WhackStake.RoundAlreadyResolved.selector);
        stakeContract.resolve(roundId, true);
        vm.stopPrank();
    }

    function testStakeRejectsDuplicateRoundId() public {
        bytes32 roundId = keccak256("round1");
        vm.startPrank(alice);
        gd.approve(address(stakeContract), STAKE * 2);
        stakeContract.stake(roundId);
        vm.expectRevert(WhackStake.RoundAlreadyExists.selector);
        stakeContract.stake(roundId);
        vm.stopPrank();
    }
}