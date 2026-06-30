import { keccak256, toBytes, parseUnits, type Address } from "viem";
import { onwardBadgesAbi, whackStakeAbi } from "@/constants/abis";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";
import { publicClient, walletClient } from "./badges";

export type PlayResolutionResult = {
  rewardTxHash: `0x${string}` | null;
  stakeResolveTxHash: `0x${string}` | null;
  levelBadgeTxHash: `0x${string}` | null;
  levelBadgeTokenId: bigint | null;
  wasPaidDirect: boolean;
  wasAccrued: boolean;
};

const ZERO_HASH = ("0x" + "0".repeat(64)) as `0x${string}`;
const WHACK_REWARD_SLUG = "whack-round";

export async function resolveRoundOnchain(args: {
  userWallet: Address;
  roundId: string;
  mode: "free" | "premium";
  passed: boolean;
  rewardAmountG: number;
  isVerified: boolean;
  levelBefore: number;
  levelAfter: number;
}): Promise<PlayResolutionResult> {
  const {
    userWallet,
    roundId,
    mode,
    passed,
    rewardAmountG,
    isVerified,
    levelBefore,
    levelAfter,
  } = args;

  const result: PlayResolutionResult = {
    rewardTxHash: null,
    stakeResolveTxHash: null,
    levelBadgeTxHash: null,
    levelBadgeTokenId: null,
    wasPaidDirect: false,
    wasAccrued: false,
  };

  // ─── Free mode reward distribution ────────────────────────
  // Skipped entirely when rewardAmountG is 0 (points-only mode).
  if (mode === "free" && passed && rewardAmountG > 0) {
    const claimId = keccak256(
      toBytes(`${userWallet.toLowerCase()}:round:${roundId}`),
    );

    const alreadyClaimed = (await publicClient.readContract({
      address: CONTRACT_ADDRESSES.onwardBadges,
      abi: onwardBadgesAbi,
      functionName: "claimed",
      args: [claimId],
    })) as boolean;

    if (!alreadyClaimed) {
      const amount = parseUnits(rewardAmountG.toString(), 18);
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.onwardBadges,
        abi: onwardBadgesAbi,
        functionName: "distribute",
        args: [userWallet, amount, claimId, WHACK_REWARD_SLUG, isVerified],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      result.rewardTxHash = txHash;
      if (isVerified) {
        result.wasPaidDirect = true;
      } else {
        result.wasAccrued = true;
      }
    } else {
      result.rewardTxHash = ZERO_HASH;
    }
  }

  // ─── Premium mode stake resolution (always runs) ──────────
  // Stake resolve must run regardless of bonus amount to release the
  // user's stake (refund on pass, forfeit on fail).
  if (mode === "premium") {
    const roundIdHash = keccak256(toBytes(roundId));

    const stake = (await publicClient.readContract({
      address: CONTRACT_ADDRESSES.whackStake,
      abi: whackStakeAbi,
      functionName: "stakes",
      args: [roundIdHash],
    })) as readonly [Address, bigint, boolean];

    if (
      stake[0] !== "0x0000000000000000000000000000000000000000" &&
      !stake[2]
    ) {
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.whackStake,
        abi: whackStakeAbi,
        functionName: "resolve",
        args: [roundIdHash, passed],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      result.stakeResolveTxHash = txHash;
    }
  }

  // ─── Level badge mint (if milestone crossed) ──────────────
  const milestone = findMilestoneCrossed(levelBefore, levelAfter);
  if (milestone) {
    const slug = `level-${milestone}`;
    const slugHash = keccak256(toBytes(slug));

    const existing = (await publicClient.readContract({
      address: CONTRACT_ADDRESSES.onwardBadges,
      abi: onwardBadgesAbi,
      functionName: "earnedTokenId",
      args: [userWallet, slugHash],
    })) as bigint;

    if (existing > 0n) {
      result.levelBadgeTokenId = existing;
    } else {
      try {
        const txHash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.onwardBadges,
          abi: onwardBadgesAbi,
          functionName: "mint",
          args: [userWallet, slug],
        });
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        result.levelBadgeTxHash = txHash;
        result.levelBadgeTokenId = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.onwardBadges,
          abi: onwardBadgesAbi,
          functionName: "earnedTokenId",
          args: [userWallet, slugHash],
        })) as bigint;
      } catch (err) {
        console.error(`[level badge mint failed for ${slug}]`, err);
      }
    }
  }

  return result;
}

export async function verifyStakePlaced(
  roundId: string,
  userWallet: Address,
): Promise<boolean> {
  const roundIdHash = keccak256(toBytes(roundId));
  const stake = (await publicClient.readContract({
    address: CONTRACT_ADDRESSES.whackStake,
    abi: whackStakeAbi,
    functionName: "stakes",
    args: [roundIdHash],
  })) as readonly [Address, bigint, boolean];

  return (
    stake[0].toLowerCase() === userWallet.toLowerCase() &&
    stake[1] > 0n &&
    !stake[2]
  );
}

function findMilestoneCrossed(before: number, after: number): number | null {
  const milestones = [25, 50, 100];
  for (const m of milestones) {
    if (before < m && after >= m) return m;
  }
  return null;
}
