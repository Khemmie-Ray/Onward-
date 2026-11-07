"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type { LeaderboardResponse } from "./type";
import { LeaderboardView, type BoardEntry } from "./LeaderboardView";

const PAGE = 7;

export function GameArenaBoard() {
  const authFetch = useAuthFetch();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", "current", "arena"],
    queryFn: async () => {
      const res = await authFetch("/api/leaderboard/current?limit=50&offset=0");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const all: BoardEntry[] = (data?.entries ?? []).map((e) => ({
    rank: e.rank,
    name: e.display_name,
    score: e.correct_whacks,
    isViewer: e.is_viewer,
  }));

  const top3 = all.filter((e) => e.rank <= 3);
  const listAll = all.filter((e) => e.rank >= 4);
  const pageCount = Math.max(1, Math.ceil(listAll.length / PAGE));
  const pageEntries = listAll.slice((page - 1) * PAGE, page * PAGE);
  const total = data?.pagination.total_players ?? all.length;

  return (
    <LeaderboardView
      heroTitle="Join the champions."
      heroSubtitle="Catch scams in the arena this week to climb the board."
      top3={top3}
      pageEntries={pageEntries}
      total={total}
      page={page}
      pageCount={pageCount}
      onPageChange={setPage}
      scoreLabel="score"
      loading={isLoading}
      emptyMessage="No one has scored a passing round this week yet. Be the first."
    />
  );
}
