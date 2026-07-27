"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { TrackCardView } from "@/components/dashboard/learn/TrackCardView";
import { useRouter } from "next/navigation";
import { TrackCard } from "@/components/dashboard/learn/TrackCardView";

export default function LearnPage() {
  const authFetch = useAuthFetch();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["learn", "tracks"],
    queryFn: async () => {
      const res = await authFetch("/api/learn/tracks");
      if (!res.ok) throw new Error("Failed to load tracks");
      return res.json() as Promise<{ tracks: TrackCard[] }>;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-fg-soft" />
      </div>
    );
  }

  const openTrack = (track: TrackCard) => {
    if (track.status === "coming_soon") return;
    router.push(`/learn/${track.slug}`);
  };

  return (
    <div className="my-4">
      <div className="mb-8 animate-[fade-up_0.6s_ease_both]">
        <h1 className="display text-[28px] font-semibold tracking-[-0.015em] text-indigo mb-1.5">
          Understand crypto, safely
        </h1>
        <p className="text-[13.5px] text-fg-soft max-w-[520px]">
          Short lessons that take you from curious to confident. Pick any track
          and start with its first module.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-[fade-up_0.7s_0.1s_ease_both]">
        {data.tracks.map((track) => (
          <TrackCardView
            key={track.slug}
            track={track}
            onOpen={() => openTrack(track)}
          />
        ))}
      </div>
    </div>
  );
}
