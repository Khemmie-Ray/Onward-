"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppKitAccount } from "@reown/appkit/react";
import { usePublicClient, useWalletClient } from "wagmi";
import { celo } from "wagmi/chains";
import { ClaimSDK, IdentitySDK } from "@goodsdks/citizen-sdk";
import { useIdentityContext } from "@/contexts/IdentityContext";

const GD_ENV = "production" as const;

export type ClaimState =
  | "idle"
  | "checking"
  | "available"
  | "claimed_today"
  | "not_verified"
  | "claiming"
  | "error";

export function useGoodDollarClaim() {
  const { address } = useAppKitAccount();
  const publicClient = usePublicClient({ chainId: celo.id });
  const { data: walletClient } = useWalletClient({ chainId: celo.id });
  const { isVerified } = useIdentityContext();

  const [state, setState] = useState<ClaimState>("not_verified");
  const [entitlement, setEntitlement] = useState<bigint>(0n);
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refetchingRef = useRef(false);

  const buildSDK = useCallback(() => {
    if (!address || !publicClient || !walletClient) return null;
    const identitySDK = new IdentitySDK({
      account: address as `0x${string}`,
      publicClient,
      walletClient,
      env: GD_ENV,
    } as any);
    return new ClaimSDK({
      account: address as `0x${string}`,
      publicClient,
      walletClient,
      identitySDK,
      env: GD_ENV,
    } as any);
  }, [address, publicClient, walletClient]);

  // ─── Read claim entitlement ─────────────────────────────
  const refetch = useCallback(async () => {
    if (refetchingRef.current) return;

    if (!address || !isVerified) {
      setState("not_verified");
      setEntitlement(0n);
      setNextClaimTime(null);
      return;
    }

    refetchingRef.current = true;

    try {
      setState("checking");
      setError(null);

      const sdk = buildSDK();
      if (!sdk) {
        setState("error");
        return;
      }

      const result = await sdk.checkEntitlement();
      const amount =
        (result as any)?.amount ?? (result as any)?.entitlement ?? 0n;
      setEntitlement(amount);

      if (amount === 0n) {
        try {
          const next = await sdk.nextClaimTime();
          setNextClaimTime(next.getTime() === 0 ? null : next);
        } catch {
          setNextClaimTime(null);
        }
        setState("claimed_today");
      } else {
        setNextClaimTime(null);
        setState("available");
      }
    } catch (err) {
      console.error("[useGoodDollarClaim] refetch failed", err);
      setError(err instanceof Error ? err.message : "Failed to load");
      setState("error");
    } finally {
      refetchingRef.current = false;
    }
  }, [address, isVerified, buildSDK]);

  // Refetch when address or verification status changes
  useEffect(() => {
    refetch();
  }, [refetch]);

  // ─── Claim action ───────────────────────────────────────
  const claim = useCallback(async () => {
    if (!isVerified) {
      toast.error("Verify with GoodID first");
      return;
    }
    if (entitlement === 0n) {
      toast.error("Nothing to claim right now");
      return;
    }

    const loadingToast = toast.loading("Confirming UBI claim…");

    try {
      setState("claiming");
      setError(null);

      const sdk = buildSDK();
      if (!sdk) {
        toast.dismiss(loadingToast);
        toast.error("Wallet not ready");
        setState("error");
        return;
      }

      await sdk.claim();

      toast.dismiss(loadingToast);
      toast.success("UBI claimed", {
        description: "Your G$ should land in your wallet shortly.",
      });

      setEntitlement(0n);
      await new Promise((r) => setTimeout(r, 2000));
      await refetch();
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("[useGoodDollarClaim] claim failed", err);
      const msg = err instanceof Error ? err.message : "Claim failed";
      setError(msg);
      setState("error");
      toast.error("Couldn't claim UBI", { description: msg });
    }
  }, [isVerified, entitlement, buildSDK, refetch]);

  return {
    state,
    entitlement,
    nextClaimTime,
    error,
    claim,
    refetch,
    canClaim:
      state === "available" && isVerified && entitlement > 0n,
    isClaiming: state === "claiming",
  };
}