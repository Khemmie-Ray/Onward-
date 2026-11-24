"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type { QuestLeaderboardResponse } from "@/lib/quest-leaderboard";
import { LeaderboardView, type BoardEntry } from "./LeaderboardView";

const PAGE = 7;

export function QuestBoard() {
  const authFetch = useAuthFetch();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<QuestLeaderboardResponse>({
    queryKey: ["leaderboard", "quests"],
    queryFn: async () => {
      const res = await authFetch("/api/leaderboard/quests");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const all: BoardEntry[] = (data?.entries ?? []).map((e) => ({
    rank: e.rank,
    name: e.display_name,
    score: e.quest_points,
    isViewer: e.is_viewer,
  }));

  const top3 = all.filter((e) => e.rank <= 3);
  const listAll = all.filter((e) => e.rank >= 4);
  const pageCount = Math.max(1, Math.ceil(listAll.length / PAGE));
  const pageEntries = listAll.slice((page - 1) * PAGE, page * PAGE);
  const total = data?.total_players ?? all.length;

  return (
    <LeaderboardView
      heroTitle="Join the champions."
      heroSubtitle="Clear your daily quests this week to climb the board."
      top3={top3}
      pageEntries={pageEntries}
      total={total}
      page={page}
      pageCount={pageCount}
      onPageChange={setPage}
      scoreLabel="quests"
      loading={isLoading}
      emptyMessage="No one has finished a quest this week yet. Be the first."
    />
  );
}