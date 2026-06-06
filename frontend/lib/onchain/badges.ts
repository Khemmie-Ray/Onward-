import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toBytes,
  parseUnits,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celoSepolia } from "viem/chains";
import OnwardBadgesAbi from "@/constants/abis/abi.json";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";

const BACKEND_PRIVATE_KEY = process.env.BACKEND_SIGNER_PRIVATE_KEY!;
const RPC_URL =
  process.env.NEXT_PUBLIC_CELOSEPOLIA_URL!;

const account = privateKeyToAccount(
  BACKEND_PRIVATE_KEY.startsWith("0x")
    ? (BACKEND_PRIVATE_KEY as `0x${string}`)
    : (`0x${BACKEND_PRIVATE_KEY}` as `0x${string}`)
);

export const publicClient = createPublicClient({
  chain: celoSepolia,
  transport: http(RPC_URL),
});

export const walletClient = createWalletClient({
  account,
  chain: celoSepolia,
  transport: http(RPC_URL),
});

export function slugHash(slug: string): `0x${string}` {
  return keccak256(toBytes(slug));
}

export function makeClaimId(
  userWallet: Address,
  moduleSlug: string
): `0x${string}` {
  return keccak256(toBytes(`${userWallet.toLowerCase()}:${moduleSlug}`));
}


export type CompletionTxResult = {
  badgeTxHash: `0x${string}`;
  badgeTokenId: bigint;
  rewardTxHash: `0x${string}`;
};

const ZERO_HASH =
  ("0x" + "0".repeat(64)) as `0x${string}`;

export async function processCompletion(args: {
  userWallet: Address;
  moduleSlug: string;
  rewardAmountG: number;
}): Promise<CompletionTxResult> {
  const { userWallet, moduleSlug, rewardAmountG } = args;
  const contract = CONTRACT_ADDRESSES.onwardBadges;

  const existingTokenId = (await publicClient.readContract({
    address: contract,
    abi: OnwardBadgesAbi,
    functionName: "earnedTokenId",
    args: [userWallet, slugHash(moduleSlug)],
  })) as bigint;

  let badgeTxHash: `0x${string}`;
  let badgeTokenId: bigint;

  if (existingTokenId > 0n) {
    badgeTxHash = ZERO_HASH;
    badgeTokenId = existingTokenId;
  } else {
    badgeTxHash = await walletClient.writeContract({
      address: contract,
      abi: OnwardBadgesAbi,
      functionName: "mint",
      args: [userWallet, moduleSlug],
    });
    await publicClient.waitForTransactionReceipt({ hash: badgeTxHash });
    badgeTokenId = (await publicClient.readContract({
      address: contract,
      abi: OnwardBadgesAbi,
      functionName: "earnedTokenId",
      args: [userWallet, slugHash(moduleSlug)],
    })) as bigint;
  }

  // ─── Reward distribution (skip if already claimed) ───────
  const claimId = makeClaimId(userWallet, moduleSlug);
  const alreadyClaimed = (await publicClient.readContract({
    address: contract,
    abi: OnwardBadgesAbi,
    functionName: "claimed",
    args: [claimId],
  })) as boolean;

  let rewardTxHash: `0x${string}`;

  if (alreadyClaimed) {
    rewardTxHash = ZERO_HASH;
  } else {
    const amount = parseUnits(rewardAmountG.toString(), 18);
    rewardTxHash = await walletClient.writeContract({
      address: contract,
      abi: OnwardBadgesAbi,
      functionName: "distribute",
      args: [userWallet, amount, claimId],
    });
    await publicClient.waitForTransactionReceipt({ hash: rewardTxHash });
  }

  return { badgeTxHash, badgeTokenId, rewardTxHash };
}

export function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  return uri;
}