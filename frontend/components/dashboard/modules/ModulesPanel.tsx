"use client";

import type { ModulePreview } from "@/lib/modules/types";
import type { ModuleCategory } from "@/lib/themes/tones";
import { type DayActivity, calculateStreak } from "@/lib/modules/activity";
import { ActivityCalendar } from "./ActivityCalendar";
import { ModuleStatRow } from "./ModuleStatRow";
import { ModuleListItem } from "./ModuleListItem";

const CATEGORIES: ModuleCategory[] = [
  "Foundations",
  "Identity",
  "Economics",
  "Safety",
];

export function ModulesPanel({
  modules,
  selectedSlug,
  onSelect,
  activity,
}: {
  modules: ModulePreview[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  activity: DayActivity[];
}) {
  const completed = modules.filter((m) => m.status === "complete").length;
  const gEarned = modules
    .filter((m) => m.status === "complete")
    .reduce((sum, m) => sum + m.reward, 0);
  const streak = calculateStreak(activity);

  return (
    <div className="flex flex-col gap-4 animate-[fade-up_0.8s_0.05s_ease_both]">
      <ModuleStatRow
        modulesCompleted={completed}
        modulesTotal={modules.length}
        activityStreak={streak}
        gEarned={gEarned}
      />

      <ActivityCalendar activity={activity} />
      <h1 className="display text-[24px] font-semibold leading-[1.1] tracking-tight text-indigo">
        Learn the ecosystem from the{" "}
        <span className="text-aubergine">inside out</span>.
      </h1>
      <div className="flex flex-col max-h-[400px] overflow-y-auto mt-5">
        {CATEGORIES.map((category) => {
          const inCategory = modules.filter((m) => m.category === category);
          if (inCategory.length === 0) return null;
          return (
            <div key={category} className="flex flex-col gap-2 mb-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-fg-faint px-1 my-2">
                {category}
              </p>
              {inCategory.map((m) => (
                <ModuleListItem
                  key={m.slug}
                  module={m}
                  selected={m.slug === selectedSlug}
                  onSelect={() => onSelect(m.slug)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
