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

    if (!address || !publicClient || !walletClient) {
      console.log("[useIdentity] missing prerequisites → not_verified");
      setStatus("not_verified");
      return;
    }

    try {
      if (!isVerifyingRef.current) setStatus("loading");

      
      const sdk = await IdentitySDK.init({
        publicClient,
        walletClient,
        env: GD_ENV,
      });

      const { isWhitelisted } = await sdk.getWhitelistedRoot(
        address as `0x${string}`,
      );

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

  useEffect(() => {
    checkVerification();
  }, [checkVerification]);


  const generateLink = useCallback(async () => {
    if (!address || !publicClient || !walletClient || isGeneratingLink) {
      return;
    }

    try {
      setIsGeneratingLink(true);

      const sdk = await IdentitySDK.init({
        publicClient,
        walletClient,
        env: GD_ENV,
      });

    
      const link = await sdk.generateFVLink(
        false,
        typeof window !== "undefined" ? window.location.href : undefined,
        celo.id,
      );

      if (link) {
        setFvLink(link);
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
  }, [address, publicClient, walletClient, isGeneratingLink]);


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
