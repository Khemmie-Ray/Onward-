import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SunMotif, MudclothPattern } from "@/components/home/motifs";
import type { DashboardData } from "@/lib/data/dashboard";

interface NextActionCardProps {
  module: NonNullable<DashboardData["currentModule"]>;
}

const NextActionCard = ({ module }: NextActionCardProps) => {
  const href = module.trackSlug
    ? `/learn/${module.trackSlug}?lesson=${module.slug}`
    : "/learn";

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-[24px] bg-aubergine p-7 shadow-[0_12px_32px_rgba(91,46,92,0.25)] transition-transform hover:-translate-y-1"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-paper opacity-[0.06]"
      >
        <MudclothPattern />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 text-mustard"
      >
        <SunMotif size={180} />
      </div>
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-mustard px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo mb-3">
            <Sparkles size={11} strokeWidth={2.5} />
            Pick up where you left off
          </div>
          <h2 className="display text-[28px] md:text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-paper mb-2">
            {module.title}
          </h2>
          <p className="max-w-110 text-[13.5px] leading-[1.6] text-paper/80 mb-4">
            {module.description} You&apos;re on card {module.currentCard} of{" "}
            {module.totalCards}.
          </p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-paper/70">
              Card {module.currentCard} of {module.totalCards}
            </span>
            <span className="display text-[12px] font-bold tabular-nums text-mustard">
              {module.progressPercent}%
            </span>
          </div>
          <div className="h-2 max-w-75 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-mustard transition-[width]"
              style={{ width: `${module.progressPercent}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-[13px] font-bold text-aubergine shadow-[0_6px_18px_rgba(0,0,0,0.15)] transition-transform group-hover:translate-x-1">
          Resume <ArrowRight size={14} strokeWidth={2.8} />
        </div>
      </div>
    </Link>
  );
};

export default NextActionCard;
