"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";

export type StreakRewardState = "locked" | "claimable" | "claimed" | "pending";

export type StreakReward = {
  day: number;
  amount_g: number;
  state: StreakRewardState;
  tx_hash: string | null;
  /** When it was paid. Set only for claimed rewards. */
  claimed_at: string | null;
};

export type StreakRewardsData = {
  current_streak: number;
  is_verified: boolean;
  milestones: StreakReward[];
};

export function useStreakRewards() {
  const authFetch = useAuthFetch();

  const query = useQuery({
    queryKey: ["streak", "rewards"],
    queryFn: async (): Promise<StreakRewardsData> => {
      const res = await authFetch("/api/streak/status");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return (await res.json()) as StreakRewardsData;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    streak: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
