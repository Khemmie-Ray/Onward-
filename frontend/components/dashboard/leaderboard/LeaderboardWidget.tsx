"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Trophy,
  Target,
  Flame,
  Zap,
} from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { LeaderboardRow } from "./LeaderboardRow";
import type { LeaderboardEntry, LeaderboardResponse } from "./type";

const PAGE_SIZE = 10;

export function LeaderboardWidget() {
  const authFetch = useAuthFetch();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [viewer, setViewer] = useState<LeaderboardEntry | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalPrizePool, setTotalPrizePool] = useState(0);
  const [topPaidRank, setTopPaidRank] = useState(10);
  const [totalWon, setTotalWon] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      try {
        const res = await authFetch(
          `/api/leaderboard/current?limit=${PAGE_SIZE}&offset=${offset}`,
        );
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: LeaderboardResponse = await res.json();
        setEntries((prev) =>
          append ? [...prev, ...data.entries] : data.entries,
        );
        setViewer(data.viewer);
        setTotalPlayers(data.pagination.total_players);
        setHasMore(data.pagination.has_more);
        setTotalPrizePool(data.prizes.total_pool_points);
        setTopPaidRank(data.prizes.top_paid_rank);
        setTotalWon(
          (data as unknown as { viewer_total_won?: number }).viewer_total_won ??
            0,
        );
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load leaderboard");
      }
    },
    [authFetch],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      if (!cancelled) await fetchPage(0, false);
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const handleShowMore = async () => {
    setIsLoadingMore(true);
    await fetchPage(entries.length, true);
    setIsLoadingMore(false);
  };
  const handleShowFewer = () => {
    setEntries((prev) => prev.slice(0, PAGE_SIZE));
    setHasMore(totalPlayers > PAGE_SIZE);
  };

  const isExpanded = entries.length > PAGE_SIZE;
  const inPaidSpot = viewer !== null && viewer.rank <= topPaidRank;

  return (
    <div className="lg:w-[70%] md:w-[80%] w-full mx-auto">
      {!isLoading && viewer && (
        <div className="mb-4 overflow-hidden rounded-3xl bg-indigo text-cream shadow-[0_8px_28px_rgba(31,58,110,0.18)]">
          <div className="flex flex-col sm:flex-row sm:items-stretch">
            <div className="flex flex-row sm:flex-col items-center justify-center gap-3 sm:gap-0 bg-cream/10 px-5 py-4 ">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-mustard">
                You
              </div>
              <div className="display text-[34px] font-bold leading-none">
                #{viewer.rank}
              </div>
              <div className="text-[10px] text-cream/60 sm:mt-0.5">
                of {totalPlayers.toLocaleString()}
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-center px-5 py-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-mustard">
                Points won (all-time)
              </div>
              <div className="display text-[30px] font-bold leading-tight tabular-nums">
                {totalWon.toLocaleString()}
              </div>
              {inPaidSpot ? (
                <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-mustard">
                  <Trophy size={12} strokeWidth={2.5} /> In a paid spot — keep
                  it up!
                </div>
              ) : (
                <PaidGap
                  entries={entries}
                  topPaidRank={topPaidRank}
                  viewerScore={viewer.correct_whacks}
                />
              )}
            </div>
            <div className="flex items-center justify-around gap-4 border-t sm:border-t-0 sm:border-l border-cream/15 px-5 py-3 sm:py-4">
              <SideStat
                icon={<Target size={14} strokeWidth={2.5} />}
                label="Correct"
                value={viewer.correct_whacks}
              />
              <SideStat
                icon={<Zap size={14} strokeWidth={2.5} />}
                label="Rounds"
                value={viewer.rounds_played}
              />
              <SideStat
                icon={<Flame size={14} strokeWidth={2.5} />}
                label="Streak"
                value={`${viewer.streak}d`}
              />
            </div>
          </div>
        </div>
      )}
      <div className="w-full rounded-3xl bg-paper p-5 sm:p-6 shadow-[0_8px_28px_rgba(31,58,110,0.06)]">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="display text-[20px] font-bold text-indigo">
              Leaderboard
            </h2>
            <p className="text-[11px] text-fg-soft mt-0.5">
              Last 7 days · Top {topPaidRank} share{" "}
              {totalPrizePool.toLocaleString()} points every Sunday
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mustard/15">
            <Trophy size={16} strokeWidth={2.5} className="text-mustard" />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 flex items-center justify-center text-fg-soft">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="my-4 px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-fg-soft">
              No one has played a passing round in the last 7 days yet. Be the
              first.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-1">
              {entries.map((entry) => (
                <LeaderboardRow key={entry.user_id} entry={entry} />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[11px] text-fg-soft">
                Showing {entries.length} of {totalPlayers}
              </span>
              <div className="flex gap-2">
                {isExpanded && (
                  <button
                    onClick={handleShowFewer}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-canvas-warm text-fg-soft text-[11px] font-bold hover:bg-canvas-warm/70 transition"
                  >
                    <ChevronUp size={12} strokeWidth={2.5} /> Show fewer
                  </button>
                )}
                {hasMore && (
                  <button
                    onClick={handleShowMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo text-cream text-[11px] font-bold hover:bg-indigo/90 disabled:opacity-60 transition"
                  >
                    {isLoadingMore ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ChevronDown size={12} strokeWidth={2.5} />
                    )}
                    Show more
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PaidGap({
  entries,
  topPaidRank,
  viewerScore,
}: {
  entries: LeaderboardEntry[];
  topPaidRank: number;
  viewerScore: number;
}) {
  const lastPaid = entries.find((e) => e.rank === topPaidRank);
  if (!lastPaid) return null;
  const gap = lastPaid.correct_whacks - viewerScore;
  if (gap <= 0) return null;
  return (
    <div className="mt-1 text-[11px] text-cream/80">
      <span className="font-bold text-mustard">{gap.toLocaleString()}</span>{" "}
      more correct to a paid spot
    </div>
  );
}

function SideStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-mustard">{icon}</span>
      <span className="display text-[16px] font-bold tabular-nums leading-none">
        {value}
      </span>
      <span className="text-[9px] font-medium uppercase tracking-wider text-cream/60">
        {label}
      </span>
    </div>
  );
}
