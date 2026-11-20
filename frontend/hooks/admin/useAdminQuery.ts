"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";

export function useAdminQuery<T>(
  key: string | readonly unknown[],
  path: string,
  options?: {
    staleTimeMs?: number;
    enabled?: boolean;
  },
) {
  const authFetch = useAuthFetch();
  const queryClient = useQueryClient();
  const queryKey = Array.isArray(key) ? key : [key];

  const query = useQuery<T>({
    queryKey,
    queryFn: async () => {
      const res = await authFetch(path);
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      return (await res.json()) as T;
    },
    staleTime: options?.staleTimeMs ?? 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  return {
    ...query,
    refresh,
    isRefreshing: query.isFetching && !query.isLoading,
  };
}
