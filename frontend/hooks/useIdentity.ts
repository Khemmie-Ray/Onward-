"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection } from "wagmi";
import { usePublicClient, useWalletClient } from "wagmi";
import { celo } from "wagmi/chains";
import { IdentitySDK } from "@goodsdks/citizen-sdk";

const GD_ENV = "production" as const;

export type IdentityStatus = "loading" | "verified" | "not_verified" | "error";

export function useIdentity() {
  const { address } = useConnection();
  const publicClient = usePublicClient({ chainId: celo.id });
  const { data: walletClient } = useWalletClient({ chainId: celo.id });

  const [status, setStatus] = useState<IdentityStatus>("loading");
  const [fvLink, setFvLink] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const isVerifyingRef = useRef(isVerifying);
  isVerifyingRef.current = isVerifying;

  const checkVerification = useCallback(async () => {
    // console.log("[useIdentity] checkVerification called", {
    //   address,
    //   hasPublicClient: !!publicClient,
    //   hasWalletClient: !!walletClient,
    // });

    if (!address || !publicClient || !walletClient) {
      console.log("[useIdentity] missing prerequisites → not_verified");
      setStatus("not_verified");
      return;
    }

    try {
      if (!isVerifyingRef.current) setStatus("loading");

      // console.log("[useIdentity] constructing SDK");
      const sdk = new IdentitySDK({
        account: address as `0x${string}`,
        publicClient,
        walletClient,
        env: GD_ENV,
      } as any);

      console.log("[useIdentity] calling getWhitelistedRoot");
      const result = await sdk.getWhitelistedRoot(address as `0x${string}`);

      let isWhitelisted = false;

      if (typeof result === "string") {
        isWhitelisted =
          (result as string).toLowerCase() !==
          "0x0000000000000000000000000000000000000000";
      } else if (result && typeof result === "object") {
        const obj = result as any;
        if ("isWhitelisted" in obj) {
          isWhitelisted = Boolean(obj.isWhitelisted);
        } else if ("root" in obj && typeof obj.root === "string") {
          isWhitelisted =
            obj.root.toLowerCase() !==
            "0x0000000000000000000000000000000000000000";
        }
      }

      // console.log("[useIdentity] result:", {
      //   address,
      //   result,
      //   resultType: typeof result,
      //   isWhitelisted,
      // });

      if (isWhitelisted) {
        setStatus("verified");
        setIsVerifying(false);
      } else {
        setStatus("not_verified");
      }
    } catch (err) {
      console.error("[useIdentity] check failed", err);
      setStatus("error");
    }
  }, [address, publicClient, walletClient]);
  // ─── Initial + on-change check ──────────────────────────
  useEffect(() => {
    checkVerification();
  }, [checkVerification]);

  // ─── FV link generation ─────────────────────────────────
  const generateLink = useCallback(async () => {
    if (!address || !publicClient || !walletClient || isGeneratingLink) {
      return;
    }

    try {
      setIsGeneratingLink(true);

      const sdk = new IdentitySDK({
        account: address as `0x${string}`,
        publicClient,
        walletClient,
        env: GD_ENV,
      } as any);

      const result = await sdk.generateFVLink(
        false,
        typeof window !== "undefined" ? window.location.href : undefined,
        celo.id,
      );

      const link =
        typeof result === "string" ? result : ((result as any)?.link ?? null);

      if (link) {
        setFvLink(link);
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("[useIdentity] generateLink failed", err);
      setStatus("error");
    } finally {
      setIsGeneratingLink(false);
    }
  }, [address, publicClient, walletClient, isGeneratingLink]);

  // Generate link when verification starts
  useEffect(() => {
    if (isVerifying && !fvLink && !isGeneratingLink) {
      generateLink();
    }
  }, [isVerifying, fvLink, isGeneratingLink, generateLink]);

  // Poll for verification during active flow
  useEffect(() => {
    if (!isVerifying || status === "verified") return;
    const interval = setInterval(() => {
      checkVerification();
    }, 5000);
    return () => clearInterval(interval);
  }, [isVerifying, status, checkVerification]);

  const startVerifying = useCallback(() => setIsVerifying(true), []);
  const stopVerifying = useCallback(() => setIsVerifying(false), []);

  return {
    status,
    isVerified: status === "verified",
    isLoading: status === "loading",
    fvLink,
    refresh: checkVerification,
    startVerifying,
    stopVerifying,
    isVerifying,
    isGeneratingLink,
  };
}
