"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type { CoursesData } from "@/lib/data/courses";

export function useCourses() {
  const authFetch = useAuthFetch();

  const query = useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<CoursesData> => {
      const res = await authFetch("/api/courses");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return (await res.json()) as CoursesData;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
