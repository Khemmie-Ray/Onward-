"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Loader2, Check, Lock, Flame, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { EXPLORER_BASE } from "@/constants/contracts/address";

type MilestoneState = "locked" | "claimable" | "claimed" | "pending";
type Milestone = {
  day: number;
  amount_g: number;
  state: MilestoneState;
  tx_hash: string | null;
};
type StatusResp = {
  current_streak: number;
  is_verified: boolean;
  milestones: Milestone[];
};

export function StreakRewards() {
  const authFetch = useAuthFetch();
  const qc = useQueryClient();
  const [claimingDay, setClaimingDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Id of the active claim toast, so we can replace it in place with the result.
  const claimToast = useRef<string | number | null>(null);

  const { data, isLoading } = useQuery<StatusResp>({
    queryKey: ["streak", "rewards"],
    queryFn: async () => {
      const res = await authFetch("/api/streak/status");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const claim = useMutation({
    mutationFn: async (day: number) => {
      const res = await authFetch("/api/streak/claim", {
        method: "POST",
        body: JSON.stringify({ day }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Claim failed");
      return json;
    },
    onMutate: (day) => {
      setClaimingDay(day);
      setError(null);
      const amt = data?.milestones.find((m) => m.day === day)?.amount_g ?? 0;
      claimToast.current = toast.loading(
        amt > 0
          ? `Releasing your ${amt.toLocaleString()} G$ reward…`
          : "Releasing your reward…",
      );
    },
    onSuccess: (_res, day) => {
      const amt = data?.milestones.find((m) => m.day === day)?.amount_g ?? 0;
      toast.success(
        amt > 0 ? `Claimed ${amt.toLocaleString()} G$` : "Reward claimed",
        {
          id: claimToast.current ?? undefined,
          description: "It should land in your wallet shortly.",
        },
      );
      claimToast.current = null;
    },
    onError: (e: Error) => {
      setError(e.message);
      toast.error("Claim failed", {
        id: claimToast.current ?? undefined,
        description: e.message,
      });
      claimToast.current = null;
    },
    onSettled: () => {
      setClaimingDay(null);
      qc.invalidateQueries({ queryKey: ["streak", "rewards"] });
    },
  });

  if (isLoading) {
    return (
      <div className="py-10 flex items-center justify-center text-fg-soft">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  const { current_streak, is_verified, milestones } = data!;
  const nextTarget =
    milestones.find((m) => m.day > current_streak)?.day ??
    milestones[milestones.length - 1]?.day ??
    7;

  return (
    <div className="mx-auto w-full max-w-110">
      <div className="flex items-center justify-center gap-2 mb-5">
        <MiniCalendar
          label="0"
          tone={current_streak > 0 ? "done" : "upcoming"}
        />
        <div
          className={`h-1.5 flex-1 rounded-full ${
            current_streak > 0 ? "bg-mustard/40" : "bg-canvas-warm"
          }`}
        />
        <div className="relative">
          <Flame
            size={30}
            className={`absolute -top-4 left-1/2 -translate-x-1/2 ${
              current_streak > 0 ? "text-terracotta" : "text-fg-soft/30"
            }`}
            fill="currentColor"
          />
          <MiniCalendar
            label={String(current_streak)}
            tone={current_streak > 0 ? "active" : "idle"}
            big
          />
        </div>
        <div className="h-1.5 flex-1 rounded-full bg-canvas-warm" />
        <MiniCalendar label={String(nextTarget)} tone="upcoming" />
      </div>

      <h2 className="display text-[20px] font-bold text-indigo text-center">
        Your streak rewards
      </h2>
      <p className="mt-1 mb-5 text-center text-[13px] text-fg-soft leading-relaxed">
        You&apos;re on a {current_streak}-day streak. Earn G$ as you hit each
        milestone, claim each once.
      </p>

      {!is_verified && (
        <div className="mb-4 rounded-xl bg-mustard/10 border border-mustard/30 px-4 py-2.5 text-center text-[12px] text-indigo">
          Verify with GoodID to claim your rewards.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-terracotta/10 border border-terracotta/30 px-4 py-2.5 text-center text-[12px] text-terracotta">
          {error}
        </div>
      )}

      {/* ── Reward rows: reference layout, claim-per-row behavior ── */}
      <div className="space-y-3">
        {milestones.map((m) => {
          const busy = claimingDay === m.day;
          const claimable = m.state === "claimable" && is_verified;
          return (
            <div
              key={m.day}
              className={`flex items-center justify-between rounded-2xl border px-5 py-4 transition-colors ${
                m.state === "claimed"
                  ? "border-forest/30 bg-forest/5"
                  : m.state === "claimable"
                    ? "border-mustard/50 bg-paper"
                    : "border-fg-soft/15 bg-canvas-warm/30"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`display text-[17px] font-bold ${
                    m.state === "locked" ? "text-fg-soft/60" : "text-indigo"
                  }`}
                >
                  {m.day} days
                </span>
                {m.state === "locked" && (
                  <Lock
                    size={13}
                    strokeWidth={2.5}
                    className="text-fg-soft/40"
                  />
                )}
              </div>

              <div className="flex items-center gap-3">
                {m.state === "claimed" ? (
                  <span className="inline-flex items-center gap-1 text-[13px] font-bold text-forest">
                    <Check size={14} strokeWidth={3} /> Claimed
                  </span>
                ) : m.state === "pending" ? (
                  <span className="text-[13px] font-semibold text-fg-soft">
                    Processing…
                  </span>
                ) : m.state === "locked" ? (
                  <span className="text-[13px] font-semibold text-fg-soft">
                    {m.amount_g > 0
                      ? `Earn ${m.amount_g.toLocaleString()} G$`
                      : "Reward coming soon"}
                  </span>
                ) : m.amount_g > 0 ? (
                  <button
                    onClick={() => claim.mutate(m.day)}
                    disabled={!claimable || busy}
                    className="rounded-xl bg-terracotta px-4 py-2 text-[12px] font-bold text-cream shadow-[0_3px_0_0_#7d3420] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-[0_1px_0_0_#7d3420] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0"
                  >
                    {busy ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      `Claim ${m.amount_g.toLocaleString()} G$`
                    )}
                  </button>
                ) : (
                  <span className="text-[13px] font-semibold text-fg-soft">
                    Reward coming soon
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Proof links for claimed rows */}
      {milestones.some((m) => m.state === "claimed" && m.tx_hash) && (
        <div className="mt-4 space-y-1">
          {milestones
            .filter((m) => m.state === "claimed" && m.tx_hash)
            .map((m) => (
              <a
                key={m.day}
                href={`${EXPLORER_BASE}tx/${m.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-[10px] font-semibold text-fg-soft hover:text-indigo"
              >
                {m.day}-day reward proof{" "}
                <ExternalLink size={9} strokeWidth={2.5} />
              </a>
            ))}
        </div>
      )}
    </div>
  );
}

// Small calendar chip for the header motif — echoes the reference's calendar
// icons, in the brand palette.
function MiniCalendar({
  label,
  tone,
  big = false,
}: {
  label: string;
  tone: "done" | "active" | "upcoming" | "idle";
  big?: boolean;
}) {
  const size = big ? "h-16 w-16" : "h-11 w-11";
  const bg =
    tone === "active"
      ? "bg-mustard"
      : tone === "done"
        ? "bg-mustard/80"
        : tone === "idle"
          ? "bg-canvas-warm border border-fg-soft/20"
          : "bg-canvas-warm border border-fg-soft/20";
  const txt =
    tone === "upcoming" || tone === "idle" ? "text-fg-soft" : "text-indigo";
  return (
    <div
      className={`${size} ${bg} flex items-center justify-center rounded-2xl shadow-sm shrink-0`}
    >
      <span
        className={`display font-bold ${big ? "text-[22px]" : "text-[16px]"} ${txt}`}
      >
        {label}
      </span>
    </div>
  );
}
