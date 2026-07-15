import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toBytes,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { onwardBadgesAbi } from "@/constants/abis";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";

const BACKEND_PRIVATE_KEY = process.env.BACKEND_SIGNER_PRIVATE_KEY!;
const RPC_URL = process.env.NEXT_PUBLIC_CELO_URL!;

const account = privateKeyToAccount(
  BACKEND_PRIVATE_KEY.startsWith("0x")
    ? (BACKEND_PRIVATE_KEY as `0x${string}`)
    : (`0x${BACKEND_PRIVATE_KEY}` as `0x${string}`)
);

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(RPC_URL),
});

export const walletClient = createWalletClient({
  account,
  chain: celo,
  transport: http(RPC_URL),
});

const ZERO_HASH = ("0x" + "0".repeat(64)) as `0x${string}`;

// ============================================================
// Helpers
// ============================================================

export function slugHash(slug: string): `0x${string}` {
  return keccak256(toBytes(slug));
}

export function makeClaimId(
  userWallet: Address,
  moduleSlug: string
): `0x${string}` {
  return keccak256(toBytes(`${userWallet.toLowerCase()}:${moduleSlug}`));
}

export function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return `https://gateway.pinata.cloud/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

// ============================================================
// Process completion (mint + distribute|accrue)
// ============================================================

export type CompletionTxResult = {
  txHash: `0x${string}` | null;
  badgeTokenId: bigint;
  alreadyMinted: boolean;
};

export async function mintModuleBadge(args: {
  userWallet: Address;
  moduleSlug: string;
}): Promise<CompletionTxResult> {
  const { userWallet, moduleSlug } = args;
  const contract = CONTRACT_ADDRESSES.onwardBadges;

  const existing = (await publicClient.readContract({
    address: contract,
    abi: onwardBadgesAbi,
    functionName: "earnedTokenId",
    args: [userWallet, slugHash(moduleSlug)],
  })) as bigint;

  if (existing !== 0n) {
    return { txHash: null, badgeTokenId: existing, alreadyMinted: true };
  }

  const txHash = await walletClient.writeContract({
    address: contract,
    abi: onwardBadgesAbi,
    functionName: "mint",
    args: [userWallet, moduleSlug],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  const badgeTokenId = (await publicClient.readContract({
    address: contract,
    abi: onwardBadgesAbi,
    functionName: "earnedTokenId",
    args: [userWallet, slugHash(moduleSlug)],
  })) as bigint;

  return { txHash, badgeTokenId, alreadyMinted: false };
}

// ============================================================
// Claim pending (signer releases user's pending balance)
// ============================================================

export type ClaimPendingResult = {
  txHash: `0x${string}`;
  amount: bigint;
};

export async function claimPendingForUser(
  userWallet: Address
): Promise<ClaimPendingResult> {
  const contract = CONTRACT_ADDRESSES.onwardBadges;

  const pendingBefore = (await publicClient.readContract({
    address: contract,
    abi: onwardBadgesAbi,
    functionName: "pendingClaim",
    args: [userWallet],
  })) as bigint;

  if (pendingBefore === 0n) {
    return { txHash: ZERO_HASH, amount: 0n };
  }

  const txHash = await walletClient.writeContract({
    address: contract,
    abi: onwardBadgesAbi,
    functionName: "claimPending",
    args: [userWallet],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    txHash,
    amount: pendingBefore,
  };
}

// ============================================================
// Read pending balance (used by API routes)
// ============================================================

export async function getPendingBalance(
  userWallet: Address
): Promise<bigint> {
  return (await publicClient.readContract({
    address: CONTRACT_ADDRESSES.onwardBadges,
    abi: onwardBadgesAbi,
    functionName: "pendingClaim",
    args: [userWallet],
  })) as bigint;
}