import type { Address } from "viem";
import { publicClient } from "./badges";

const IDENTITY_CONTRACT_ADDRESS =
  "0xC361A6E67822a0EDc17D899227dd9FC50BD62F42" as Address;

const IDENTITY_ABI = [
  {
    name: "getWhitelistedRoot",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export async function isVerifiedOnchain(userWallet: Address): Promise<boolean> {
  const result = (await publicClient.readContract({
    address: IDENTITY_CONTRACT_ADDRESS,
    abi: IDENTITY_ABI,
    functionName: "getWhitelistedRoot",
    args: [userWallet],
  })) as string;

  return result.toLowerCase() !== ZERO_ADDRESS;
}

export async function isVerifiedOnchainSafe(
  userWallet: Address,
): Promise<boolean> {
  try {
    return await isVerifiedOnchain(userWallet);
  } catch (err) {
    console.error("[isVerifiedOnchain] check failed", err);
    return false;
  }
}
