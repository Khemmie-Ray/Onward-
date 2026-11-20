import {
  publicClient,
  walletClient,
  waitForReceipt,
} from "@/lib/onchain/badges";
import { onwardClaimsAbi } from "@/constants/abis";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";
import type { Address } from "viem";

const contract = CONTRACT_ADDRESSES.onwardClaims;

export async function isVerifiedOnchain(user: Address): Promise<boolean> {
  return (await publicClient.readContract({
    address: contract,
    abi: onwardClaimsAbi,
    functionName: "isVerified",
    args: [user],
  })) as boolean;
}

export async function streakRewardFor(day: number): Promise<bigint> {
  return (await publicClient.readContract({
    address: contract,
    abi: onwardClaimsAbi,
    functionName: "streakRewards",
    args: [BigInt(day)],
  })) as bigint;
}

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

export async function freezesOwnedOnchain(user: Address): Promise<bigint> {
  return (await publicClient.readContract({
    address: contract,
    abi: onwardClaimsAbi,
    functionName: "freezesOwned",
    args: [user],
  })) as bigint;
}

export async function consumeFreezeOnchain(
  user: Address,
): Promise<`0x${string}`> {
  const { request } = await publicClient.simulateContract({
    account: walletClient.account,
    address: contract,
    abi: onwardClaimsAbi,
    functionName: "consumeFreeze",
    args: [user],
  });
  const txHash = await walletClient.writeContract(request);
  await waitForReceipt(txHash);
  return txHash;
}
