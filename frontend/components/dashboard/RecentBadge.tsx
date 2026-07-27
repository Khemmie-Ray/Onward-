import React from "react";
import { LoopSigil } from "@/components/home/motifs";
import type { RecentBadge } from "@/lib/data/dashboard";
import { formatRelativeTime } from "@/lib/time/formatRelativeTime";

interface RecentBadgeCardProps {
  badge: RecentBadge;
}

const RecentBadge = ({ badge }: RecentBadgeCardProps) => {
  const earnedAgo = formatRelativeTime(badge.earnedAt);
  return (
    <div className="rounded-[16px] p-4 bg-mustard-tint shadow-[0_6px_20px_rgba(31,58,110,0.06)]">
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mustard/20">
          <LoopSigil size={20} color="var(--color-indigo)" />
        </div>
        <div className="min-w-0">
          <div className="display text-[13px] font-bold text-indigo truncate">
            {badge.moduleTitle}
          </div>
          <div className="text-[10px] text-fg-soft">{earnedAgo}</div>
        </div>
      </div>
    </div>
  );
};

export default RecentBadge;