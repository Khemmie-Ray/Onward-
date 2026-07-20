"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/useAuthFetch";

export const CLAIM_TIERS = [100, 200, 500] as const;
export type ClaimTier = (typeof CLAIM_TIERS)[number];

type ClaimStatus = {
  points_balance: number;
  claimable_g: number;
};

type ClaimResult = {
  ok: true;
  tx_hash: string;
  g_amount: number;
};

export function useClaim() {
  const authFetch = useAuthFetch();

  const [status, setStatus] = useState<ClaimStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await authFetch("/api/claims/status");
      if (res.ok) {
        setStatus((await res.json()) as ClaimStatus);
      }
    } catch {
      // leave prior status; UI shows a soft error state
    } finally {
      setLoadingStatus(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const canClaimTier = useCallback(
    (tier: ClaimTier): boolean => {
      if (!status) return false;
      return status.points_balance >= tier && status.claimable_g >= tier;
    },
    [status],
  );

  const claim = useCallback(
    async (tier: ClaimTier): Promise<boolean> => {
      if (claiming) return false;
      setClaiming(true);

      const toastId = toast.loading(`Converting ${tier} points to G$...`, {
        description: "Confirming on Celo. This can take a moment.",
      });

      try {
        const res = await authFetch("/api/claims", {
          method: "POST",
          body: JSON.stringify({ points: tier }),
        });

        const data = (await res.json().catch(() => ({}))) as
          | ClaimResult
          | { error?: string };

        if (!res.ok || !("ok" in data)) {
          const message =
            "error" in data && data.error
              ? data.error
              : "Claim couldn't be completed. Your points are safe.";
          toast.error(message, { id: toastId, description: undefined });
          return false;
        }

        setLastTx(data.tx_hash);
        toast.success(`Claimed ${data.g_amount} G$`, {
          id: toastId,
          description: "Sent to your wallet.",
        });
        await refresh();
        return true;
      } catch {
        toast.error("Something went wrong. Your points are safe.", {
          id: toastId,
          description: undefined,
        });
        return false;
      } finally {
        setClaiming(false);
      }
    },
    [authFetch, claiming, refresh],
  );

  return {
    status,
    loadingStatus,
    claiming,
    lastTx,
    canClaimTier,
    claim,
    refresh,
  };
}
