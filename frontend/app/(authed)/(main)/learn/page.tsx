"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  TrackCardView,
  type TrackCard,
} from "@/components/dashboard/learn/TrackCardView";
import { TrackHeaderCard } from "@/components/dashboard/learn/TrackHeaderCard";
import {
  ModuleHexMap,
  HexLegend,
} from "@/components/dashboard/learn/ModuleHexMap";
import type {
  HexModule,
  HexState,
} from "@/components/dashboard/learn/ModuleHex";

type ModuleWithLock = {
  slug: string;
  title: string;
  order_in_track: number;
  estimated_minutes: number;
  points_reward: number;
  lock_state: "completed" | "current" | "locked";
};

type TrackDetail = {
  track: { slug: string; title: string; description: string | null };
  modules: ModuleWithLock[];
};

function pickActiveSlug(tracks: TrackCard[]): string | null {
  const inProgress = tracks.find((t) => t.progress_state === "in_progress");
  if (inProgress) return inProgress.slug;
  const startable = tracks.find(
    (t) => t.status === "available" && t.progress_state !== "complete",
  );
  if (startable) return startable.slug;
  const available = tracks.find((t) => t.status === "available");
  return available?.slug ?? tracks[0]?.slug ?? null;
}

function toHexModules(modules: ModuleWithLock[]): HexModule[] {
  const sorted = [...modules].sort(
    (a, b) => a.order_in_track - b.order_in_track,
  );
  const currentIdx = sorted.findIndex((m) => m.lock_state === "current");
  const nextIdx =
    currentIdx >= 0
      ? currentIdx + 1
      : sorted.findIndex((m) => m.lock_state === "locked");

  return sorted.map((m, i) => {
    let state: HexState;
    if (m.lock_state === "completed") state = "done";
    else if (m.lock_state === "current") state = "in_progress";
    else state = i === nextIdx ? "next" : "locked";

    return {
      slug: m.slug,
      order: i + 1,
      title: m.title,
      minutes: m.estimated_minutes,
      points: m.points_reward,
      state,
    };
  });
}

export default function LearnPage() {
  const authFetch = useAuthFetch();
  const router = useRouter();

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [showTrackList, setShowTrackList] = useState(false);

  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ["learn", "tracks"],
    queryFn: async () => {
      const res = await authFetch("/api/learn/tracks");
      if (!res.ok) throw new Error("Failed to load tracks");
      return res.json() as Promise<{ tracks: TrackCard[] }>;
    },
  });

  const tracks = tracksData?.tracks ?? [];
  const activeSlug =
    selectedSlug ?? (tracks.length ? pickActiveSlug(tracks) : null);
  const activeIndex = tracks.findIndex((t) => t.slug === activeSlug);
  const activeTrack = activeIndex >= 0 ? tracks[activeIndex] : null;

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["learn", "track", activeSlug],
    enabled: Boolean(activeSlug),
    queryFn: async () => {
      const res = await authFetch(`/api/learn/tracks/${activeSlug}`);
      if (!res.ok) throw new Error("Failed to load track");
      return res.json() as Promise<TrackDetail>;
    },
  });

  if (tracksLoading) {
    return (
      <div className="min-h-125 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-fg-soft" />
      </div>
    );
  }
  if (showTrackList) {
    return (
      <div className="my-4 animate-fade-up w-[90%] mx-auto">
        <button
          onClick={() => setShowTrackList(false)}
          className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-fg-soft transition hover:text-indigo"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Back
        </button>
        <h1 className="display mb-5 text-[24px] font-semibold tracking-[-0.015em] text-indigo">
          All tracks
        </h1>
        <div>
          {tracks.map((track) => (
            <TrackCardView
              key={track.slug}
              track={track}
              onOpen={() => {
                if (track.status === "coming_soon") return;
                setSelectedSlug(track.slug);
                setShowTrackList(false);
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  const hexModules = detail ? toHexModules(detail.modules) : [];

  return (
    <div className="my-4 flex flex-col gap-5">
      {activeTrack && (
        <div className="animate-[fade-up_0.6s_ease_both]">
          <TrackHeaderCard
            index={activeIndex + 1}
            total={tracks.length}
            title={activeTrack.title}
            description={activeTrack.description}
            done={activeTrack.completed_modules}
            totalModules={activeTrack.total_modules}
            onTitleClick={() => setShowTrackList(true)}
          />
        </div>
      )}

      <div className="rounded-[22px] bg-[#1C133D] px-5 pb-6 pt-7 animate-[fade-up_0.7s_0.1s_ease_both] sm:px-8">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="display text-[20px] font-bold text-paper">Modules</h2>
          <span className="text-[11.5px] text-paper/55">
            Start at the bottom · track badge at the top
          </span>
        </div>

        {detailLoading || !detail ? (
          <div className="flex min-h-80 items-center justify-center">
            <Loader2 size={22} className="animate-spin text-paper/50" />
          </div>
        ) : (
          <div className="overflow-visible py-6">
            <ModuleHexMap
              modules={hexModules}
              onOpenModule={(slug) =>
                router.push(`/learn/${activeSlug}?lesson=${slug}`)
              }
            />
          </div>
        )}

        <div className="mt-6 border-t border-paper/10 pt-5">
          <HexLegend />
        </div>
      </div>
    </div>
  );
}
