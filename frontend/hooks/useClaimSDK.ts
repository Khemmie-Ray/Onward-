"use client";

import { useMemo } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { usePublicClient, useWalletClient } from "wagmi";
import { useIdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";
import type { Address } from "viem";

export function useClaimSDK() {
  const { address } = useAppKitAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const identitySDK = useIdentitySDK("production");

  const claimSDK = useMemo(() => {
    if (!address || !publicClient || !walletClient || !identitySDK) {
      return null;
    }
    try {
      return new ClaimSDK({
        account: address as Address,
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        identitySDK: identitySDK as any,
        env: "production",
      });
    } catch (err) {
      console.error("[useClaimSDK] init failed", err);
      return null;
    }
  }, [address, publicClient, walletClient, identitySDK]);

  return {
    claimSDK,
    isReady: claimSDK !== null,
    address: address as Address | undefined,
  };
}
