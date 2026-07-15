"use client";

import type { LeaderboardEntry } from "./type";

type Size = "large" | "medium" | "small" | "xs";

const SIZE_MAP: Record<
  Size,
  {
    hole: number;
    initials: number;
    name: number;
    score: number;
    rankBadge: number;
    nameMargin: number;
  }
> = {
  large: {
    hole: 156,
    initials: 38,
    name: 15,
    score: 28,
    rankBadge: 30,
    nameMargin: 14,
  },
  medium: {
    hole: 116,
    initials: 30,
    name: 14,
    score: 22,
    rankBadge: 26,
    nameMargin: 12,
  },
  small: {
    hole: 88,
    initials: 24,
    name: 12,
    score: 17,
    rankBadge: 22,
    nameMargin: 10,
  },
  xs: {
    hole: 74,
    initials: 20,
    name: 11,
    score: 15,
    rankBadge: 20,
    nameMargin: 8,
  },
};

export function PlayerHole({
  entry,
  size,
  isCenter = false,
}: {
  entry: LeaderboardEntry;
  size: Size;
  isCenter?: boolean;
}) {
  const dims = SIZE_MAP[size];
  const initials = getInitials(entry.display_name);
  const bgColor = colorForUser(entry.user_id);
  const isPaid = entry.prize_points > 0;
  const isTopThree = entry.rank <= 3;

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: dims.hole + 8 }}
    >
      <div className="relative">
        <div
          className={`relative rounded-full flex items-center justify-center text-cream font-bold display ${bgColor} ${
            isCenter
              ? "ring-4 ring-mustard ring-offset-4 ring-offset-canvas animate-hole-pulse"
              : isTopThree
                ? "ring-2 ring-mustard/50"
                : entry.is_viewer
                  ? "ring-2 ring-terracotta/60"
                  : ""
          }`}
          style={{
            width: dims.hole,
            height: dims.hole,
            fontSize: dims.initials,
          }}
        >
          {initials}

          {/* Rank badge */}
          <div
            className={`absolute rounded-full flex items-center justify-center font-bold display tabular-nums shadow-[0_2px_6px_rgba(31,58,110,0.15)] ${
              isTopThree
                ? "bg-mustard text-indigo"
                : "bg-paper text-indigo border border-fg-soft/15"
            }`}
            style={{
              width: dims.rankBadge,
              height: dims.rankBadge,
              fontSize: dims.rankBadge * 0.45,
              bottom: -dims.rankBadge * 0.15,
              right: -dims.rankBadge * 0.15,
            }}
          >
            {entry.rank}
          </div>
        </div>
      </div>

      {/* Name */}
      <div
        className="font-bold text-indigo text-center truncate max-w-full leading-tight"
        style={{
          fontSize: dims.name,
          marginTop: dims.nameMargin,
        }}
      >
        {entry.display_name}
        {entry.is_viewer && (
          <span className="ml-1 text-[9px] font-bold uppercase tracking-widest text-terracotta">
            You
          </span>
        )}
      </div>

      {/* Score */}
      <div
        className="display font-bold tabular-nums text-indigo leading-none mt-1"
        style={{ fontSize: dims.score }}
      >
        {entry.correct_whacks.toLocaleString()}
      </div>

      {/* Prize tag */}
      {isPaid && (
        <div className="mt-1.5 text-[10px] font-bold text-mustard tabular-nums leading-none">
          +{entry.prize_points} pts
        </div>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return initials || "?";
}

function colorForUser(userId: string): string {
  const hash = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const palette = ["bg-indigo", "bg-aubergine"];
  return palette[hash % palette.length];
}
