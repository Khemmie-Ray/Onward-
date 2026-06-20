"use client";

import { Crown, Flame, Zap } from "lucide-react";
import type { LeaderboardEntry } from "./type";

export function LeaderboardRow({
  entry,
  showDivider = false,
}: {
  entry: LeaderboardEntry;
  showDivider?: boolean;
}) {
  const isTopThree = entry.rank <= 3;
  const isViewer = entry.is_viewer;

  return (
    <>
      {showDivider && (
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-fg-soft/15" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft">
            Your rank
          </span>
          <div className="flex-1 h-px bg-fg-soft/15" />
        </div>
      )}
      <div
        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
          isViewer
            ? "bg-mustard/15 ring-1 ring-mustard/40"
            : "hover:bg-canvas-warm/60"
        }`}
      >
        <RankBadge rank={entry.rank} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold text-[14px] truncate ${
                isViewer ? "text-indigo" : "text-indigo"
              }`}
            >
              {entry.display_name}
              {isViewer && (
                <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-mustard">
                  You
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-fg-soft">
            <span>Lvl {entry.level}</span>
            {entry.streak > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Flame size={10} strokeWidth={2.5} className="text-terracotta" />
                {entry.streak}d
              </span>
            )}
            {entry.primary_mode === "premium" && (
              <span className="inline-flex items-center gap-0.5 text-mustard font-semibold">
                <Zap size={10} strokeWidth={2.5} />
                Premium
              </span>
            )}
            <span>{entry.rounds_played} rounds</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div
            className={`display font-bold tabular-nums ${
              isTopThree ? "text-[18px]" : "text-[16px]"
            } text-indigo`}
          >
            {entry.correct_whacks}
          </div>
          {entry.prize_g > 0 && (
            <div className="text-[10px] font-bold text-mustard tabular-nums">
              +{entry.prize_g} G$
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mustard/20">
        <Crown size={16} strokeWidth={2.5} className="text-mustard" />
      </div>
    );
  }
  if (rank === 2 || rank === 3) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mustard/10">
        <span className="display font-bold text-[13px] text-mustard">
          {rank}
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas-warm">
      <span className="display font-bold text-[13px] text-fg-soft tabular-nums">
        {rank}
      </span>
    </div>
  );
}