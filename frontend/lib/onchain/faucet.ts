import type { Address } from "viem";
import { publicClient, walletClient } from "@/lib/onchain/badges";
import { CONTRACT_ADDRESSES }from "@/constants/contracts/address";

const FAUCET_ADDRESS = CONTRACT_ADDRESSES.celoFaucet;

const FAUCET_ABI = [
  {
    name: "canTop",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "topWallet",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [],
  },
] as const;

export async function canTopUp(userWallet: Address): Promise<boolean> {
  try {
    return (await publicClient.readContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "canTop",
      args: [userWallet],
    })) as boolean;
  } catch (err) {
    console.error("[faucet] canTop failed", err);
    return false;
  }
}

export type TopUpResult = {
  topped: boolean;
  txHash: `0x${string}` | null;
};

export async function topUpUser(userWallet: Address): Promise<TopUpResult> {
  const eligible = await canTopUp(userWallet);
  if (!eligible) {
    return { topped: false, txHash: null };
  }

  const { request } = await publicClient.simulateContract({
    account: walletClient.account,
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "topWallet",
    args: [userWallet],
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return { topped: true, txHash };
}
