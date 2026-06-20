"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LeaderboardEntry, LeaderboardStats } from "./type";

export function StatsMarginalia({
  stats,
  viewer,
  totalPlayers,
  isAuthenticated,
}: {
  stats: LeaderboardStats | null;
  viewer: LeaderboardEntry | null;
  totalPlayers: number;
  isAuthenticated: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 text-[13px] text-fg-soft mb-12">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span>
          <span className="font-bold text-indigo tabular-nums">
            {totalPlayers.toLocaleString()}
          </span>{" "}
          spotters this week
        </span>
        <Dot />
        <span>
          <span className="font-bold text-indigo tabular-nums">
            {(stats?.lifetime.g_paid_out ?? 0).toLocaleString()}
          </span>{" "}
          G$ paid out
        </span>
        <Dot />
        <span>
          <span className="font-bold text-mustard tabular-nums">300</span> G$ on
          the line this week
        </span>
      </div>
      <div className="shrink-0">
        {!isAuthenticated ? (
          <Link
            href="/play"
            className="inline-flex items-center gap-1 text-indigo font-bold hover:underline"
          >
            Sign in to track your rank
            <ArrowRight size={12} strokeWidth={2.8} />
          </Link>
        ) : viewer ? (
          <span>
            You&apos;re{" "}
            <span className="font-bold text-mustard tabular-nums">
              #{viewer.rank}
            </span>{" "}
            with{" "}
            <span className="font-bold text-indigo tabular-nums">
              {viewer.correct_whacks}
            </span>{" "}
            whacks
          </span>
        ) : (
          <Link
            href="/play"
            className="inline-flex items-center gap-1 text-indigo font-bold hover:underline"
          >
            Pass a round to enter
            <ArrowRight size={12} strokeWidth={2.8} />
          </Link>
        )}
      </div>
    </div>
  );
}

function Dot() {
  return <span className="hidden sm:inline opacity-40">·</span>;
}
