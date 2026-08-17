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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isVerifyingRef = useRef(isVerifying);
  isVerifyingRef.current = isVerifying;

  const isGeneratingRef = useRef(false);

  const checkVerification = useCallback(async () => {
    if (!address || !publicClient || !walletClient) {
      setStatus("loading");
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
      setErrorMessage(
        err instanceof Error ? err.message : "Verification check failed",
      );
      setStatus("error");
    }
  }, [address, publicClient, walletClient]);

  useEffect(() => {
    checkVerification();
  }, [checkVerification]);


  const generateLink = useCallback(async () => {
    // Guard via ref, not state, so this callback is stable and isn't recreated
    // every time the generating flag flips.
    if (!address || !publicClient || !walletClient) return;
    if (isGeneratingRef.current) return;

    isGeneratingRef.current = true;
    setIsGeneratingLink(true);
    setErrorMessage(null);

    try {
      const sdk = await IdentitySDK.init({
        publicClient,
        walletClient,
        env: GD_ENV,
      });

      const link = await Promise.race<string | null>([
        sdk.generateFVLink(
          false,
          typeof window !== "undefined" ? window.location.href : undefined,
          celo.id,
        ),
        new Promise<null>((_, reject) =>
          setTimeout(
            () => reject(new Error("Link generation timed out")),
            20000,
          ),
        ),
      ]);

      if (link) {
        setFvLink(link);
      } else {
        console.error("[useIdentity] generateFVLink returned no link");
        setErrorMessage("Verification link came back empty. Please try again.");
        setStatus("error");
      }
    } catch (err) {
      console.error("[useIdentity] generateLink failed", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Could not start verification",
      );
      setStatus("error");
    } finally {
      isGeneratingRef.current = false;
      setIsGeneratingLink(false);
    }
  }, [address, publicClient, walletClient]);

  useEffect(() => {
    if (
      isVerifying &&
      !fvLink &&
      !isGeneratingLink &&
      address &&
      publicClient &&
      walletClient
    ) {
      generateLink();
    }
  }, [
    isVerifying,
    fvLink,
    isGeneratingLink,
    address,
    publicClient,
    walletClient,
    generateLink,
  ]);

 
  useEffect(() => {
    if (!isVerifying || status === "verified") return;
    const interval = setInterval(() => {
      checkVerification();
    }, 5000);
    return () => clearInterval(interval);
  }, [isVerifying, status, checkVerification]);

  const retry = useCallback(() => {
    setErrorMessage(null);
    setFvLink(null);
    setStatus("loading");
    setIsVerifying(true);
  }, []);

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
    errorMessage,
    retry,
  };
}