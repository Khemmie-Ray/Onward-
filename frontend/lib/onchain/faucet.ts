import type { Address } from "viem";
import { parseEther } from "viem";
import {
  publicClient,
  walletClient,
  waitForReceipt,
} from "@/lib/onchain/badges";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";

const FAUCET_ADDRESS = CONTRACT_ADDRESSES.celoFaucet;

export const MIN_GAS_CELO = parseEther("0.2");

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

export type GasPrepResult = {
  ready: boolean;
  topped: boolean;
  txHash: `0x${string}` | null;
  balance: bigint;
  reason: "already_sufficient" | "topped" | "faucet_declined" | "faucet_failed";
};

export async function ensureGas(userWallet: Address): Promise<GasPrepResult> {
  const balance = await publicClient.getBalance({ address: userWallet });

  if (balance >= MIN_GAS_CELO) {
    return {
      ready: true,
      topped: false,
      txHash: null,
      balance,
      reason: "already_sufficient",
    };
  }

  const eligible = await canTopUp(userWallet);
  if (!eligible) {
    return {
      ready: false,
      topped: false,
      txHash: null,
      balance,
      reason: "faucet_declined",
    };
  }

  try {
    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "topWallet",
      args: [userWallet],
    });
    const txHash = await walletClient.writeContract(request);
    await waitForReceipt(txHash);

    const newBalance = await publicClient.getBalance({ address: userWallet });
    return {
      ready: newBalance >= MIN_GAS_CELO,
      topped: true,
      txHash,
      balance: newBalance,
      reason: "topped",
    };
  } catch (err) {
    console.error("[faucet] topWallet failed", err);
    return {
      ready: false,
      topped: false,
      txHash: null,
      balance,
      reason: "faucet_failed",
    };
  }
}

export async function topUpUser(userWallet: Address): Promise<{
  topped: boolean;
  txHash: `0x${string}` | null;
}> {
  const r = await ensureGas(userWallet);
  return { topped: r.topped, txHash: r.txHash };
}
