"use client";

import { useReadContract } from "wagmi";
import { parseUnits, type Address } from "viem";
import { whackStakeAbi, gDollarAbi } from "@/constants/abis";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";
import { useContractWrite } from "./useContractWrite";

export function useWhackStake() {
  const approveWrite = useContractWrite();
  const stakeWrite = useContractWrite();

  const approve = (amount: bigint) => {
    approveWrite.write({
      address: CONTRACT_ADDRESSES.gDollar,
      abi: gDollarAbi,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES.whackStake, amount],
    });
  };

  const stake = (roundIdHash: `0x${string}`) => {
    stakeWrite.write({
      address: CONTRACT_ADDRESSES.whackStake,
      abi: whackStakeAbi,
      functionName: "stake",
      args: [roundIdHash],
    });
  };

  return {
    approve,
    stake,
    approveState: approveWrite,
    stakeState: stakeWrite,
  };
}

export function useStakeAmount(enabled = true) {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.whackStake,
    abi: whackStakeAbi,
    functionName: "stakeAmount",
    query: { enabled },
  });
  return {
    stakeAmount: (data as bigint | undefined) ?? parseUnits("10", 18),
    isLoading,
  };
}

export function useStakeAllowance(
  userAddress: Address | undefined,
  enabled = true
) {
  const shouldRun = enabled && Boolean(userAddress);
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.gDollar,
    abi: gDollarAbi,
    functionName: "allowance",
    args: userAddress
      ? [userAddress, CONTRACT_ADDRESSES.whackStake]
      : undefined,
    query: { enabled: shouldRun },
  });
  return {
    allowance: (data as bigint | undefined) ?? 0n,
    isLoading,
    refetch,
  };
}

export function useGDollarBalance(
  userAddress: Address | undefined,
  enabled = true
) {
  const shouldRun = enabled && Boolean(userAddress);
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.gDollar,
    abi: gDollarAbi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: shouldRun },
  });
  return {
    balance: (data as bigint | undefined) ?? 0n,
    isLoading,
    refetch,
  };
}