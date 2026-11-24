"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type { QuestsView } from "@/lib/server/quest";

export function useQuests() {
  const authFetch = useAuthFetch();

  const query = useQuery({
    queryKey: ["quests", "today"],
    queryFn: async (): Promise<QuestsView> => {
      const res = await authFetch("/api/quests");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return (await res.json()) as QuestsView;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    quests: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
