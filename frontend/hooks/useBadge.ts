"use client";

import { useReadContract } from "wagmi";
import { keccak256, toBytes, type Address } from "viem";
import OnwardBadgesAbi from "@/constants/abis/abi.json";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";


const slugHash = (slug: string) => keccak256(toBytes(slug));

export function useHasBadge(userAddress: Address | undefined, moduleSlug: string) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.onwardBadges,
    abi: OnwardBadgesAbi,
    functionName: "earnedTokenId",
    args: userAddress ? [userAddress, slugHash(moduleSlug)] : undefined,
    query: {
      enabled: Boolean(userAddress),
    },
  });

  const tokenId = (data as bigint | undefined) ?? 0n;

  return {
    tokenId,
    hasBadge: tokenId > 0n,
    isLoading,
    error,
    refetch,
  };
}

export function useTotalDistributed() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.onwardBadges,
    abi: OnwardBadgesAbi,
    functionName: "totalDistributed",
  });

  return {
    totalDistributed: (data as bigint | undefined) ?? 0n,
    isLoading,
    error,
    refetch,
  };
}

export function useBadgeBalance(userAddress: Address | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.onwardBadges,
    abi: OnwardBadgesAbi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress),
    },
  });

  return {
    balance: (data as bigint | undefined) ?? 0n,
    isLoading,
    error,
    refetch,
  };
}


export function useBadgeTokenURI(tokenId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.onwardBadges,
    abi: OnwardBadgesAbi,
    functionName: "tokenURI",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: Boolean(tokenId && tokenId > 0n),
    },
  });

  return {
    uri: data as string | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useModuleURI(moduleSlug: string | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.onwardBadges,
    abi: OnwardBadgesAbi,
    functionName: "moduleTokenURI",
    args: moduleSlug ? [slugHash(moduleSlug)] : undefined,
    query: {
      enabled: Boolean(moduleSlug),
    },
  });

  return {
    uri: data as string | undefined,
    isLoading,
    error,
    refetch,
  };
}