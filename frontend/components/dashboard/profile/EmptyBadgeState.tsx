import React from "react";
import { LoopSigil } from "@/components/home/motifs";

const EmptyBadgeState = () => {
  return (
    <div className="rounded-[18px] bg-mustard-tint p-6 text-center mb-4">
      <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mustard">
        <LoopSigil size={24} color="var(--color-indigo)" />
      </div>
      <p className="display text-[16px] font-semibold text-indigo mb-1">
        Your collection starts here.
      </p>
      <p className="text-[12px] text-fg-soft">
        Complete your first module to mint your first badge.
      </p>
    </div>
  );
}

export default EmptyBadgeState;