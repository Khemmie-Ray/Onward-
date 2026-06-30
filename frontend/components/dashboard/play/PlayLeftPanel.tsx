"use client";

import { Flame, Coins, Target, Trophy, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { FreeDescription } from "./FreeDescription";
import { PremiumDescription } from "./PremiumDescription";
import type { Mode, PlayStats } from "./type";

export function PlayLeftPanel({
  activeTab,
  onTabChange,
  stakeAmount,
}: {
  activeTab: Mode;
  onTabChange: (m: Mode) => void;
  stakeAmount: bigint;
}) {
  const authFetch = useAuthFetch();

  const { data } = useQuery({
    queryKey: ["play", "stats"],
    queryFn: async () => {
      const res = await authFetch("/api/play/stats");
      if (!res.ok) return { stats: null };
      return res.json() as Promise<{ stats: PlayStats }>;
    },
    staleTime: 30_000,
  });

  const stats = data?.stats;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Flame}
          label="Streak"
          value={stats?.current_streak ?? 0}
          unit={stats?.current_streak === 1 ? "day" : "days"}
          tone="terracotta"
        />
        <StatCard
          icon={Coins}
          label="Points"
          value={stats?.lifetime_points_from_play ?? 0}
          unit="lifetime"
          tone="mustard"
        />
        <StatCard
          icon={Target}
          label="Whacked"
          value={stats?.scams_whacked_today ?? 0}
          unit="today"
          tone="forest"
        />
        <StatCard
          icon={Trophy}
          label="Rank"
          value={stats?.weekly_rank ? `#${stats.weekly_rank}` : "—"}
          unit={stats?.weekly_rank ? "this week" : "unranked"}
          tone="aubergine"
        />
      </div>

      <div className="rounded-[16px] bg-paper p-4 shadow-[0_2px_8px_rgba(31,58,110,0.05)]">
        <div className="grid grid-cols-2 gap-1 bg-canvas-warm p-1 rounded-xl mb-4">
          <button
            onClick={() => onTabChange("free")}
            className={`py-2 rounded-lg text-sm font-bold transition ${
              activeTab === "free"
                ? "bg-indigo text-cream"
                : "text-fg-soft hover:text-indigo"
            }`}
          >
            Free
          </button>
          <button
            onClick={() => onTabChange("premium")}
            className={`py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === "premium"
                ? "bg-mustard text-indigo"
                : "text-fg-soft hover:text-indigo"
            }`}
          >
            <Zap size={13} strokeWidth={2.5} />
            Premium
          </button>
        </div>

        {activeTab === "free" ? (
          <FreeDescription />
        ) : (
          <PremiumDescription stakeAmount={stakeAmount} />
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  label: string;
  value: number | string;
  unit: string;
  tone: "terracotta" | "mustard" | "forest" | "aubergine";
}) {
  const colors = {
    terracotta: {
      bg: "bg-terracotta-tint",
      iconBg: "bg-terracotta",
      iconColor: "text-paper",
      accent: "text-terracotta",
    },
    mustard: {
      bg: "bg-mustard-tint",
      iconBg: "bg-mustard",
      iconColor: "text-indigo",
      accent: "text-mustard",
    },
    forest: {
      bg: "bg-forest-tint",
      iconBg: "bg-forest",
      iconColor: "text-paper",
      accent: "text-forest",
    },
    aubergine: {
      bg: "bg-aubergine-tint",
      iconBg: "bg-aubergine",
      iconColor: "text-paper",
      accent: "text-aubergine",
    },
  }[tone];

  return (
    <div className={`rounded-[12px] p-3 ${colors.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`flex p-1.5 items-center justify-center rounded-[6px] ${colors.iconBg}`}
        >
          <Icon size={12} strokeWidth={2.4} className={colors.iconColor} />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-indigo/70">
          {label}
        </span>
      </div>
      <div className="display text-[22px] font-bold text-indigo leading-none tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className={`text-[9px] font-semibold ${colors.accent} mt-1`}>
        {unit}
      </div>
    </div>
  );
}