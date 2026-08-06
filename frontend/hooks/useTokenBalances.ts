"use client";

import { useBalance, useReadContract, useReadContracts } from "wagmi";
import { celo } from "wagmi/chains";
import { formatUnits, erc20Abi, type Address } from "viem";

export const TOKENS = {
  gDollar: {
    symbol: "G$",
    name: "GoodDollar",
    address: "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A" as Address,
  },
  usdt: {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as Address,
  },
} as const;

export type TokenBalance = {
  symbol: string;
  name: string;
  raw: bigint;
  decimals: number;
  formatted: string;
  isLoading: boolean;
};

export function useTokenBalances(address: Address | undefined) {
  const enabled = Boolean(address);

  const celoBalance = useBalance({
    address,
    chainId: celo.id,
    query: { enabled, refetchInterval: 30_000 },
  });

  const decimalsResult = useReadContracts({
    contracts: [
      {
        address: TOKENS.gDollar.address,
        abi: erc20Abi,
        functionName: "decimals",
        chainId: celo.id,
      },
      {
        address: TOKENS.usdt.address,
        abi: erc20Abi,
        functionName: "decimals",
        chainId: celo.id,
      },
    ],
    query: { enabled, staleTime: Infinity },
  });

  const balancesResult = useReadContracts({
    contracts: [
      {
        address: TOKENS.gDollar.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: celo.id,
      },
      {
        address: TOKENS.usdt.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: celo.id,
      },
    ],
    query: { enabled, refetchInterval: 30_000 },
  });

  const gDollarDecimals =
    (decimalsResult.data?.[0]?.result as number | undefined) ?? 18;
  const usdtDecimals =
    (decimalsResult.data?.[1]?.result as number | undefined) ?? 6;

  const gDollarRaw =
    (balancesResult.data?.[0]?.result as bigint | undefined) ?? 0n;
  const usdtRaw =
    (balancesResult.data?.[1]?.result as bigint | undefined) ?? 0n;

  const balances: TokenBalance[] = [
    {
      symbol: "CELO",
      name: "Celo",
      raw: celoBalance.data?.value ?? 0n,
      decimals: celoBalance.data?.decimals ?? 18,
      formatted: formatUnits(
        celoBalance.data?.value ?? 0n,
        celoBalance.data?.decimals ?? 18,
      ),
      isLoading: celoBalance.isLoading,
    },
    {
      symbol: TOKENS.gDollar.symbol,
      name: TOKENS.gDollar.name,
      raw: gDollarRaw,
      decimals: gDollarDecimals,
      formatted: formatUnits(gDollarRaw, gDollarDecimals),
      isLoading: balancesResult.isLoading,
    },
    {
      symbol: TOKENS.usdt.symbol,
      name: TOKENS.usdt.name,
      raw: usdtRaw,
      decimals: usdtDecimals,
      formatted: formatUnits(usdtRaw, usdtDecimals),
      isLoading: balancesResult.isLoading,
    },
  ];

  return {
    balances,
    isLoading: celoBalance.isLoading || balancesResult.isLoading,
    refetch: () => {
      celoBalance.refetch();
      balancesResult.refetch();
    },
  };
}

export function formatBalance(value: string, maxDecimals = 4): string {
  const [whole, fraction = ""] = value.split(".");
  const wholeNum = Number(whole).toLocaleString();
  if (!fraction) return wholeNum;
  const trimmed = fraction.slice(0, maxDecimals).replace(/0+$/, "");
  return trimmed ? `${wholeNum}.${trimmed}` : wholeNum;
}
