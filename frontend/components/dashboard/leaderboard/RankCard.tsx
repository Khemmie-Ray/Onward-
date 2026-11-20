"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type { LeaderboardResponse } from "@/components/dashboard/leaderboard/type";

export function RankCard() {
  const authFetch = useAuthFetch();

  const { data } = useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", "current"],
    queryFn: async () => {
      const res = await authFetch("/api/leaderboard/current?limit=10&offset=0");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const viewer = data?.viewer ?? null;
  const rank = viewer?.rank ?? 0;
  const points = viewer?.correct_whacks ?? 0;

  return (
    <div className="rounded-2xl bg-[#1C133D] p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#5EC48A]">
        Your rank
      </div>
      <div className="mt-2 display text-[32px] font-bold leading-none text-paper">
        #{rank}
      </div>
      <div className="mt-2 text-[12px] font-semibold text-paper/70 tabular-nums">
        {points.toLocaleString()} points this week
      </div>
      {rank === 0 && (
        <div className="mt-1 text-[11px] text-paper/50">
          Play a round this week to get ranked.
        </div>
      )}
    </div>
  );
}