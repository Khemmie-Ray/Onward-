"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type { MilestoneView } from "@/lib/server/milestone-rewards";

export function useMilestones() {
  const authFetch = useAuthFetch();

  const query = useQuery({
    queryKey: ["milestones"],
    queryFn: async (): Promise<MilestoneView[]> => {
      const res = await authFetch("/api/milestones");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = (await res.json()) as { milestones: MilestoneView[] };
      return json.milestones;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    milestones: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}