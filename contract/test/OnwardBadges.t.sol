// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {OnwardBadges} from "../src/OnwardBadges.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("Test G$", "G$") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract OnwardBadgesTest is Test {
    OnwardBadges badges;
    TestERC20 gDollar;

    address owner = address(0xA11CE);
    address signer = address(0xB0B);
    address user = address(0xC0DE);
    address other = address(0xDEAD);

    function setUp() public {
        gDollar = new TestERC20();

        OnwardBadges impl = new OnwardBadges();
        bytes memory initData = abi.encodeWithSelector(
            OnwardBadges.initialize.selector,
            owner,
            signer,
            address(gDollar)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        badges = OnwardBadges(address(proxy));

        // Fund reserve with 10,000 G$
        gDollar.mint(owner, 10_000e18);
        vm.startPrank(owner);
        gDollar.approve(address(badges), 10_000e18);
        badges.replenishReserve(10_000e18, "initial");
        vm.stopPrank();
    }

    // ── Authorization ─────────────────────────────────────────

    function test_NonSigner_CannotMint() public {
        vm.prank(user);
        vm.expectRevert(OnwardBadges.NotSigner.selector);
        badges.mint(user, "slug-1");
    }

    function test_NonSigner_CannotDistribute() public {
        vm.prank(user);
        vm.expectRevert(OnwardBadges.NotSigner.selector);
        badges.distribute(user, 5e18, keccak256("c"), "slug", true);
    }

    function test_NonSigner_CannotClaimPending() public {
        vm.prank(user);
        vm.expectRevert(OnwardBadges.NotSigner.selector);
        badges.claimPending(user);
    }

    function test_NonOwner_CannotSetSigner() public {
        vm.prank(user);
        vm.expectRevert();
        badges.setSigner(other);
    }

    // ── Verified path (direct payout) ─────────────────────────

    function test_VerifiedPayout_TransfersImmediately() public {
        bytes32 claimId = keccak256("c1");

        vm.prank(signer);
        (uint256 tokenId, bool wasPaidDirect) = badges.processCompletion(
            user,
            "what-is-gooddollar",
            5e18,
            claimId,
            true
        );

        assertEq(tokenId, 1);
        assertTrue(wasPaidDirect);
        assertEq(gDollar.balanceOf(user), 5e18);
        assertEq(badges.pendingClaim(user), 0);
        assertEq(badges.totalPending(), 0);
        assertEq(badges.totalDistributed(), 5e18);
    }

    // ── Unverified path (accrue to pending) ──────────────────

    function test_UnverifiedPayout_AccruesToPending() public {
        bytes32 claimId = keccak256("c1");

        vm.prank(signer);
        (, bool wasPaidDirect) = badges.processCompletion(
            user,
            "slug",
            5e18,
            claimId,
            false
        );

        assertFalse(wasPaidDirect);
        assertEq(gDollar.balanceOf(user), 0);
        assertEq(badges.pendingClaim(user), 5e18);
        assertEq(badges.totalPending(), 5e18);
        assertEq(badges.totalAccrued(), 5e18);
        assertEq(badges.totalDistributed(), 0);
    }

    function test_MultiplePendingAccumulate() public {
        vm.startPrank(signer);
        badges.processCompletion(user, "m1", 5e18, keccak256("c1"), false);
        badges.processCompletion(user, "m2", 7e18, keccak256("c2"), false);
        badges.processCompletion(user, "m3", 3e18, keccak256("c3"), false);
        vm.stopPrank();

        assertEq(badges.pendingClaim(user), 15e18);
        assertEq(badges.totalPending(), 15e18);
        assertEq(badges.balanceOf(user), 3);
    }

    // ── claimPending ──────────────────────────────────────────

    function test_ClaimPending_ReleasesFullBalance() public {
        // Accrue 10 G$ pending
        vm.prank(signer);
        badges.processCompletion(user, "m1", 10e18, keccak256("c1"), false);

        // Signer releases
        vm.prank(signer);
        badges.claimPending(user);

        assertEq(gDollar.balanceOf(user), 10e18);
        assertEq(badges.pendingClaim(user), 0);
        assertEq(badges.totalPending(), 0);
        assertEq(badges.totalClaimed(), 10e18);
    }

    function test_ClaimPending_RevertsIfZero() public {
        vm.prank(signer);
        vm.expectRevert(OnwardBadges.NoPendingClaim.selector);
        badges.claimPending(user);
    }

    function test_ClaimPending_RevertsZeroAddress() public {
        vm.prank(signer);
        vm.expectRevert(OnwardBadges.ZeroAddress.selector);
        badges.claimPending(address(0));
    }

    // ── Idempotency ───────────────────────────────────────────

    function test_DistributeSameClaimId_NoOpSecondTime() public {
        bytes32 claimId = keccak256("same");

        vm.startPrank(signer);
        bool first = badges.distribute(user, 5e18, claimId, "m1", true);
        bool second = badges.distribute(user, 5e18, claimId, "m1", true);
        vm.stopPrank();

        assertTrue(first);
        assertFalse(second);
        assertEq(gDollar.balanceOf(user), 5e18); // paid only once
    }

    function test_MintSameSlugTwice_ReturnsExistingTokenId() public {
        vm.startPrank(signer);
        uint256 first = badges.mint(user, "slug-1");
        uint256 second = badges.mint(user, "slug-1");
        vm.stopPrank();

        assertEq(first, second);
        assertEq(badges.balanceOf(user), 1);
    }

    // ── Soulbound ─────────────────────────────────────────────

    function test_CannotTransferBadge() public {
        vm.prank(signer);
        uint256 tokenId = badges.mint(user, "m1");

        vm.prank(user);
        vm.expectRevert(OnwardBadges.SoulboundCannotTransfer.selector);
        badges.transferFrom(user, other, tokenId);
    }

    function test_CannotApproveBadge() public {
        vm.prank(signer);
        uint256 tokenId = badges.mint(user, "m1");

        vm.prank(user);
        vm.expectRevert(OnwardBadges.SoulboundCannotTransfer.selector);
        badges.approve(other, tokenId);
    }

    function test_CannotSetApprovalForAll() public {
        vm.prank(user);
        vm.expectRevert(OnwardBadges.SoulboundCannotTransfer.selector);
        badges.setApprovalForAll(other, true);
    }

    // ── Reserve safety ────────────────────────────────────────

    function test_DirectPayout_RevertsIfReserveTooLow() public {
        // Build up 9_500 pending (reserve is 10_000)
        vm.startPrank(signer);
        for (uint256 i = 0; i < 19; i++) {
            badges.processCompletion(
                other,
                "slug",
                500e18,
                keccak256(abi.encode(i)),
                false
            );
        }
        vm.stopPrank();

        // Available = 500. Try to pay 600 directly to verified user.
        vm.prank(signer);
        vm.expectRevert(OnwardBadges.InsufficientReserve.selector);
        badges.distribute(user, 600e18, keccak256("over"), "slug", true);
    }

    function test_EmergencyWithdraw_RespectsPending() public {
        // Accrue 5_000 pending
        vm.prank(signer);
        badges.processCompletion(
            user,
            "m1",
            5_000e18,
            keccak256("c1"),
            false
        );

        // Reserve = 10_000. Pending = 5_000. Withdrawable = 5_000.
        vm.prank(owner);
        vm.expectRevert(OnwardBadges.InsufficientReserve.selector);
        badges.emergencyWithdraw(address(gDollar), owner, 6_000e18);

        // Exactly 5_000 succeeds
        vm.prank(owner);
        badges.emergencyWithdraw(address(gDollar), owner, 5_000e18);
        assertEq(gDollar.balanceOf(address(badges)), 5_000e18);

        // Pending claim still works after withdrawal
        vm.prank(signer);
        badges.claimPending(user);
        assertEq(gDollar.balanceOf(user), 5_000e18);
    }

    // ── Pause ─────────────────────────────────────────────────

    function test_Pause_BlocksProcessCompletion() public {
        vm.prank(owner);
        badges.pause();

        vm.prank(signer);
        vm.expectRevert();
        badges.processCompletion(user, "m1", 5e18, keccak256("c"), true);
    }

    function test_Pause_BlocksClaimPending() public {
        // Set up pending first
        vm.prank(signer);
        badges.processCompletion(user, "m1", 5e18, keccak256("c"), false);

        vm.prank(owner);
        badges.pause();

        vm.prank(signer);
        vm.expectRevert();
        badges.claimPending(user);
    }

    function test_Unpause_RestoresFunction() public {
        vm.prank(owner);
        badges.pause();
        vm.prank(owner);
        badges.unpause();

        vm.prank(signer);
        badges.processCompletion(user, "m1", 5e18, keccak256("c"), true);

        assertEq(gDollar.balanceOf(user), 5e18);
    }

    // ── Admin ─────────────────────────────────────────────────

    function test_SetSigner_ChangesAuthorization() public {
        address newSigner = address(0x9999);

        vm.prank(owner);
        badges.setSigner(newSigner);

        vm.prank(signer);
        vm.expectRevert(OnwardBadges.NotSigner.selector);
        badges.mint(user, "m1");

        vm.prank(newSigner);
        badges.mint(user, "m1");
        assertEq(badges.balanceOf(user), 1);
    }

    function test_SetSigner_RejectsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(OnwardBadges.ZeroAddress.selector);
        badges.setSigner(address(0));
    }

    function test_ModuleURI_SetAndRead() public {
        vm.prank(owner);
        badges.setModuleURI("m1", "ipfs://test-uri");

        vm.prank(signer);
        uint256 tokenId = badges.mint(user, "m1");

        assertEq(badges.tokenURI(tokenId), "ipfs://test-uri");
    }

    // ── Edge cases ────────────────────────────────────────────

    function test_DistributeZeroAmount_Reverts() public {
        vm.prank(signer);
        vm.expectRevert(OnwardBadges.ZeroAmount.selector);
        badges.distribute(user, 0, keccak256("c"), "m1", true);
    }

    function test_DistributeZeroAddress_Reverts() public {
        vm.prank(signer);
        vm.expectRevert(OnwardBadges.ZeroAddress.selector);
        badges.distribute(address(0), 5e18, keccak256("c"), "m1", true);
    }
}
