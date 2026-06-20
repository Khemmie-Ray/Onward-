"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Trophy } from "lucide-react";
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

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      try {
        const res = await authFetch(
          `/api/leaderboard/current?limit=${PAGE_SIZE}&offset=${offset}`
        );
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: LeaderboardResponse = await res.json();

        setEntries((prev) =>
          append ? [...prev, ...data.entries] : data.entries
        );
        setViewer(data.viewer);
        setTotalPlayers(data.pagination.total_players);
        setHasMore(data.pagination.has_more);
        setTotalPrizePool(data.prizes.total_pool_g);
        setTopPaidRank(data.prizes.top_paid_rank);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load leaderboard");
      }
    },
    [authFetch]
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

  const viewerOutOfRange =
    viewer !== null &&
    viewer.rank > entries.length &&
    !entries.some((e) => e.is_viewer);

  const isExpanded = entries.length > PAGE_SIZE;

  return (
    <div className="w-full rounded-3xl bg-paper p-5 sm:p-6 shadow-[0_8px_28px_rgba(31,58,110,0.06)]">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="display text-[20px] font-bold text-indigo">
            Leaderboard
          </h2>
          <p className="text-[11px] text-fg-soft mt-0.5">
            Last 7 days · Top {topPaidRank} share {totalPrizePool} G$ each
            Sunday
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

          {viewerOutOfRange && viewer && (
            <div className="mt-2">
              <LeaderboardRow entry={viewer} showDivider />
            </div>
          )}

          {!viewer && !isLoading && (
            <p className="mt-4 text-center text-[11px] text-fg-soft">
              Play a passing round this week to enter the leaderboard.
            </p>
          )}

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
                  <ChevronUp size={12} strokeWidth={2.5} />
                  Show fewer
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
  );
}