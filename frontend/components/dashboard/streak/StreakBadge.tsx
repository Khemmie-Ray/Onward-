"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame, Star, Medal, Trophy, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

const BADGE_META: Record<
  number,
  { icon: LucideIcon; name: string; tile: string; ring: string }
> = {
  7: {
    icon: Flame,
    name: "Week One",
    tile: "bg-mustard/15 text-mustard",
    ring: "ring-mustard/30",
  },
  14: {
    icon: Star,
    name: "Two Weeks",
    tile: "bg-terracotta/15 text-terracotta",
    ring: "ring-terracotta/30",
  },
  30: {
    icon: Medal,
    name: "One Month",
    tile: "bg-indigo/15 text-indigo",
    ring: "ring-indigo/30",
  },
  60: {
    icon: Trophy,
    name: "Two Months",
    tile: "bg-forest/15 text-forest",
    ring: "ring-forest/30",
  },
};

const FALLBACK_META = {
  icon: Medal,
  name: "Milestone",
  tile: "bg-indigo/15 text-indigo",
  ring: "ring-indigo/30",
};

export function StreakBadge() {
  const authFetch = useAuthFetch();

  const { data } = useQuery<StatusResp>({
    queryKey: ["streak", "rewards"],
    queryFn: async () => {
      const res = await authFetch("/api/streak/status");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const earned = (data?.milestones ?? []).filter((m) => m.state === "claimed");

  if (earned.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl bg-paper p-4 shadow-[0_2px_10px_rgba(31,58,110,0.05)]">
      <div className="flex items-baseline justify-between">
        <div className="text-[14px] font-bold text-indigo leading-tight">
          Streak badges
        </div>
        <div className="text-[11px] font-semibold text-fg-soft">
          {earned.length} earned
        </div>
      </div>
      <p className="mt-0.5 text-[11.5px] text-fg-soft leading-snug">
        One for each streak milestone you&apos;ve claimed.
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        {earned.map((m) => {
          const meta = BADGE_META[m.day] ?? FALLBACK_META;
          const Icon = meta.icon;
          const medallion = (
            <div className="flex w-16 flex-col items-center gap-1">
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-full ring-2 ${meta.tile} ${meta.ring}`}
              >
                <Icon size={22} strokeWidth={2.25} />
                <span className="absolute -bottom-1 rounded-full bg-indigo px-1.5 py-[1px] text-[9px] font-bold text-cream shadow-sm">
                  {m.day}d
                </span>
              </div>
              <span className="text-center text-[10px] font-semibold text-fg-soft leading-tight">
                {meta.name}
              </span>
            </div>
          );

          return m.tx_hash ? (
            <a
              key={m.day}
              href={`${EXPLORER_BASE}tx/${m.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`${m.day}-day reward proof`}
              className="group transition-transform hover:-translate-y-0.5"
            >
              {medallion}
              <span className="mt-0.5 flex items-center justify-center gap-0.5 text-[9px] font-semibold text-fg-soft/70 opacity-0 transition-opacity group-hover:opacity-100">
                proof <ExternalLink size={8} strokeWidth={2.5} />
              </span>
            </a>
          ) : (
            <div key={m.day}>{medallion}</div>
          );
        })}
      </div>
    </div>
  );
}
