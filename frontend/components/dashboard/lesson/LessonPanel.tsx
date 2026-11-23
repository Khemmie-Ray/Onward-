// frontend/components/dashboard/lesson/LessonPanel.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Moon } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { LessonRunner } from "./LessonRunner";
import type { LessonContent } from "@/lib/lessons/lesson-data";

type DailyLimit = { dailyLimit: true; resetsAt: string | null };

export function LessonPanel({
  slug,
  onChooseNext,
  onExit,
  trackTitle,
  sectionNumber,
  sectionCount,
  basePath = "/api/learn/modules",
}: {
  slug: string;
  onChooseNext: () => void;
  onExit: () => void;
  trackTitle?: string;
  sectionNumber?: number;
  sectionCount?: number;
  basePath?: string;
}) {
  const authFetch = useAuthFetch();

  const {
    data: lesson,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["lesson", slug],
    queryFn: async (): Promise<LessonContent | DailyLimit | null> => {
      const res = await authFetch(`${basePath}/${slug}/lesson`);
      if (res.status === 404) return null;
      if (res.status === 429) {
        const body = (await res.json().catch(() => null)) as {
          resets_at?: string;
        } | null;
        return { dailyLimit: true, resetsAt: body?.resets_at ?? null };
      }
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-125 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-fg-soft" />
      </div>
    );
  }

  if (lesson && "dailyLimit" in lesson) {
    return (
      <div className="flex min-h-125 flex-col items-center justify-center rounded-[28px] bg-indigo p-10 text-center text-paper animate-[fade-up_0.5s_ease_both]">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-paper/10 text-[#CDC4FB]">
          <Moon size={26} strokeWidth={2.2} />
        </span>
        <div className="display mt-4 text-[24px] font-bold">
          That&apos;s today&apos;s section done
        </div>
        <p className="mt-2 max-w-80 text-[13.5px] text-paper/75">
          One new section a day keeps it easy to remember. This one opens{" "}
          {opensAt(lesson.resetsAt)}. You can review sections you&apos;ve
          finished in the meantime.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="mt-6 rounded-full bg-mint px-6 py-3 text-[14px] font-bold text-indigo transition hover:bg-mint/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-indigo"
        >
          Back to {trackTitle ?? "the track"}
        </button>
      </div>
    );
  }

  if (isError || !lesson) {
    return (
      <div className="flex min-h-125 flex-col items-center justify-center rounded-[28px] bg-paper p-10 text-center animate-[fade-up_0.5s_ease_both]">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-terracotta">
          {isError ? "Couldn't load" : "Coming soon"}
        </div>
        <div className="display mb-2 text-[22px] font-bold text-indigo">
          {isError
            ? "We couldn't open this section"
            : "This section isn't ready yet"}
        </div>
        <p className="mb-6 max-w-80 text-[13.5px] text-fg-soft">
          {isError
            ? "It may still be locked. Go back and pick another one."
            : "Pick another section to keep going."}
        </p>
        <button
          type="button"
          onClick={onExit}
          className="rounded-full bg-indigo px-6 py-3 text-[14px] font-bold text-paper transition hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2"
        >
          Back to {trackTitle ?? "the track"}
        </button>
      </div>
    );
  }

  return (
    <LessonRunner
      key={slug}
      lesson={lesson}
      badgeImageUrl={null}
      onChooseNext={onChooseNext}
      onExit={onExit}
      trackTitle={trackTitle}
      sectionNumber={sectionNumber}
      sectionCount={sectionCount}
      basePath={basePath}
    />
  );
}

function opensAt(resetsAt: string | null): string {
  if (!resetsAt) return "tomorrow";
  const when = new Date(resetsAt);
  if (Number.isNaN(when.getTime())) return "tomorrow";
  const time = when.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const sameDay = when.toDateString() === new Date().toDateString();
  return `${sameDay ? "today" : "tomorrow"} at ${time}`;
}
