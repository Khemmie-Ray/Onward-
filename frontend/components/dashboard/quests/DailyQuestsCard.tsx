"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { PanelCard, PanelCardHeader } from "@/components/shell/PanelCard";
import { useQuests } from "@/hooks/useQuests";
import { useResetsIn } from "@/hooks/useResetsIn";
import type { DailyQuest } from "@/lib/server/quest";
import { QUEST_ICONS, progressPercent } from "./questDisplay";

export function DailyQuestsCard({
  href = "/profile/milestones",
}: {
  href?: string;
}) {
  const { quests, isLoading, isError } = useQuests();
  const resetsIn = useResetsIn();

  return (
    <Link
      href={href}
      aria-label="Open your quests and milestones"
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2"
    >
      <PanelCard className="transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_24px_rgba(31,58,110,0.10)] group-active:translate-y-0">
        <PanelCardHeader
          title="Daily quests"
          meta={resetsIn ? `Resets in ${resetsIn}` : undefined}
        />

        {isLoading ? (
          <QuestRowsSkeleton />
        ) : isError || !quests ? (
          <p className="text-[12px] text-fg-dim">
            We couldn&apos;t load your quests. Tap to try again.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {quests.quests.map((quest) => (
                <QuestRow key={quest.id} quest={quest} />
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-fg-soft/10 pt-3">
              <span
                className={`text-[11px] font-bold ${
                  quests.all_cleared ? "text-forest" : "text-fg-soft"
                }`}
              >
                {quests.all_cleared
                  ? `All done. +${quests.bonus_points} points earned`
                  : `Clear all 3 for +${quests.bonus_points} points`}
              </span>
              <ChevronRight
                size={16}
                strokeWidth={2.5}
                className="shrink-0 text-fg-soft transition group-hover:translate-x-0.5 group-hover:text-indigo"
              />
            </div>
          </>
        )}
      </PanelCard>
    </Link>
  );
}

function QuestRow({ quest }: { quest: DailyQuest }) {
  const done = Boolean(quest.completed_at);
  const Icon = QUEST_ICONS[quest.metric];

  return (
    <li className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
          done ? "bg-forest text-paper" : "bg-terracotta-tint text-terracotta"
        }`}
      >
        {done ? (
          <Check size={13} strokeWidth={3} />
        ) : (
          <Icon size={13} strokeWidth={2.4} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[12px] font-medium">
            {quest.title}
          </span>
          <span className="shrink-0 text-[10px] font-bold tabular-nums opacity-70">
            {quest.progress}/{quest.target}
          </span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-canvas-warm">
          <div
            className={`h-1 rounded-full transition-[width] duration-500 ${
              done ? "bg-forest" : "bg-terracotta"
            }`}
            style={{
              width: `${progressPercent(quest.progress, quest.target)}%`,
            }}
          />
        </div>
      </div>
    </li>
  );
}

function QuestRowsSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-3">
          <span className="h-6 w-6 shrink-0 animate-pulse rounded-md bg-canvas-warm" />
          <div className="flex-1">
            <div className="h-3 w-2/3 animate-pulse rounded bg-canvas-warm" />
            <div className="mt-2 h-1 animate-pulse rounded-full bg-canvas-warm" />
          </div>
        </li>
      ))}
    </ul>
  );
}
