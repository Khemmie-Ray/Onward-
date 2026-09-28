"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Flame, Loader2 } from "lucide-react";
import { parseUnits } from "viem";
import { useConnection } from "wagmi";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  useStreakProtection,
  useRestorePrice,
  useClaimsAllowance,
} from "@/hooks/useStreakProtection";

type Status =
  | { restorable: false }
  | {
      restorable: true;
      missed_days: string[];
      price: number;
      current_streak: number;
    };

export function StreakRestorePrompt() {
  const authFetch = useAuthFetch();
  const { address: caipAddress } = useConnection();
  const address = caipAddress?.split(":").pop()?.toLowerCase() as
    | `0x${string}`
    | undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "idle" | "approving" | "restoring" | "bridging"
  >("idle");

  const { data, isLoading, refetch } = useQuery<Status>({
    queryKey: ["streak", "restore-status"],
    queryFn: async () => {
      const res = await authFetch("/api/streak/restore-status");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { restorePrice } = useRestorePrice(address, !!address);
  const { allowance, refetch: refetchAllowance } = useClaimsAllowance(
    address,
    !!address,
  );
  const { approve, restoreStreak, approveState, restoreState } =
    useStreakProtection();

  useEffect(() => {
    if (restoreState.isSuccess && restoreState.txHash && step === "restoring") {
      (async () => {
        setStep("bridging");
        try {
          const res = await authFetch("/api/streak/restore", {
            method: "POST",
            body: JSON.stringify({ txHash: restoreState.txHash }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error ?? "Bridge failed");
          }
          await refetch(); // clears the prompt once the streak is restored
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not finish restore");
        } finally {
          setStep("idle");
          setBusy(false);
        }
      })();
    }
  }, [restoreState.isSuccess, restoreState.txHash, step, authFetch, refetch]);

  // Once an approval confirms, proceed to the restore call.
  useEffect(() => {
    if (approveState.isSuccess && step === "approving") {
      refetchAllowance();
      setStep("restoring");
      restoreStreak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveState.isSuccess, step]);

  if (isLoading || !data || !data.restorable) return null;

  const priceWei =
    restorePrice > 0n ? restorePrice : parseUnits(String(data.price), 18);

  const handleRestore = async () => {
    setError(null);
    setBusy(true);
    if (allowance < priceWei) {
      setStep("approving");
      approve(priceWei);
    } else {
      setStep("restoring");
      restoreStreak();
    }
  };

  const label =
    step === "approving"
      ? "Approve G$…"
      : step === "restoring"
        ? "Confirming…"
        : step === "bridging"
          ? "Restoring…"
          : "Restore";

  const anyError =
    error ?? approveState.errorMessage ?? restoreState.errorMessage;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-terracotta/30 bg-terracotta/8">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-terracotta/15 text-terracotta">
          <Flame size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-indigo">
            Your streak lapsed
          </div>
          <div className="text-[11.5px] text-fg-soft leading-snug">
            Restore your {data.current_streak}-day streak within 2 days for{" "}
            <span className="font-bold text-terracotta">{data.price} G$</span>.
          </div>
          {anyError && (
            <div className="mt-1 text-[11px] text-terracotta">{anyError}</div>
          )}
        </div>
        <button
          onClick={handleRestore}
          disabled={busy}
          className="shrink-0 rounded-xl bg-terracotta px-4 py-2 text-[12px] font-bold text-cream shadow-[0_3px_0_0_#7d3420] transition-all hover:brightness-105 active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : label}
        </button>
      </div>
    </div>
  );
}
