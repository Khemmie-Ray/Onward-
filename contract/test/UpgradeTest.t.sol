// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {OnwardClaims} from "../src/OnwardClaims.sol";

interface IUUPS {
    function upgradeToAndCall(
        address newImplementation,
        bytes calldata data
    ) external payable;
}

interface IClaimsView {
    function owner() external view returns (address);
    function signer() external view returns (address);
    function gDollar() external view returns (address);
    function identity() external view returns (address);
    function pointsPerG() external view returns (uint256);
    function minClaimPoints() external view returns (uint256);
    function perUserDailyCapG() external view returns (uint256);
    function perUserWeeklyCapG() external view returns (uint256);
    function globalDailyCapG() external view returns (uint256);
    function totalClaimedG() external view returns (uint256);
    function totalUbiClaimedG() external view returns (uint256);
    function claimCount() external view returns (uint256);
    function totalPointsSettled() external view returns (uint256);
    function upgradeRenounced() external view returns (bool);
    function reserveBalance() external view returns (uint256);
}

contract UpgradeTest is Test {
    address constant PROXY = 0xF66cFE1D3bF53a4Cc9Ced5e9B39945E3769A5c87;

    IClaimsView claims;

    struct Snapshot {
        address owner;
        address signer;
        address gDollar;
        address identity;
        uint256 pointsPerG;
        uint256 minClaimPoints;
        uint256 perUserDailyCapG;
        uint256 perUserWeeklyCapG;
        uint256 globalDailyCapG;
        uint256 totalClaimedG;
        uint256 totalUbiClaimedG;
        uint256 claimCount;
        uint256 totalPointsSettled;
        bool upgradeRenounced;
        uint256 reserveBalance;
    }

    function setUp() public {
        claims = IClaimsView(PROXY);
    }

    function _snapshot() internal view returns (Snapshot memory s) {
        s.owner = claims.owner();
        s.signer = claims.signer();
        s.gDollar = claims.gDollar();
        s.identity = claims.identity();
        s.pointsPerG = claims.pointsPerG();
        s.minClaimPoints = claims.minClaimPoints();
        s.perUserDailyCapG = claims.perUserDailyCapG();
        s.perUserWeeklyCapG = claims.perUserWeeklyCapG();
        s.globalDailyCapG = claims.globalDailyCapG();
        s.totalClaimedG = claims.totalClaimedG();
        s.totalUbiClaimedG = claims.totalUbiClaimedG();
        s.claimCount = claims.claimCount();
        s.totalPointsSettled = claims.totalPointsSettled();
        s.upgradeRenounced = claims.upgradeRenounced();
        s.reserveBalance = claims.reserveBalance();
    }

    function test_UpgradePreservesStorage() public {
        Snapshot memory before = _snapshot();

        console.log("--- before upgrade ---");
        console.log("totalClaimedG", before.totalClaimedG);
        console.log("reserveBalance", before.reserveBalance);
        console.log("claimCount", before.claimCount);

        OnwardClaims newImpl = new OnwardClaims();
        vm.prank(before.owner);
        IUUPS(PROXY).upgradeToAndCall(address(newImpl), "");

        Snapshot memory afterUp = _snapshot();

        assertEq(afterUp.owner, before.owner, "owner changed");
        assertEq(afterUp.signer, before.signer, "signer changed");
        assertEq(afterUp.gDollar, before.gDollar, "gDollar changed");
        assertEq(afterUp.identity, before.identity, "identity changed");
        assertEq(afterUp.pointsPerG, before.pointsPerG, "pointsPerG changed");
        assertEq(
            afterUp.minClaimPoints,
            before.minClaimPoints,
            "minClaim changed"
        );
        assertEq(
            afterUp.perUserDailyCapG,
            before.perUserDailyCapG,
            "dailyCap changed"
        );
        assertEq(
            afterUp.perUserWeeklyCapG,
            before.perUserWeeklyCapG,
            "weeklyCap changed"
        );
        assertEq(
            afterUp.globalDailyCapG,
            before.globalDailyCapG,
            "globalCap changed"
        );
        assertEq(
            afterUp.totalClaimedG,
            before.totalClaimedG,
            "totalClaimedG changed"
        );
        assertEq(
            afterUp.totalUbiClaimedG,
            before.totalUbiClaimedG,
            "totalUbi changed"
        );
        assertEq(afterUp.claimCount, before.claimCount, "claimCount changed");
        assertEq(
            afterUp.totalPointsSettled,
            before.totalPointsSettled,
            "pointsSettled changed"
        );
        assertEq(
            afterUp.upgradeRenounced,
            before.upgradeRenounced,
            "renounced changed"
        );
        assertEq(
            afterUp.reserveBalance,
            before.reserveBalance,
            "reserve changed"
        );

        assertEq(
            OnwardClaims(PROXY).totalContestPaidG(),
            0,
            "totalContestPaidG should start at 0"
        );

        console.log("--- after upgrade: all storage intact, V2 live ---");
    }

    function test_BatchContestReward_PaysAndReverts() public {
        address ownerAddr = claims.owner();

        OnwardClaims newImpl = new OnwardClaims();
        vm.prank(ownerAddr);
        IUUPS(PROXY).upgradeToAndCall(address(newImpl), "");

        OnwardClaims c = OnwardClaims(PROXY);
        uint256 reserve = c.reserveBalance();

        address[] memory recipients = new address[](2);
        uint256[] memory amounts = new uint256[](2);
        recipients[0] = address(0xBEEF);
        recipients[1] = address(0xCAFE);
        amounts[0] = 1e18;
        amounts[1] = 2e18;
        bytes32 ref = keccak256("test-batch");

        if (reserve >= 3e18) {
            vm.prank(ownerAddr);
            c.batchContestReward(recipients, amounts, ref);
            assertEq(c.totalContestPaidG(), 3e18, "contest paid not tracked");
        }

        uint256[] memory bad = new uint256[](1);
        bad[0] = 1e18;
        vm.prank(ownerAddr);
        vm.expectRevert(OnwardClaims.LengthMismatch.selector);
        c.batchContestReward(recipients, bad, ref);

        vm.prank(address(0xD00D));
        vm.expectRevert();
        c.batchContestReward(recipients, amounts, ref);
    }
}
