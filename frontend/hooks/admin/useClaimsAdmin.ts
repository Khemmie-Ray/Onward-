"use client";

import { useReadContract } from "wagmi";
import { type Address } from "viem";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";

export const onwardClaimsAdminAbi = [
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "reserveBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalClaimedG",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalContestPaidG",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalUbiClaimedG",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "isVerified",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "batchContestReward",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "reference", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

export function useClaimsOwner(): {
  owner: Address | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.onwardClaims,
    abi: onwardClaimsAdminAbi,
    functionName: "owner",
  });
  return { owner: data as Address | undefined, isLoading };
}

export function useIsClaimsOwner(connected: string | undefined): {
  isOwner: boolean;
  owner: Address | undefined;
  isLoading: boolean;
} {
  const { owner, isLoading } = useClaimsOwner();
  const isOwner =
    !!connected && !!owner && connected.toLowerCase() === owner.toLowerCase();
  return { isOwner, owner, isLoading };
}
