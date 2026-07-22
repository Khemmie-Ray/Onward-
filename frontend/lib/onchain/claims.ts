import { keccak256, toBytes, type Address } from "viem";
import { publicClient, walletClient } from "@/lib/onchain/badges";
import { onwardClaimsAbi } from "@/constants/abis";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";

export function makeClaimId(userWallet: Address, nonce: string): `0x${string}` {
  return keccak256(toBytes(`${userWallet.toLowerCase()}:${nonce}`));
}

export type SettleResult = {
  txHash: `0x${string}`;
  gAmount: bigint;
};

export async function settleClaim(args: {
  userWallet: Address;
  points: number;
  claimId: `0x${string}`;
}): Promise<SettleResult> {
  const { userWallet, points, claimId } = args;
  const contract = CONTRACT_ADDRESSES.onwardClaims;

  const { request } = await publicClient.simulateContract({
    account: walletClient.account,
    address: contract,
    abi: onwardClaimsAbi,
    functionName: "settle",
    args: [userWallet, BigInt(points), claimId],
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  const gAmount = (await publicClient.readContract({
    address: contract,
    abi: onwardClaimsAbi,
    functionName: "pointsToG",
    args: [BigInt(points)],
  })) as bigint;

  return { txHash, gAmount };
}

export async function getClaimableNow(userWallet: Address): Promise<bigint> {
  return (await publicClient.readContract({
    address: CONTRACT_ADDRESSES.onwardClaims,
    abi: onwardClaimsAbi,
    functionName: "claimableNow",
    args: [userWallet],
  })) as bigint;
}

export async function recordUbiClaim(args: {
  userWallet: Address;
  amount: bigint;
  txRef: `0x${string}`;
}): Promise<`0x${string}`> {
  const { request } = await publicClient.simulateContract({
    account: walletClient.account,
    address: CONTRACT_ADDRESSES.onwardClaims,
    abi: onwardClaimsAbi,
    functionName: "recordUbiClaim",
    args: [args.userWallet, args.amount, args.txRef],
  });
  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}