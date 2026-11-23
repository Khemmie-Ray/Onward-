"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { DailyQuestsCard } from "@/components/dashboard/quests/DailyQuestsCard";
import { useTrackDetail } from "@/hooks/useTrackDetail";
import { PanelCard } from "../PanelCard";
import { UBIClaimCard } from "@/components/dashboard/UBIClaimCard";

export function LearnTrackRightPanel() {
  return (
    <>
    <UBIClaimCard />
      <Suspense fallback={null}>
        <SectionGoalsCard />
      </Suspense>
      <DailyQuestsCard />
    </>
  );
}

function SectionGoalsCard() {
  const pathname = usePathname();
  const lessonSlug = useSearchParams().get("lesson");
  const trackSlug = pathname.split("/")[2] ?? null;
  const { data } = useTrackDetail(lessonSlug ? trackSlug : null);

  const section = data?.modules.find((m) => m.slug === lessonSlug);
  if (!lessonSlug || !section) return null;

  return (
    <PanelCard variant="dark">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#CDC4FB]">
        In this section
      </span>
      {section.what_you_will_learn.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3">
          {section.what_you_will_learn.map((goal) => (
            <li key={goal} className="flex items-start gap-2.5">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-mustard" />
              <span className="text-[13px] leading-[1.45]">{goal}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[13px] leading-[1.45] text-paper/80">
          {section.title}
        </p>
      )}
      <p className="mt-4 text-[12px] text-paper/70">
        {section.estimated_minutes} min · {section.points_reward} points
      </p>
    </PanelCard>
  );
}
