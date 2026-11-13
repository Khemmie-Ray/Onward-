"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { UBIClaimCard } from "@/components/dashboard/UBIClaimCard";
import { ScamPatternCard } from "@/components/dashboard/play/ScamPatternCard";
import { LeaderboardCard } from "../LeaderboardCard";

export function GameRightPanel() {
  const authFetch = useAuthFetch();

  const { data: pattern } = useQuery<{
    family_label: string;
    family_description: string;
  }>({
    queryKey: ["play", "today-pattern"],
    queryFn: async () => {
      const res = await authFetch("/api/play/today");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      {pattern ? (
        <ScamPatternCard
          familyLabel={pattern.family_label}
          familyDescription={pattern.family_description}
        />
      ) : (
        <div className="rounded-2xl bg-[#1C133D] p-5">
          <div className="h-3 w-24 animate-pulse rounded bg-paper/15" />
          <div className="mt-3 h-5 w-40 animate-pulse rounded bg-paper/15" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-paper/10" />
          <div className="mt-1.5 h-3 w-5/6 animate-pulse rounded bg-paper/10" />
        </div>
      )}

      <UBIClaimCard />
      <LeaderboardCard />
    </>
  );
}