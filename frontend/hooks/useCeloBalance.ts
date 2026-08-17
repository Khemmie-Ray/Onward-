"use client";

import { useBalance } from "wagmi";
import { celo } from "wagmi/chains";
import { type Address } from "viem";

export function useCeloBalance(
  userAddress: Address | undefined,
  enabled = true,
) {
  const { data, isLoading, refetch } = useBalance({
    address: userAddress,
    chainId: celo.id,
    query: { enabled: enabled && Boolean(userAddress) },
  });

  return {
    celoWei: data?.value ?? 0n,
    isLoading,
    refetch,
  };
}
