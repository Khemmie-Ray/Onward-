"use client";

import { createElement } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Trophy } from "lucide-react";
import { useMilestones } from "@/hooks/useMilestones";
import { useStreakRewards } from "@/hooks/useStreakRewards";
import type { MilestoneView } from "@/lib/server/milestone-rewards";
import { ClaimMilestoneButton } from "./ClaimMilestoneButton";
import type { MedalPalette } from "./milestoneDisplay";
import {
  SECTION_META,
  milestoneIcon,
  requirementText,
  streakIcon,
} from "./milestoneDisplay";

const TILE_BG: Record<MedalPalette, string> = {
  aubergine: "bg-aubergine-tint text-aubergine",
  terracotta: "bg-terracotta-tint text-terracotta",
  forest: "bg-forest-tint text-forest",
  mustard: "bg-mustard-tint text-indigo",
  indigo: "bg-indigo/10 text-indigo",
};

type Row = {
  key: string;
  category: string;
  palette: MedalPalette;
  icon: LucideIcon;
  level: number;
  title: string;
  description: string;
  value: number;
  target: number;
  claim?: { milestoneId: string; points: number } | "streak";
};

export function MilestonesInProgress() {
  const { milestones, isLoading, isError } = useMilestones();
  const { streak, isLoading: streakLoading } = useStreakRewards();

  const rows: Row[] = [];

  // One row per kind of milestone: the first one not yet claimed.
  const groups = new Map<string, MilestoneView[]>();
  for (const m of milestones ?? []) {
    groups.set(m.metric, [...(groups.get(m.metric) ?? []), m]);
  }
  for (const [metric, items] of groups) {
    const index = items.findIndex((m) => !m.achieved_at || m.claimable);
    if (index === -1) continue;
    const m = items[index];
    const meta = SECTION_META[m.category];
    rows.push({
      key: metric,
      category: meta.label,
      palette: meta.palette,
      icon: milestoneIcon(m),
      level: index + 1,
      title: m.title,
      description:
        requirementText(m) +
        (m.reward_points > 0
          ? ` · ${m.reward_points.toLocaleString()} points`
          : ""),
      value: m.claimable ? m.threshold : m.value,
      target: m.threshold,
      claim: m.claimable
        ? { milestoneId: m.id, points: m.reward_points }
        : undefined,
    });
  }

  // Streak rewards: the first tier not yet claimed.
  const tiers = streak?.milestones ?? [];
  const streakIndex = tiers.findIndex((t) => t.state !== "claimed");
  if (streak && streakIndex !== -1) {
    const t = tiers[streakIndex];
    const meta = SECTION_META.streak;
    const ready = t.state === "claimable" || t.state === "pending";
    rows.push({
      key: "streak",
      category: meta.label,
      palette: meta.palette,
      icon: streakIcon(t.day),
      level: streakIndex + 1,
      title: `${t.day}-day streak`,
      description:
        `Reach a ${t.day}-day streak` +
        (t.amount_g > 0 ? ` · ${t.amount_g.toLocaleString()} G$` : ""),
      value: ready ? t.day : streak.current_streak,
      target: t.day,
      claim: t.state === "claimable" ? "streak" : undefined,
    });
  }

  // Ready to claim first, then closest to done.
  rows.sort(
    (a, b) =>
      Number(Boolean(b.claim)) - Number(Boolean(a.claim)) ||
      b.value / b.target - a.value / a.target,
  );

  return (
    <section className="mb-10 animate-[fade-up_0.8s_0.24s_ease_both]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="display text-[22px] font-bold tracking-[-0.015em] text-indigo">
          Milestones
        </h2>
        <Link
          href="/profile/milestones"
          className="rounded-full text-[12px] font-bold uppercase tracking-widest text-forest transition hover:text-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
        >
          View all
        </Link>
      </div>

      {isLoading || streakLoading ? (
        <div className="flex flex-col gap-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-[20px] bg-paper"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-[20px] bg-paper px-5 py-6 text-center text-[13px] text-fg-soft">
          We couldn&apos;t load your milestones. Refresh the page to try again.
        </div>
      ) : rows.length === 0 ? (
        <div className="flex items-center gap-4 rounded-[20px] bg-paper px-5 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mustard-tint text-indigo">
            <Trophy size={22} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="display font-bold text-indigo">
              Every milestone earned
            </div>
            <p className="mt-0.5 text-[12.5px] text-fg-soft">
              You&apos;ve completed every track. New ones are on the way.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <MilestoneRow key={r.key} row={r} />
          ))}
        </div>
      )}
    </section>
  );
}

function MilestoneRow({ row }: { row: Row }) {
  const pct = Math.min(100, Math.round((row.value / row.target) * 100));

  return (
    <div className="flex items-center gap-4 rounded-[20px] bg-paper px-4 py-4 shadow-[0_6px_24px_rgba(31,58,110,0.06)] sm:px-5">
      <div className="flex shrink-0 flex-col items-center">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-[18px] ${TILE_BG[row.palette]}`}
        >
          {createElement(row.icon, { size: 26, strokeWidth: 2 })}
        </div>
        <span className="-mt-2.5 whitespace-nowrap rounded-full bg-indigo px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-cream">
          Level {row.level}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-soft">
              {row.claim ? "Ready to claim" : row.category}
            </div>
            <div className="display truncate font-bold text-indigo">
              {row.title}
            </div>
          </div>
          <div className="shrink-0 text-[13px] font-bold tabular-nums text-indigo">
            {Math.min(row.value, row.target)}/{row.target}
          </div>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas-warm">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              row.claim ? "bg-forest" : "bg-mustard"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-2 text-[12px] text-fg-soft">{row.description}</p>

        {row.claim === "streak" ? (
          <Link
            href="/profile/milestones"
            className="mt-2 inline-flex rounded-xl bg-terracotta px-3 py-2 text-[12px] font-bold text-cream transition hover:brightness-105 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2"
          >
            Claim on the milestones page
          </Link>
        ) : row.claim ? (
          <ClaimMilestoneButton
            milestoneId={row.claim.milestoneId}
            points={row.claim.points}
            className="mt-2 sm:max-w-50"
          />
        ) : null}
      </div>
    </div>
  );
}
