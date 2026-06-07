"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useClaimSDK } from "./useClaimSDK";
import { useIdentityContext } from "@/contexts/IdentityContext";

export type ClaimState =
  | "idle"
  | "checking"
  | "available"
  | "claimed_today"
  | "not_verified"
  | "claiming"
  | "error";

export function useGoodDollarClaim() {
  const { claimSDK, isReady, address } = useClaimSDK();
  const { isVerified } = useIdentityContext();

  const [state, setState] = useState<ClaimState>("idle");
  const [entitlement, setEntitlement] = useState<bigint>(0n);
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refetchingRef = useRef(false);
  const lastFetchedAddressRef = useRef<string | null>(null);

  // ─── Read claim status from SDK ─────────────────────────
  const refetch = useCallback(async () => {
    if (refetchingRef.current) return;

    // If SDK isn't ready (no wallet, no identity), settle to a usable state
    // rather than getting stuck on "checking". The UI uses this state to
    // show a "verify first" prompt.
    if (!claimSDK || !address) {
      setState("not_verified");
      setEntitlement(0n);
      setNextClaimTime(null);
      return;
    }

    refetchingRef.current = true;

    try {
      setState("checking");
      setError(null);

      const walletStatus = await claimSDK.getWalletClaimStatus();

      // Read next claim time — non-fatal if it fails (network blip)
      let nextTime: Date | null = null;
      try {
        const t = await claimSDK.nextClaimTime();
        nextTime = t.getTime() === 0 ? null : t;
      } catch {
        nextTime = null;
      }

      setEntitlement(walletStatus.entitlement ?? 0n);
      setNextClaimTime(nextTime);

      if (walletStatus.status === "not_whitelisted") {
        setState("not_verified");
      } else if (walletStatus.status === "already_claimed") {
        setState("claimed_today");
      } else {
        setState("available");
      }
    } catch (err) {
      console.error("[useGoodDollarClaim] refetch failed", err);
      setError(err instanceof Error ? err.message : "Failed to load");
      setState("error");
    } finally {
      refetchingRef.current = false;
    }
  }, [claimSDK, address]);

  // ─── Refetch when SDK becomes ready or address changes ──
  useEffect(() => {
    if (!isReady || !address) {
      // SDK not ready yet — make sure state isn't stuck on idle/checking
      setState("not_verified");
      return;
    }

    // Avoid refetching for the same address repeatedly
    if (lastFetchedAddressRef.current === address) return;
    lastFetchedAddressRef.current = address;

    refetch();
  }, [isReady, address, refetch]);

  // ─── Refetch when verification flips to true ────────────
  useEffect(() => {
    if (isReady && isVerified) {
      // Force a refetch even if address hasn't changed
      lastFetchedAddressRef.current = null;
      refetch();
    }
  }, [isVerified, isReady, refetch]);

  // ─── Claim action ───────────────────────────────────────
  const claim = useCallback(async () => {
    if (!claimSDK) {
      toast.error("Wallet not ready");
      return;
    }
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

      await claimSDK.claim();

      toast.dismiss(loadingToast);
      toast.success("UBI claimed", {
        description: "Your G$ should land in your wallet shortly.",
      });

      // Give the chain a moment to settle before re-reading
      await new Promise((r) => setTimeout(r, 2000));
      lastFetchedAddressRef.current = null;
      await refetch();
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("[useGoodDollarClaim] claim failed", err);
      const msg = err instanceof Error ? err.message : "Claim failed";
      setError(msg);
      setState("error");
      toast.error("Couldn't claim UBI", { description: msg });
    }
  }, [claimSDK, isVerified, entitlement, refetch]);

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