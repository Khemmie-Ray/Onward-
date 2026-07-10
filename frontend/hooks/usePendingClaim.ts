"use client";

import { useCallback, useState } from "react";
import { useReadContract } from "wagmi";
import { toast } from "sonner";
import { useConnection } from "wagmi";
import { onwardBadgesAbi } from "@/constants/abis";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useIdentityContext } from "@/contexts/IdentityContext";
import type { Address } from "viem";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";

const ONWARD_BADGES_ADDRESS = CONTRACT_ADDRESSES.onwardBadges;

export function usePendingClaim() {
  const { address } = useConnection();
  const { isVerified } = useIdentityContext();
  const authFetch = useAuthFetch();

  const [isClaiming, setIsClaiming] = useState(false);

  const {
    data: pendingRaw,
    refetch,
    isLoading,
    isError,
  } = useReadContract({
    address: ONWARD_BADGES_ADDRESS,
    abi: onwardBadgesAbi,
    functionName: "pendingClaim",
    args: address ? [address as Address] : undefined,
    query: {
      enabled: Boolean(address),
      retry: 1,
      refetchOnWindowFocus: false,
    },
  });

  const pendingBalance = (pendingRaw as bigint | undefined) ?? 0n;

  const claim = useCallback(async () => {
    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }
    if (!isVerified) {
      toast.error("Verify with GoodID first");
      return;
    }
    if (pendingBalance === 0n) {
      toast.error("Nothing to claim");
      return;
    }

    setIsClaiming(true);
    const loadingToast = toast.loading("Releasing your G$…");

    try {
      const res = await authFetch("/api/badges/claim-pending", {
        method: "POST",
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Status ${res.status}`);
      }

      const data = await res.json();
      toast.dismiss(loadingToast);

      const amount = data.amountG ?? 0;
      if (amount === 0) {
        toast.info("No pending G$ to claim");
      } else {
        toast.success(`Claimed ${amount} G$`, {
          description: "Your G$ is now in your wallet.",
        });
      }

      await new Promise((r) => setTimeout(r, 2000));
      await refetch();
    } catch (err) {
      toast.dismiss(loadingToast);
      const msg = err instanceof Error ? err.message : "Claim failed";
      console.error("[usePendingClaim] claim failed", err);
      toast.error("Couldn't release pending G$", { description: msg });
    } finally {
      setIsClaiming(false);
    }
  }, [address, isVerified, pendingBalance, authFetch, refetch]);

  return {
    pendingBalance,
    isLoading: isLoading && Boolean(address),
    isError,
    isClaiming,
    canClaim: isVerified && pendingBalance > 0n && !isClaiming,
    claim,
    refetch,
  };
}