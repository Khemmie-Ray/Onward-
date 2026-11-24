"use client";

import { Loader2 } from "lucide-react";
import { useMilestones } from "@/hooks/useMilestones";
import { useStreakRewards } from "@/hooks/useStreakRewards";
import type { MilestoneView } from "@/lib/server/milestone-rewards";
import type { MilestoneCategory } from "@/lib/supabase/types";
import { MilestoneSection } from "./MilestoneSection";
import { MilestoneTile } from "./MilestoneTile";
import { StreakMilestones } from "./StreakMilestones";
import { ClaimMilestoneButton } from "./ClaimMilestoneButton";
import type { MedalState } from "./MilestoneMedal";
import {
  SECTION_META,
  SECTION_ORDER,
  formatEarnedDate,
  milestoneIcon,
  requirementText,
  toRoman,
} from "./milestoneDisplay";

/** Every milestone, grouped by section, from the live milestone engine. */
export function MilestonesBoard() {
  const { milestones, isLoading, isError } = useMilestones();
  const { streak } = useStreakRewards();

  if (isLoading) {
    return (
      <div className="flex min-h-60 items-center justify-center text-fg-soft">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (isError || !milestones) {
    return (
      <div className="rounded-[20px] bg-paper p-6 text-center text-[13px] text-fg-soft">
        We couldn&apos;t load your milestones. Refresh the page to try again.
      </div>
    );
  }

  const byCategory = new Map<MilestoneCategory, MilestoneView[]>();
  for (const m of milestones) {
    byCategory.set(m.category, [...(byCategory.get(m.category) ?? []), m]);
  }

  const streakTotal = streak?.milestones.length ?? 0;
  const streakEarned =
    streak?.milestones.filter((m) => m.state === "claimed").length ?? 0;
  const earned = milestones.filter((m) => m.achieved_at).length + streakEarned;
  const total = milestones.length + streakTotal;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <h2 className="display text-[24px] font-bold tracking-[-0.02em] text-indigo">
          Milestones
        </h2>
        <span className="text-[12.5px] font-semibold text-fg-soft">
          {earned} of {total} earned
        </span>
      </div>

      {SECTION_ORDER.map((key) =>
        key === "streak" ? (
          <StreakMilestones key={key} />
        ) : (
          <CategorySection
            key={key}
            category={key}
            items={byCategory.get(key) ?? []}
          />
        ),
      )}
    </>
  );
}

function CategorySection({
  category,
  items,
}: {
  category: MilestoneCategory;
  items: MilestoneView[];
}) {
  if (items.length === 0) return null;
  const meta = SECTION_META[category];

  // The first unearned milestone of each kind is "next up"; the rest wait.
  const nextByMetric = new Set<string>();
  const groupSize = new Map<string, number>();
  for (const m of items)
    groupSize.set(m.metric, (groupSize.get(m.metric) ?? 0) + 1);
  const position = new Map<string, number>();

  return (
    <MilestoneSection
      label={meta.label}
      blurb={meta.blurb}
      earned={items.filter((m) => m.achieved_at).length}
      total={items.length}
    >
      {items.map((m) => {
        let state: MedalState = "locked";
        if (m.claimable) state = "ready";
        else if (m.achieved_at) state = "earned";
        else if (!nextByMetric.has(m.metric)) {
          state = "next";
          nextByMetric.add(m.metric);
        }

        const index = (position.get(m.metric) ?? 0) + 1;
        position.set(m.metric, index);

        return (
          <MilestoneTile
            key={m.id}
            title={m.title}
            requirement={requirementText(m)}
            icon={milestoneIcon(m)}
            palette={meta.palette}
            state={state}
            roman={
              (groupSize.get(m.metric) ?? 1) > 1 ? toRoman(index) : undefined
            }
            reward={rewardLabel(m)}
            earnedOn={
              m.claimed_at && (m.points_awarded ?? 0) > 0
                ? formatEarnedDate(m.claimed_at)
                : undefined
            }
            progress={
              state === "next" && m.threshold > 1
                ? { value: m.value, target: m.threshold }
                : undefined
            }
            action={
              m.claimable ? (
                <ClaimMilestoneButton
                  milestoneId={m.id}
                  points={m.reward_points}
                />
              ) : undefined
            }
          />
        );
      })}
    </MilestoneSection>
  );
}

function rewardLabel(m: MilestoneView): string | undefined {
  // Waiting to be claimed: the button shows the amount.
  if (m.claimable) return undefined;
  if (m.achieved_at) {
    // Progress made before launch was recorded without points.
    return (m.points_awarded ?? 0) > 0
      ? `+${(m.points_awarded ?? 0).toLocaleString()} points`
      : undefined;
  }
  return m.reward_points > 0
    ? `${m.reward_points.toLocaleString()} points`
    : "Badge";
}
