"use client";

import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { LoopSigil } from "@/components/home/motifs";
import { useProfile } from "@/hooks/useProfile";
import { MilestoneTierCard } from "@/components/dashboard/profile/MilestoneTierCard";
import {
  MILESTONE_TRACKS,
  resolveTrack,
  type MilestoneTrack,
} from "@/lib/milestones";

const Milestones = () => {
  const { profile: data, error } = useProfile();

  if (error) {
    return (
      <div className="min-h-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.16em] text-terracotta">
            Couldn&apos;t load milestones
          </div>
          <p className="text-[13px] text-fg-soft">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-[fade-up_0.5s_ease_both]">
          <div className="animate-[spin_2s_linear_infinite]">
            <LoopSigil size={32} color="var(--color-indigo)" />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-soft">
            Loading your badges
          </div>
        </div>
      </div>
    );
  }

  const metrics: Record<string, number> = {
    streak: data.currentStreak,
    modules: data.modulesCompleted,
    referrals: data.referralsQualified,
  };

  const sections = MILESTONE_TRACKS.map((track) => ({
    track,
    resolved: resolveTrack(track, metrics[track.metric] ?? 0),
  }));

  const totalEarned = sections.reduce((s, x) => s + x.resolved.earned, 0);
  const totalBadges = sections.reduce((s, x) => s + x.resolved.total, 0);

  return (
    <div className="animate-[fade-up_0.6s_ease_both]">
      <Link
        href="/profile"
        className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-[12px] font-bold text-indigo shadow-[0_2px_10px_rgba(31,58,110,0.08)] transition hover:-translate-y-0.5"
      >
        <ChevronLeft size={15} strokeWidth={2.5} />
        Back to profile
      </Link>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-2">
        <h1 className="display text-[28px] font-bold tracking-[-0.02em] text-indigo sm:text-[32px]">
          All milestones
        </h1>
        <span className="text-[12.5px] font-semibold text-fg-soft">
          {totalEarned} of {totalBadges} badges earned
        </span>
      </div>

      {sections.map(({ track, resolved }) => (
        <section key={track.id} className="mb-9">
          <div className="mb-3">
            <h2 className="display text-[22px] font-bold tracking-[-0.015em] text-indigo">
              {track.category}
            </h2>
            <p className="text-[12px] text-fg-soft">
              {resolved.earned} of {resolved.total} badges earned
            </p>
          </div>

          {resolved.earned === 0 && <EmptyBanner track={track} />}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {resolved.tiers.map((tier) => (
              <MilestoneTierCard
                key={tier.name}
                tier={tier}
                tone={track.tone}
                icon={track.icon}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

function EmptyBanner({ track }: { track: MilestoneTrack }) {
  const first = track.tiers[0];
  const hint = `${track.describe(first.threshold).replace(/\.$/, "")} to earn ${first.name}.`;
  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-mustard/40 bg-mustard/10 px-4 py-3">
      <Lock size={14} strokeWidth={2.4} className="shrink-0 text-indigo/60" />
      <p className="text-[12.5px] text-indigo">
        <span className="font-bold">No badge earned yet.</span> {hint}
      </p>
    </div>
  );
}

export default Milestones;
