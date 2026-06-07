"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { usePublicClient, useWalletClient } from "wagmi";
import { IdentitySDK, useIdentitySDK } from "@goodsdks/identity-sdk";
import { useClaimSDK } from "./useClaimSDK";

export type IdentityStatus =
  | "loading"
  | "verified"
  | "not_verified"
  | "error";

export function useIdentity() {
  const { address } = useAppKitAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const identitySDK = useIdentitySDK("production");
  const { claimSDK } = useClaimSDK();

  const [status, setStatus] = useState<IdentityStatus>("loading");
  const [fvLink, setFvLink] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const isVerifyingRef = useRef(isVerifying);
  isVerifyingRef.current = isVerifying;

  // ─── Verification check ─────────────────────────────────
  const checkVerification = useCallback(async () => {
    if (!address || !claimSDK) {
      setStatus("not_verified");
      return;
    }

    try {
      if (!isVerifyingRef.current) setStatus("loading");

      const walletStatus = await claimSDK.getWalletClaimStatus();

      if (walletStatus.status === "not_whitelisted") {
        setStatus("not_verified");
      } else {
        setStatus("verified");
        // If we were polling, stop — they're verified
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("[useIdentity] check failed", err);
      setStatus("error");
    }
  }, [address, claimSDK]);

  useEffect(() => {
    checkVerification();
  }, [checkVerification]);

  const generateLink = useCallback(async () => {
    if (
      !address ||
      !publicClient ||
      !walletClient ||
      !identitySDK ||
      isGeneratingLink
    ) {
      return;
    }

    try {
      setIsGeneratingLink(true);

      const idSDK = new (IdentitySDK as any)(
        publicClient,
        walletClient,
        "production"
      );

      const linkResult = await idSDK.generateFVLink(
        false,
        typeof window !== "undefined" ? window.location.href : undefined,
        42220
      );

      let finalLink: string | null = null;
      if (typeof linkResult === "string") {
        finalLink = linkResult;
      } else if (linkResult && (linkResult as any).link) {
        finalLink = (linkResult as any).link;
      }

      if (finalLink) {
        setFvLink(finalLink);
      } else {
        console.error("[useIdentity] generateFVLink returned no link");
        setStatus("error");
      }
    } catch (err) {
      console.error("[useIdentity] generateLink failed", err);
      setStatus("error");
    } finally {
      setIsGeneratingLink(false);
    }
  }, [address, publicClient, walletClient, identitySDK, isGeneratingLink]);

  useEffect(() => {
    if (isVerifying && !fvLink && !isGeneratingLink) {
      generateLink();
    }
  }, [isVerifying, fvLink, isGeneratingLink, generateLink]);

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
