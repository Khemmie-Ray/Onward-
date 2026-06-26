"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/shared/Header";
import { Loader2 } from "lucide-react";
import { PublicGuard } from "@/components/auth/PublicGuard";

import { StatsCard } from "@/components/dashboard/leaderboard/StatCard";
import { PlayerGrid } from "@/components/dashboard/leaderboard/PlayerGrid";
import { RestOfField } from "@/components/dashboard/leaderboard/RestOfField";

import type {
  LeaderboardEntry,
  LeaderboardResponse,
  LeaderboardStats,
} from "@/components/dashboard/leaderboard/type";

const INITIAL_LOAD = 15;
const LOAD_MORE_CHUNK = 5;
const TABLE_PAGE_SIZE = 5;

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [viewer, setViewer] = useState<LeaderboardEntry | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (offset: number, limit: number, append: boolean) => {
      try {
        const res = await fetch(
          `/api/leaderboard/current?limit=${limit}&offset=${offset}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: LeaderboardResponse = await res.json();

        setEntries((prev) =>
          append ? [...prev, ...data.entries] : data.entries,
        );
        setViewer(data.viewer);
        setTotalPlayers(data.pagination.total_players);
        setHasMore(data.pagination.has_more);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load leaderboard");
      }
    },
    [],
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard/stats");
      if (!res.ok) return;
      const data: LeaderboardStats = await res.json();
      setStats(data);
    } catch (e) {
      console.error("[stats fetch]", e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await Promise.all([fetchPage(0, INITIAL_LOAD, false), fetchStats()]);
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPage, fetchStats]);

  const handleShowMore = async () => {
    setIsLoadingMore(true);
    await fetchPage(entries.length, LOAD_MORE_CHUNK, true);
    setIsLoadingMore(false);
  };

  const handleShowFewer = () => {
    setEntries((prev) => prev.slice(0, INITIAL_LOAD));
    setHasMore(totalPlayers > INITIAL_LOAD);
  };

  return (
    <PublicGuard>
    <div className="flex flex-col bg-canvas mx-auto w-[90%] mt-10">
        <Header />
      <div className="pb-12">
        {isLoading ? (
          <div className="py-32 flex items-center justify-center text-fg-soft">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="my-4 px-5 py-4 rounded-2xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
            {error}
          </div>
        ) : (
          <>
            <StatsCard stats={stats} />

            <PlayerGrid entries={entries} />

            <RestOfField
              entries={entries}
              viewer={viewer}
              totalPlayers={totalPlayers}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onShowMore={handleShowMore}
              onShowFewer={handleShowFewer}
              visibleTableSize={TABLE_PAGE_SIZE}
            />
          </>
        )}
      </div>
    </div>
    </PublicGuard>
  );
}
