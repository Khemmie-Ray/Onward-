// frontend/app/(authed)/(main)/learn/[track]/page.tsx
"use client";

import { useCallback, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTrackDetail } from "@/hooks/useTrackDetail";
import { LessonPanel } from "@/components/dashboard/lesson/LessonPanel";

/**
 * /learn/<track>?lesson=<section> runs one section: it fills the main area
 * (the whole screen on a phone) and the right panel shows what the section
 * covers. A track's overview is the hex page at /learn, so this page without
 * ?lesson sends learners there with the track picked.
 */
export default function TrackLessonPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const trackSlug = params.track as string;
  const lessonSlug = searchParams.get("lesson");

  const backToTrack = useCallback(
    () => router.replace(`/learn?track=${encodeURIComponent(trackSlug)}`),
    [router, trackSlug],
  );

  useEffect(() => {
    if (!lessonSlug) backToTrack();
  }, [lessonSlug, backToTrack]);

  const { data, isLoading, isError } = useTrackDetail(
    lessonSlug ? trackSlug : null,
  );

  if (lessonSlug && isError) {
    // Not enrolled in this track's course, or the track doesn't exist.
    return (
      <div className="my-4 flex flex-col items-center rounded-[22px] bg-paper px-6 py-12 text-center">
        <h1 className="display text-[22px] font-bold text-indigo">
          This track isn&apos;t open to you yet
        </h1>
        <p className="mt-2 max-w-sm text-[13.5px] text-fg-soft">
          Enrol in its course to start the lessons.
        </p>
        <button
          onClick={() => router.push("/courses")}
          className="mt-6 rounded-full bg-indigo px-5 py-3 text-[13px] font-bold text-paper transition hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2"
        >
          Browse courses
        </button>
      </div>
    );
  }

  if (!lessonSlug || isLoading || !data) {
    return (
      <div className="flex min-h-125 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-fg-soft" />
      </div>
    );
  }

  const sectionNumber =
    data.modules.findIndex((m) => m.slug === lessonSlug) + 1;

  return (
    <LessonPanel
      slug={lessonSlug}
      onChooseNext={backToTrack}
      onExit={backToTrack}
      trackTitle={data.track.title}
      sectionNumber={sectionNumber || undefined}
      sectionCount={data.modules.length}
      basePath="/api/learn/modules"
    />
  );
}
