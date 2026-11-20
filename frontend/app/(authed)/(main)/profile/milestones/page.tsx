"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { QuestsOverview } from "@/components/dashboard/quests/QuestsOverview";
import { MilestonesBoard } from "@/components/dashboard/milestones/MilestoneBoard";

const Milestones = () => {
  return (
    <div className="animate-[fade-up_0.6s_ease_both]">
      <Link
        href="/profile"
        className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-[12px] font-bold text-indigo shadow-[0_2px_10px_rgba(31,58,110,0.08)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
      >
        <ChevronLeft size={15} strokeWidth={2.5} />
        Back to profile
      </Link>

      <h1 className="display mb-7 text-[28px] font-bold tracking-[-0.02em] text-indigo sm:text-[32px]">
        Quests and milestones
      </h1>

      <QuestsOverview />

      <MilestonesBoard />
    </div>
  );
};

export default Milestones;
