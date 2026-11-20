"use client";

import { createElement } from "react";
import Link from "next/link";
import { Check, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMilestones } from "@/hooks/useMilestones";
import { useStreakRewards } from "@/hooks/useStreakRewards";
import { ClaimMilestoneButton } from "./ClaimMilestoneButton";
import type { MedalPalette } from "./milestoneDisplay";
import {
  SECTION_META,
  formatEarnedDate,
  milestoneIcon,
  requirementText,
  streakIcon,
} from "./milestoneDisplay";

const SHOW = 4;

const TILE_BG: Record<MedalPalette, string> = {
  aubergine: "bg-aubergine-tint text-aubergine",
  terracotta: "bg-terracotta-tint text-terracotta",
  forest: "bg-forest-tint text-forest",
  mustard: "bg-mustard-tint text-indigo",
  indigo: "bg-indigo/10 text-indigo",
};

type Card = {
  key: string;
  section: string;
  palette: MedalPalette;
  icon: LucideIcon;
  title: string;
  /** Earned cards */
  earnedAt?: string | null;
  reward?: string;
  /** Earned but not claimed yet */
  claim?: { id: string; points: number };
  /** Up-next cards */
  requirement?: string;
  pct?: number;
};

/**
 * Profile summary. Earned milestones (including streak rewards) stay here,
 * newest first. Spare slots show what's closest to being earned.
 */
export function RecentlyEarned() {
  const { milestones, isLoading, isError } = useMilestones();
  const { streak, isLoading: streakLoading } = useStreakRewards();

  const earned: Card[] = [];
  const next: Card[] = [];

  for (const m of milestones ?? []) {
    const meta = SECTION_META[m.category];
    const base = {
      key: m.id,
      section: meta.label,
      palette: meta.palette,
      icon: milestoneIcon(m),
      title: m.title,
    };
    if (m.claimable) {
      earned.push({
        ...base,
        earnedAt: m.achieved_at,
        claim: { id: m.id, points: m.reward_points },
      });
    } else if (m.achieved_at) {
      const paid = (m.points_awarded ?? 0) > 0;
      earned.push({
        ...base,
        // Progress recorded before launch has no real date or payout.
        earnedAt: paid ? (m.claimed_at ?? m.achieved_at) : null,
        reward: paid
          ? `+${(m.points_awarded ?? 0).toLocaleString()} points`
          : undefined,
      });
    } else {
      next.push({
        ...base,
        requirement:
          requirementText(m) +
          (m.reward_points > 0
            ? ` · ${m.reward_points.toLocaleString()} points`
            : ""),
        pct: m.threshold > 0 ? Math.round((m.value / m.threshold) * 100) : 0,
      });
    }
  }

  const streakMeta = SECTION_META.streak;
  for (const r of streak?.milestones ?? []) {
    if (r.state !== "claimed") continue;
    earned.push({
      key: `streak-${r.day}`,
      section: streakMeta.label,
      palette: streakMeta.palette,
      icon: streakIcon(r.day),
      title: `${r.day}-day streak`,
      earnedAt: r.claimed_at,
      reward: r.amount_g > 0 ? `+${r.amount_g.toLocaleString()} G$` : undefined,
    });
  }

  // Waiting to be claimed first, then newest. Undated (pre-launch) ones last.
  earned.sort(
    (a, b) =>
      Number(Boolean(b.claim)) - Number(Boolean(a.claim)) ||
      (b.earnedAt ?? "").localeCompare(a.earnedAt ?? ""),
  );
  // Closest to done first.
  next.sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));

  const cards = [
    ...earned.slice(0, SHOW),
    ...next.slice(0, Math.max(0, SHOW - earned.length)),
  ];

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-hidden>
          {[0, 1].map((i) => (
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
      ) : (
        <>
          {earned.length === 0 && <EmptyState />}
          {cards.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {cards.map((c) => (
                <MilestoneCard key={c.key} card={c} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mb-3 flex items-center gap-4 rounded-[20px] border-2 border-dashed border-indigo/15 bg-paper/60 px-5 py-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mustard-tint text-indigo">
        <Trophy size={22} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="display font-bold text-indigo">No milestones yet</div>
        <p className="mt-0.5 text-[12.5px] text-fg-soft">
          Verify with GoodID, finish a lesson or keep a streak going to earn
          your first badge.
        </p>
      </div>
    </div>
  );
}

function MilestoneCard({ card }: { card: Card }) {
  const done = card.earnedAt !== undefined;

  return (
    <div
      className={`flex items-center gap-4 rounded-[20px] px-4 py-4 sm:px-5 ${
        done
          ? "bg-paper shadow-[0_6px_24px_rgba(31,58,110,0.06)]"
          : "border-2 border-dashed border-indigo/15 bg-paper/50"
      }`}
    >
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] ${
          done ? TILE_BG[card.palette] : "bg-canvas-warm text-fg-dim"
        }`}
      >
        {createElement(card.icon, { size: 24, strokeWidth: 2 })}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-soft">
          {card.claim ? "Ready to claim" : done ? card.section : "Up next"}
        </div>
        <div className="display truncate font-bold text-indigo">
          {card.title}
        </div>

        {card.claim ? (
          <ClaimMilestoneButton
            milestoneId={card.claim.id}
            points={card.claim.points}
            className="mt-2 sm:max-w-50"
          />
        ) : done ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
            <span className="inline-flex items-center gap-1 font-bold text-forest">
              <Check size={12} strokeWidth={3} />
              {card.reward ?? "Earned"}
            </span>
            {card.earnedAt && (
              <span className="text-fg-soft">
                {formatEarnedDate(card.earnedAt)}
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas-warm">
              <div
                className="h-full rounded-full bg-mustard"
                style={{ width: `${Math.min(100, card.pct ?? 0)}%` }}
              />
            </div>
            <p className="mt-1.5 line-clamp-2 text-[12px] text-fg-soft">
              {card.requirement}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
