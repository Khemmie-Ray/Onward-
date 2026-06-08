// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {WhackStake} from "../src/WhackStake.sol";
import {OnwardBadges} from "../src/OnwardBadges.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("Test G$", "G$") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract WhackStakeTest is Test {
    WhackStake stake;
    OnwardBadges badges;
    TestERC20 gDollar;

    address owner = address(0xA11CE);
    address signer = address(0xB0B);
    address user = address(0xC0DE);

    function setUp() public {
        gDollar = new TestERC20();

        // Badges proxy
        OnwardBadges badgesImpl = new OnwardBadges();
        bytes memory badgesInit = abi.encodeWithSelector(
            OnwardBadges.initialize.selector,
            owner,
            signer,
            address(gDollar)
        );
        badges = OnwardBadges(
            address(new ERC1967Proxy(address(badgesImpl), badgesInit))
        );

        // Stake proxy
        WhackStake stakeImpl = new WhackStake();
        bytes memory stakeInit = abi.encodeWithSelector(
            WhackStake.initialize.selector,
            owner,
            signer,
            address(gDollar),
            address(badges),
            10e18, // stakeAmount
            5e18 // bonusAmount
        );
        stake = WhackStake(
            address(new ERC1967Proxy(address(stakeImpl), stakeInit))
        );

        // Fund user + bonus pool
        gDollar.mint(user, 100e18);
        gDollar.mint(owner, 1_000e18);
        vm.startPrank(owner);
        gDollar.approve(address(stake), 100e18);
        stake.fundBonusPool(100e18);
        vm.stopPrank();
    }

    // ── Stake ─────────────────────────────────────────────────

    function test_UserCanStake() public {
        vm.startPrank(user);
        gDollar.approve(address(stake), 10e18);
        stake.stake(keccak256("round-1"));
        vm.stopPrank();

        assertEq(gDollar.balanceOf(user), 90e18);
        (address staker, uint256 amount, bool resolved) = stake.stakes(
            keccak256("round-1")
        );
        assertEq(staker, user);
        assertEq(amount, 10e18);
        assertFalse(resolved);
    }

    function test_DuplicateRoundId_Reverts() public {
        bytes32 roundId = keccak256("dup");

        vm.startPrank(user);
        gDollar.approve(address(stake), 20e18);
        stake.stake(roundId);
        vm.expectRevert(WhackStake.RoundAlreadyExists.selector);
        stake.stake(roundId);
        vm.stopPrank();
    }

    // ── Win ───────────────────────────────────────────────────

    function test_Win_RefundsStakePlusBonus() public {
        bytes32 roundId = keccak256("win");

        vm.startPrank(user);
        gDollar.approve(address(stake), 10e18);
        stake.stake(roundId);
        vm.stopPrank();

        uint256 before = gDollar.balanceOf(user);

        vm.prank(signer);
        stake.resolve(roundId, true);

        // +10 stake refund + 5 bonus = +15
        assertEq(gDollar.balanceOf(user) - before, 15e18);
        assertEq(stake.totalRefunded(), 10e18);
        assertEq(stake.totalBonusPaid(), 5e18);
    }

    function test_Win_RevertsIfBonusPoolEmpty() public {
        // Drain bonus pool first via owner withdraw
        vm.prank(owner);
        stake.withdraw(owner, 100e18);

        bytes32 roundId = keccak256("win");
        vm.startPrank(user);
        gDollar.approve(address(stake), 10e18);
        stake.stake(roundId);
        vm.stopPrank();

        vm.prank(signer);
        vm.expectRevert(WhackStake.InsufficientBonusPool.selector);
        stake.resolve(roundId, true);
    }

    // ── Loss ──────────────────────────────────────────────────

    function test_Loss_ForwardsStakeToBadgesReserve() public {
        bytes32 roundId = keccak256("loss");

        vm.startPrank(user);
        gDollar.approve(address(stake), 10e18);
        stake.stake(roundId);
        vm.stopPrank();

        uint256 reserveBefore = badges.reserveBalance();

        vm.prank(signer);
        stake.resolve(roundId, false);

        assertEq(badges.reserveBalance() - reserveBefore, 10e18);
        assertEq(stake.totalForfeited(), 10e18);
    }

    // ── Resolve safety ────────────────────────────────────────

    function test_ResolveTwice_Reverts() public {
        bytes32 roundId = keccak256("r");

        vm.startPrank(user);
        gDollar.approve(address(stake), 10e18);
        stake.stake(roundId);
        vm.stopPrank();

        vm.prank(signer);
        stake.resolve(roundId, true);

        vm.prank(signer);
        vm.expectRevert(WhackStake.RoundAlreadyResolved.selector);
        stake.resolve(roundId, true);
    }

    function test_NonSigner_CannotResolve() public {
        bytes32 roundId = keccak256("r");

        vm.startPrank(user);
        gDollar.approve(address(stake), 10e18);
        stake.stake(roundId);
        vm.stopPrank();

        vm.prank(user);
        vm.expectRevert(WhackStake.NotSigner.selector);
        stake.resolve(roundId, true);
    }

    function test_ResolveNonExistent_Reverts() public {
        vm.prank(signer);
        vm.expectRevert(WhackStake.RoundNotFound.selector);
        stake.resolve(keccak256("nope"), true);
    }

    // ── Withdrawal safety ─────────────────────────────────────

    function test_Withdraw_CannotTouchOutstandingStakes() public {
        // User stakes (unresolved)
        vm.startPrank(user);
        gDollar.approve(address(stake), 10e18);
        stake.stake(keccak256("r"));
        vm.stopPrank();

        // Contract balance = 100 (bonus pool) + 10 (stake) = 110
        // Outstanding = 10. So owner can withdraw up to 100.
        vm.prank(owner);
        vm.expectRevert(WhackStake.InsufficientBonusPool.selector);
        stake.withdraw(owner, 101e18);

        vm.prank(owner);
        stake.withdraw(owner, 100e18);
    }

    // ── Pause ─────────────────────────────────────────────────

    function test_Pause_BlocksStake() public {
        vm.prank(owner);
        stake.pause();

        vm.startPrank(user);
        gDollar.approve(address(stake), 10e18);
        vm.expectRevert();
        stake.stake(keccak256("r"));
        vm.stopPrank();
    }

    function test_Pause_BlocksResolve() public {
        bytes32 roundId = keccak256("r");
        vm.startPrank(user);
        gDollar.approve(address(stake), 10e18);
        stake.stake(roundId);
        vm.stopPrank();

        vm.prank(owner);
        stake.pause();

        vm.prank(signer);
        vm.expectRevert();
        stake.resolve(roundId, true);
    }

    // ── Bonus pool view ───────────────────────────────────────

    function test_BonusPoolBalance_ExcludesOutstandingStakes() public {
        // Bonus pool = 100. Outstanding = 0. Balance = 100.
        assertEq(stake.bonusPoolBalance(), 100e18);

        // After stake
        vm.startPrank(user);
        gDollar.approve(address(stake), 10e18);
        stake.stake(keccak256("r"));
        vm.stopPrank();

        // Contract has 110, outstanding = 10, bonus pool = 100
        assertEq(stake.bonusPoolBalance(), 100e18);

        // After win resolution (5 bonus paid, 10 refunded)
        vm.prank(signer);
        stake.resolve(keccak256("r"), true);

        // Contract has 95 (110 - 15 paid out), outstanding = 0, bonus = 95
        assertEq(stake.bonusPoolBalance(), 95e18);
    }
}
