"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthFetch } from "@/hooks/useAuthFetch";

export type TrackModule = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order_in_track: number;
  estimated_minutes: number;
  points_reward: number;
  first_card_tease: string | null;
  what_you_will_learn: string[];
  lock_state: "completed" | "current" | "tomorrow" | "locked";
};

export type TrackDetail = {
  track: { slug: string; title: string; description: string | null };
  modules: TrackModule[];
  daily?: { done_today: boolean; resets_at: string };
};

export const trackDetailKey = (slug: string) =>
  ["learn", "track", slug] as const;

export async function fetchTrackDetail(
  authFetch: ReturnType<typeof useAuthFetch>,
  slug: string,
): Promise<TrackDetail> {
  const res = await authFetch(`/api/learn/tracks/${slug}`);
  if (!res.ok) throw new Error("Failed to load track");
  return (await res.json()) as TrackDetail;
}

export function useTrackDetail(slug: string | null) {
  const authFetch = useAuthFetch();
  return useQuery({
    queryKey: trackDetailKey(slug ?? ""),
    queryFn: () => fetchTrackDetail(authFetch, slug as string),
    enabled: Boolean(slug),
  });
}
