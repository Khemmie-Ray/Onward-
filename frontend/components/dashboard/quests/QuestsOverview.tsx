"use client";

import { CalendarDays, Check, Gift } from "lucide-react";
import { useQuests } from "@/hooks/useQuests";
import { useResetsIn } from "@/hooks/useResetsIn";
import type { DailyQuest, MonthlyQuestView } from "@/lib/server/quest";
import { QUEST_ICONS, TIER_LABEL, progressPercent } from "./questDisplay";

/** Top of the quests and milestones page: today's quests and this month's quest. */
export function QuestsOverview() {
  const { quests, isLoading, isError } = useQuests();
  const resetsIn = useResetsIn();

  return (
    <section className="mb-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="display text-[22px] font-bold tracking-[-0.015em] text-indigo">
            Today&apos;s quests
          </h2>
          <p className="text-[12px] text-fg-soft">
            Each quest you finish counts toward this month&apos;s quest.
          </p>
        </div>
        {resetsIn && (
          <span className="text-[12px] font-semibold text-fg-soft">
            Resets in {resetsIn}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-[20px] bg-paper"
            />
          ))}
        </div>
      ) : isError || !quests ? (
        <div className="rounded-[20px] bg-paper p-6 text-center text-[13px] text-fg-soft">
          We couldn&apos;t load your quests. Refresh the page to try again.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {quests.quests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>

          <BonusStrip
            cleared={quests.all_cleared}
            points={quests.bonus_points}
            done={quests.quests.filter((q) => q.completed_at).length}
            total={quests.quests.length}
          />

          {quests.monthly && <MonthlyQuestCard monthly={quests.monthly} />}
        </>
      )}
    </section>
  );
}

function QuestCard({ quest }: { quest: DailyQuest }) {
  const done = Boolean(quest.completed_at);
  const Icon = QUEST_ICONS[quest.metric];
  const pct = progressPercent(quest.progress, quest.target);

  return (
    <div
      className={`flex flex-col rounded-[20px] p-4 shadow-[0_6px_24px_rgba(31,58,110,0.06)] ${
        done ? "bg-forest-tint" : "bg-paper"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            done ? "bg-forest text-paper" : "bg-terracotta-tint text-terracotta"
          }`}
        >
          {done ? (
            <Check size={18} strokeWidth={3} />
          ) : (
            <Icon size={18} strokeWidth={2.2} />
          )}
        </span>
        <span className="rounded-full bg-canvas-warm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fg-soft">
          {TIER_LABEL[quest.tier]}
        </span>
      </div>

      <div className="mt-3 text-[15px] font-bold text-indigo">
        {quest.title}
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between text-[11px] font-bold tabular-nums text-fg-soft">
          <span>{done ? "Done" : "In progress"}</span>
          <span>
            {quest.progress} / {quest.target}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas-warm">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              done ? "bg-forest" : "bg-mustard"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function BonusStrip({
  cleared,
  points,
  done,
  total,
}: {
  cleared: boolean;
  points: number;
  done: number;
  total: number;
}) {
  return (
    <div
      className={`mt-3 flex items-center gap-3 rounded-[16px] px-4 py-3 ${
        cleared ? "bg-forest text-paper" : "bg-mustard/15 text-indigo"
      }`}
    >
      <Gift size={18} strokeWidth={2.2} className="shrink-0" />
      <p className="text-[13px] font-semibold">
        {cleared
          ? `All done for today. You earned +${points} points.`
          : `${done} of ${total} done. Clear all ${total} today for +${points} points.`}
      </p>
    </div>
  );
}

function MonthlyQuestCard({ monthly }: { monthly: MonthlyQuestView }) {
  const done = Boolean(monthly.completed_at);
  const pct = progressPercent(
    monthly.quest_points,
    monthly.target_quest_points,
  );

  return (
    <div className="mt-4 flex flex-col gap-4 rounded-[20px] bg-indigo p-5 text-cream sm:flex-row sm:items-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-cream/10">
        <CalendarDays size={22} strokeWidth={2.2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cream/60">
          Monthly quest
        </div>
        <div className="display text-[18px] font-bold">{monthly.title}</div>
        {monthly.description && (
          <p className="mt-0.5 text-[12px] text-cream/70">
            {monthly.description}
          </p>
        )}

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream/15">
          <div
            className="h-full rounded-full bg-mustard transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold tabular-nums text-cream/70">
          <span>
            {Math.min(monthly.quest_points, monthly.target_quest_points)} /{" "}
            {monthly.target_quest_points} quests
          </span>
          <span>{done ? "Completed" : `+${monthly.reward_points} points`}</span>
        </div>
      </div>
    </div>
  );
}
