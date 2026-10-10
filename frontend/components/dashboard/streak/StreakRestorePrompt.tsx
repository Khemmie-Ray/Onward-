"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Loader2 } from "lucide-react";
import { useConnection } from "wagmi";
import { toast } from "sonner";
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
      is_first_restore?: boolean;
      current_streak: number;
    };

export function StreakRestorePrompt({
  onRestore,
}: {
  onRestore?: (args: { price: number; missedDays: string[] }) => Promise<void>;
}) {
  const authFetch = useAuthFetch();
  const qc = useQueryClient();
  const { address: caipAddress } = useConnection();
  const address = caipAddress?.split(":").pop()?.toLowerCase() as
    | `0x${string}`
    | undefined;

  const [step, setStep] = useState<"idle" | "approving" | "restoring">("idle");
  const [bridging, setBridging] = useState(false);
  const toastId = useRef<string | number | null>(null);

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

  const busy = step !== "idle" || bridging;

  useEffect(() => {
    if (step !== "approving") return;
    if (approveState.isPending) {
      toastId.current = toast.loading("Approve the G$ spend in your wallet…", {
        id: toastId.current ?? undefined,
      });
    } else if (approveState.isConfirming) {
      toastId.current = toast.loading("Confirming approval…", {
        id: toastId.current ?? undefined,
      });
    }
  }, [step, approveState.isPending, approveState.isConfirming]);

  useEffect(() => {
    if (approveState.isSuccess && step === "approving") {
      refetchAllowance();
      setStep("restoring");
      restoreStreak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveState.isSuccess, step]);

  useEffect(() => {
    if (step !== "restoring") return;
    if (restoreState.isPending) {
      toastId.current = toast.loading("Confirm the restore payment…", {
        id: toastId.current ?? undefined,
      });
    } else if (restoreState.isConfirming) {
      toastId.current = toast.loading("Restoring your streak…", {
        id: toastId.current ?? undefined,
      });
    }
  }, [step, restoreState.isPending, restoreState.isConfirming]);

  useEffect(() => {
    if (
      !(restoreState.isSuccess && restoreState.txHash && step === "restoring")
    )
      return;
    setStep("idle");
    setBridging(true);

    const paidDay = data && data.restorable ? data.missed_days[0] : undefined;
    (async () => {
      try {
        const res = await authFetch("/api/streak/restore", {
          method: "POST",
          body: JSON.stringify({
            txHash: restoreState.txHash,
            day: paidDay,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "Restore failed");

        toast.success("Streak restored", {
          id: toastId.current ?? undefined,
          description: "Your streak is back. Keep it going.",
        });
        toastId.current = null;

        await Promise.all([
          refetch(),
          qc.invalidateQueries({ queryKey: ["streak", "rewards"] }),
          qc.invalidateQueries({ queryKey: ["streak", "status", "verify"] }),
          qc.invalidateQueries({ queryKey: ["streak", "restore-status"] }),
        ]);

        if (onRestore && data?.restorable) {
          await onRestore({ price: data.price, missedDays: data.missed_days });
        }
      } catch (e) {
        toast.error("Restore couldn't be completed", {
          id: toastId.current ?? undefined,
          description: e instanceof Error ? e.message : "Please try again.",
        });
        toastId.current = null;
      } finally {
        setBridging(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreState.isSuccess, restoreState.txHash, step]);

  useEffect(() => {
    const err = approveState.error ?? restoreState.error;
    if (!err || step === "idle") return;
    const msg = approveState.errorMessage ?? restoreState.errorMessage ?? "";
    const rejected = /reject|denied|user rejected/i.test(msg);
    toast.error(rejected ? "Cancelled" : "Restore failed", {
      id: toastId.current ?? undefined,
      description: rejected ? undefined : msg || "Please try again.",
    });
    toastId.current = null;
    setStep("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveState.error, restoreState.error]);

  if (isLoading || !data || !data.restorable) return null;

  const handleRestore = () => {
    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }

    if (allowance < restorePrice) {
      setStep("approving");
      approve(restorePrice);
    } else {
      setStep("restoring");
      restoreStreak();
    }
  };

  const label =
    step === "approving"
      ? "Approve…"
      : step === "restoring"
        ? "Restoring…"
        : bridging
          ? "Finishing…"
          : "Restore";

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
            You missed yesterday. Restore your {data.current_streak}-day streak
            for{" "}
            <span className="font-bold text-terracotta">{data.price} G$</span>
            {data.is_first_restore
              ? " (first restore; 200 G$ next time)."
              : " (200 G$ per restore after your first)."}{" "}
            Restore today, before the gap grows past one day.
          </div>
        </div>
        <button
          onClick={handleRestore}
          disabled={busy}
          className="shrink-0 rounded-xl bg-terracotta px-4 py-2 text-[12px] font-bold text-cream shadow-sm transition-all hover:brightness-105 active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : label}
        </button>
      </div>
    </div>
  );
}
