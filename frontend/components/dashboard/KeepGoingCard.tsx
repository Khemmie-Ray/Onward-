"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { MudclothPattern } from "@/components/home/motifs";

interface KeepGoingCardProps {
  modulesCompleted: number;
  modulesTotal: number;
}

/**
 * Shown when the user has completed at least one module but currently has
 * nothing in progress. Contrasts with EmptyStateCard (0 completions) and
 * NextActionCard (active module in progress).
 *
 * Visual: forest-tint background to signal "progress, keep going" rather
 * than "start fresh" (mustard) or "resume current" (aubergine).
 */
const KeepGoingCard = ({
  modulesCompleted,
  modulesTotal,
}: KeepGoingCardProps) => {
  const remaining = Math.max(0, modulesTotal - modulesCompleted);
  const allDone = remaining === 0;

  return (
    <Link
      href="/modules"
      className="group relative block overflow-hidden rounded-[24px] bg-forest-tint p-7 transition-transform hover:-translate-y-1 shadow-[0_8px_24px_rgba(31,58,110,0.08)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-indigo opacity-[0.04]"
      >
        <MudclothPattern />
      </div>
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-paper mb-3">
            <Sparkles size={11} strokeWidth={2.5} />
            {allDone ? "All modules complete" : "Keep your streak going"}
          </div>
          <h2 className="display text-[28px] md:text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-indigo mb-2">
            {allDone
              ? "You've completed every module."
              : "Pick your next module."}
          </h2>
          <p className="text-[13.5px] leading-[1.6] text-fg-soft">
            {allDone
              ? "Replay any to refresh, or jump into Whack-a-Scam to keep your streak."
              : `${modulesCompleted} of ${modulesTotal} done — ${remaining} more to earn every badge.`}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-indigo px-5 py-3 text-[13px] font-bold text-paper shadow-[0_6px_18px_rgba(0,0,0,0.15)] transition-transform group-hover:translate-x-1">
          {allDone ? "Browse modules" : "Continue learning"}
          <ArrowRight size={14} strokeWidth={2.8} />
        </div>
      </div>
    </Link>
  );
};

export default KeepGoingCard;