// On-chain helpers for streak rewards. Mirrors the existing settleClaim pattern
// (simulate -> write -> wait). walletClient is the SIGNER; streakClaim is
// signer-gated on the contract.
import {
  publicClient,
  walletClient,
  waitForReceipt,
} from "@/lib/onchain/badges";
import { onwardClaimsAbi } from "@/constants/abis";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";
import type { Address } from "viem";

const contract = CONTRACT_ADDRESSES.onwardClaims;

// Live on-chain verification, the SAME check streakClaim enforces, so the
// backend pre-check matches the contract and we never fire a doomed tx.
export async function isVerifiedOnchain(user: Address): Promise<boolean> {
  return (await publicClient.readContract({
    address: contract,
    abi: onwardClaimsAbi,
    functionName: "isVerified",
    args: [user],
  })) as boolean;
}

// The configured G$ reward for a milestone (wei). 0 = not configured.
export async function streakRewardFor(day: number): Promise<bigint> {
  return (await publicClient.readContract({
    address: contract,
    abi: onwardClaimsAbi,
    functionName: "streakRewards",
    args: [BigInt(day)],
  })) as bigint;
}

// Has this user already claimed this milestone on-chain? The contract is the
// source of truth for idempotency; we read it as a belt-and-braces pre-check.
export async function hasClaimedOnchain(
  user: Address,
  day: number,
): Promise<boolean> {
  return (await publicClient.readContract({
    address: contract,
    abi: onwardClaimsAbi,
    functionName: "streakClaimed",
    args: [user, BigInt(day)],
  })) as boolean;
}

// Pay a streak reward. Signer-gated on-chain. Returns the tx hash once mined.
export async function streakClaimOnchain(
  user: Address,
  day: number,
): Promise<`0x${string}`> {
  const { request } = await publicClient.simulateContract({
    account: walletClient.account,
    address: contract,
    abi: onwardClaimsAbi,
    functionName: "streakClaim",
    args: [user, BigInt(day)],
  });
  const txHash = await walletClient.writeContract(request);
  await waitForReceipt(txHash);
  return txHash;
}
