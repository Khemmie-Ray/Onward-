"use client";

import { useReadContract } from "wagmi";
import { type Address } from "viem";
import { onwardClaimsAbi, gDollarAbi } from "@/constants/abis";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";
import { useContractWrite } from "./useContractWrite";

export function useStreakProtection() {
  const approveWrite = useContractWrite();
  const freezeWrite = useContractWrite();
  const restoreWrite = useContractWrite();

  const approve = (amount: bigint) => {
    approveWrite.write({
      address: CONTRACT_ADDRESSES.gDollar,
      abi: gDollarAbi,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES.onwardClaims, amount],
    });
  };

  const buyFreeze = () => {
    freezeWrite.write({
      address: CONTRACT_ADDRESSES.onwardClaims,
      abi: onwardClaimsAbi,
      functionName: "buyFreeze",
    });
  };

  const restoreStreak = () => {
    restoreWrite.write({
      address: CONTRACT_ADDRESSES.onwardClaims,
      abi: onwardClaimsAbi,
      functionName: "restoreStreak",
    });
  };

  return {
    approve,
    buyFreeze,
    restoreStreak,
    approveState: approveWrite,
    freezeState: freezeWrite,
    restoreState: restoreWrite,
  };
}

export function useFreezePrice(enabled = true) {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.onwardClaims,
    abi: onwardClaimsAbi,
    functionName: "freezePrice",
    query: { enabled },
  });
  return { freezePrice: (data as bigint | undefined) ?? 0n, isLoading };
}

export function useRestorePrice(user: Address | undefined, enabled = true) {
  const shouldRun = enabled && Boolean(user);
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.onwardClaims,
    abi: onwardClaimsAbi,
    functionName: "restorePriceFor",
    args: user ? [user] : undefined,
    query: { enabled: shouldRun },
  });
  return { restorePrice: (data as bigint | undefined) ?? 0n, isLoading };
}

export function useFreezesOwned(user: Address | undefined, enabled = true) {
  const shouldRun = enabled && Boolean(user);
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.onwardClaims,
    abi: onwardClaimsAbi,
    functionName: "freezesOwned",
    args: user ? [user] : undefined,
    query: { enabled: shouldRun },
  });
  return {
    freezesOwned: (data as bigint | undefined) ?? 0n,
    isLoading,
    refetch,
  };
}

export function useClaimsAllowance(user: Address | undefined, enabled = true) {
  const shouldRun = enabled && Boolean(user);
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.gDollar,
    abi: gDollarAbi,
    functionName: "allowance",
    args: user ? [user, CONTRACT_ADDRESSES.onwardClaims] : undefined,
    query: { enabled: shouldRun },
  });
  return { allowance: (data as bigint | undefined) ?? 0n, isLoading, refetch };
}
