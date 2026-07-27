"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type { ModulePreview } from "@/lib/modules/types";
import { TrackModulesPanel } from "@/components/dashboard/learn/TrackModulesPanel";
import { LessonPanel } from "@/components/dashboard/lesson/LessonPanel";

type ModuleWithLock = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order_in_track: number;
  estimated_minutes: number;
  points_reward: number;
  first_card_tease: string | null;
  what_you_will_learn: string[];
  lock_state: "completed" | "current" | "locked";
};

type TrackDetail = {
  track: { slug: string; title: string; description: string | null };
  modules: ModuleWithLock[];
};

function lockToStatus(
  lock: ModuleWithLock["lock_state"],
): ModulePreview["status"] {
  if (lock === "completed") return "complete";
  if (lock === "current") return "available";
  return "locked";
}

function toModulePreview(m: ModuleWithLock, trackTitle: string): ModulePreview {
  return {
    slug: m.slug,
    title: m.title,
    category: trackTitle as ModulePreview["category"],
    minutes: m.estimated_minutes,
    reward: m.points_reward,
    status: lockToStatus(m.lock_state),
    description: m.description ?? "",
    whatYouWillLearn: m.what_you_will_learn ?? [],
    firstCardTease: m.first_card_tease ?? "",
  };
}

function selectDefaultModule(modules: ModulePreview[]): ModulePreview | null {
  return (
    modules.find((m) => m.status === "available") ??
    [...modules].reverse().find((m) => m.status === "complete") ??
    null
  );
}

export default function TrackDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const authFetch = useAuthFetch();

  const trackSlug = params.track as string;
  const slugFromUrl = searchParams.get("lesson");
  const [chooseNextMode, setChooseNextMode] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["learn", "track", trackSlug],
    queryFn: async () => {
      const res = await authFetch(`/api/learn/tracks/${trackSlug}`);
      if (!res.ok) throw new Error("Failed to load track");
      return res.json() as Promise<TrackDetail>;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-125 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-fg-soft" />
      </div>
    );
  }

  const modules: ModulePreview[] = data.modules.map((m) =>
    toModulePreview(m, data.track.title),
  );
  const defaultSlug = selectDefaultModule(modules)?.slug ?? null;
  const activeSlug = chooseNextMode ? null : (slugFromUrl ?? defaultSlug);

  const handleSelectModule = (slug: string) => {
    setChooseNextMode(false);
    router.replace(`/learn/${trackSlug}?lesson=${slug}`);
  };

  const handleChooseNext = () => {
    setChooseNextMode(true);
    router.replace(`/learn/${trackSlug}`);
  };

  return (
    <div className="my-4 h-[calc(100vh-180px)]">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="w-full lg:w-1/2 order-2 lg:order-1 flex flex-col min-h-0">
          <div className="mb-6 shrink-0 animate-[fade-up_0.5s_ease_both]">
            <button
              onClick={() => router.push("/learn")}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-fg-soft hover:text-indigo transition mb-3"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              All tracks
            </button>
            <h1 className="display text-[24px] font-semibold tracking-[-0.015em] text-indigo mb-1">
              {data.track.title}
            </h1>
            {data.track.description && (
              <p className="text-[13px] text-fg-soft">
                {data.track.description}
              </p>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <TrackModulesPanel
              trackTitle={data.track.title}
              modules={modules}
              selectedSlug={activeSlug}
              onSelect={handleSelectModule}
            />
          </div>
        </div>
        <div className="w-full lg:w-1/2 order-1 lg:order-2 lg:overflow-hidden">
          <LessonPanel
            slug={activeSlug}
            onChooseNext={handleChooseNext}
            basePath="/api/learn/modules"
          />
        </div>
      </div>
    </div>
  );
}
