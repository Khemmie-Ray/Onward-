"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { LoopSigil } from "@/components/home/motifs";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { LessonRunner } from "./LessonRunner";
import type { LessonContent } from "@/lib/lessons/lesson-data";

export function LessonPanel({
  slug,
  onChooseNext,
  basePath = "/api/modules",
}: {
  slug: string | null;
  onChooseNext: () => void;
  basePath?: string;
}) {
  const authFetch = useAuthFetch();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", slug],
    queryFn: async (): Promise<LessonContent | null> => {
      if (!slug) return null;
      const res = await authFetch(`${basePath}/${slug}/lesson`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    },
    enabled: !!slug,
    staleTime: 60_000,
  });

  if (!slug) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[500px] rounded-[24px] bg-paper/50 p-12 animate-[fade-up_0.5s_ease_both]">
        <LoopSigil
          size={48}
          color="var(--color-indigo)"
          className="opacity-30 mb-4"
        />
        <div className="display text-[20px] font-semibold text-indigo mb-1.5">
          Pick your next module
        </div>
        <p className="text-[13px] text-fg-soft max-w-[300px]">
          Tap any module from the list to begin.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] rounded-[24px] bg-paper/50 p-12">
        <Loader2 size={28} className="animate-spin text-fg-soft" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[500px] rounded-[24px] bg-paper/50 p-12 animate-[fade-up_0.5s_ease_both]">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-terracotta mb-3">
          Coming soon
        </div>
        <div className="display text-[20px] font-semibold text-indigo mb-2">
          This lesson isn&apos;t ready yet
        </div>
        <p className="text-[13px] text-fg-soft max-w-[320px]">
          Pick another module from the list to keep going.
        </p>
      </div>
    );
  }
  return (
  <LessonRunner
    key={slug}
    lesson={lesson}
    badgeImageUrl={null}
    onChooseNext={onChooseNext}
    basePath={basePath}
  />
);
}
