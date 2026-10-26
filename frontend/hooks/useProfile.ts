"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type { ProfileData } from "@/lib/data/profile";

export function useProfile() {
  const { address } = useConnection();
  const authFetch = useAuthFetch();

  const query = useQuery({
    queryKey: ["profile", address ?? "anon"],
    queryFn: async (): Promise<ProfileData> => {
      const res = await authFetch("/api/profile");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return (await res.json()) as ProfileData;
    },
    enabled: Boolean(address),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.isError
          ? "Failed to load"
          : null,
    refetch: query.refetch,
  };
}
