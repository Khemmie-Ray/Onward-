"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame, Lock, Check, Loader2 } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { PanelCard, PanelCardHeader } from "../PanelCard";

type MilestoneState = "locked" | "claimable" | "claimed" | "pending";

type Milestone = {
  day: number;
  amount_g: number;
  state: MilestoneState;
};

type StreakStatus = {
  current_streak: number;
  is_verified: boolean;
  milestones: Milestone[];
};

export function StreakRewardCard() {
  const authFetch = useAuthFetch();

  const { data } = useQuery<StreakStatus>({
    queryKey: ["streak", "rewards"],
    queryFn: async () => {
      const res = await authFetch("/api/streak/status");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const streak = data?.current_streak ?? 0;
  const milestones = data?.milestones ?? [];

  const next = milestones.find((m) => m.state === "locked");
  const nextDay = next?.day ?? milestones[milestones.length - 1]?.day ?? 7;
  const pct =
    nextDay > 0 ? Math.min(100, Math.round((streak / nextDay) * 100)) : 0;

  return (
    <PanelCard>
      <PanelCardHeader
        title={
          <span className="flex items-center gap-1.5">
            <Flame size={16} strokeWidth={2.5} className="text-terracotta" />
            Streak rewards
          </span>
        }
      />

      <p className="mb-3 text-[12px] leading-snug text-fg-soft">
        {streak > 0
          ? `You're on a ${streak}-day streak. Earn G$ at each milestone, claim each once.`
          : "Start a streak to earn G$ at each milestone."}
      </p>

      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-[10.5px] font-semibold text-fg-soft">
          <span>{streak}d</span>
          <span>{nextDay}d</span>
        </div>
        <div className="h-1.5 rounded-full bg-canvas-warm">
          <div
            className="h-1.5 rounded-full bg-terracotta transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {milestones.map((m) => (
          <li key={m.day} className="flex items-center gap-2.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${stateBg(
                m.state,
              )}`}
            >
              <StateIcon state={m.state} />
            </span>
            <span className="flex-1 text-[12px] font-medium text-indigo">
              {m.day} days
            </span>
            <span className="text-[11px] font-bold tabular-nums text-fg-soft">
              {m.amount_g > 0 ? `${m.amount_g} G$` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}

function stateBg(state: MilestoneState): string {
  switch (state) {
    case "claimed":
      return "bg-forest text-paper";
    case "claimable":
      return "bg-mustard text-indigo";
    default:
      return "bg-canvas-warm text-fg-soft";
  }
}

function StateIcon({ state }: { state: MilestoneState }) {
  switch (state) {
    case "claimed":
      return <Check size={13} strokeWidth={3} />;
    case "claimable":
      return <Flame size={13} strokeWidth={2.6} />;
    case "pending":
      return <Loader2 size={13} strokeWidth={2.6} className="animate-spin" />;
    default:
      return <Lock size={12} strokeWidth={2.6} />;
  }
}
