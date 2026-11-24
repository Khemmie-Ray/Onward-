"use client";

import { Loader2 } from "lucide-react";
import { useClaimMilestone } from "@/hooks/useClaimMilestone";

/** "Claim N points" for an earned milestone, with an inline error. */
export function ClaimMilestoneButton({
  milestoneId,
  points,
  className = "",
}: {
  milestoneId: string;
  points: number;
  className?: string;
}) {
  const claim = useClaimMilestone();

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => claim.mutate(milestoneId)}
        disabled={claim.isPending}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-terracotta px-3 py-2 text-[12px] font-bold text-cream transition hover:brightness-105 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0"
      >
        {claim.isPending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          `Claim ${points.toLocaleString()} points`
        )}
      </button>
      {claim.isError && (
        <p className="mt-1.5 text-[11px] font-semibold text-terracotta">
          {claim.error.message}
        </p>
      )}
    </div>
  );
}
