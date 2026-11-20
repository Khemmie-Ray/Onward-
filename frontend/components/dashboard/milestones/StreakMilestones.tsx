// frontend/components/dashboard/milestones/StreakMilestones.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useStreakRewards, type StreakReward } from "@/hooks/useStreakRewards";
import { MilestoneSection } from "./MilestoneSection";
import { MilestoneTile } from "./MilestoneTile";
import type { MedalState } from "./MilestoneMedal";
import { SECTION_META, streakIcon, toRoman } from "./milestoneDisplay";

/** Streak milestones, paid in G$ by the contract, with a claim button per tier. */
export function StreakMilestones() {
  const { streak, isLoading, isError } = useStreakRewards();
  const authFetch = useAuthFetch();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const claim = useMutation({
    mutationFn: async (day: number) => {
      const res = await authFetch("/api/streak/claim", {
        method: "POST",
        body: JSON.stringify({ day }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(
          json.error ?? "We couldn't release this reward. Please try again.",
        );
      }
      return json;
    },
    onMutate: () => setError(null),
    onError: (e: Error) => setError(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: ["streak", "rewards"] }),
  });

  if (isLoading || isError || !streak) return null;

  const meta = SECTION_META.streak;
  const firstLocked = streak.milestones.findIndex((m) => m.state === "locked");
  const claimed = streak.milestones.filter((m) => m.state === "claimed").length;
  const hasClaimable = streak.milestones.some((m) => m.state === "claimable");

  return (
    <MilestoneSection
      label={meta.label}
      blurb={meta.blurb}
      earned={claimed}
      total={streak.milestones.length}
      footer={
        <>
          {hasClaimable && !streak.is_verified && (
            <p className="rounded-xl border border-mustard/40 bg-mustard/10 px-4 py-2.5 text-[12.5px] text-indigo">
              Verify with GoodID to claim your streak rewards.
            </p>
          )}
          {error && (
            <p className="mt-2 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-2.5 text-[12.5px] text-terracotta">
              {error}
            </p>
          )}
        </>
      }
    >
      {streak.milestones.map((m, i) => (
        <MilestoneTile
          key={m.day}
          title={`${m.day}-day streak`}
          requirement={`Keep a ${m.day}-day streak`}
          icon={streakIcon(m.day)}
          palette={meta.palette}
          state={tileState(m, i === firstLocked)}
          roman={toRoman(i + 1)}
          reward={
            m.amount_g > 0
              ? `${m.amount_g.toLocaleString()} G$`
              : "Reward coming soon"
          }
          progress={
            i === firstLocked
              ? { value: streak.current_streak, target: m.day }
              : undefined
          }
          action={
            m.state === "claimable" ? (
              <button
                onClick={() => claim.mutate(m.day)}
                disabled={
                  !streak.is_verified || m.amount_g === 0 || claim.isPending
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-terracotta px-3 py-2 text-[12px] font-bold text-cream transition hover:brightness-105 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0"
              >
                {claim.isPending && claim.variables === m.day ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  `Claim ${m.amount_g.toLocaleString()} G$`
                )}
              </button>
            ) : m.state === "pending" ? (
              <span className="text-[12px] font-semibold text-fg-soft">
                Processing…
              </span>
            ) : undefined
          }
        />
      ))}
    </MilestoneSection>
  );
}

function tileState(m: StreakReward, isNext: boolean): MedalState {
  if (m.state === "claimed") return "earned";
  if (m.state === "claimable" || m.state === "pending") return "ready";
  return isNext ? "next" : "locked";
}
