"use client";

import { Trophy, Bell } from "lucide-react";

export function NoContest() {
  return (
    <div className="lg:w-[50%] md:w-[60%] mx-auto w-full mt-10 rounded-3xl bg-paper p-8 sm:p-12 text-center shadow-[0_8px_28px_rgba(31,58,110,0.06)]">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-mustard/15">
        <Trophy size={28} strokeWidth={2.2} className="text-mustard" />
      </div>

      <h2 className="display text-[22px] font-bold text-indigo mb-2">
        No contest running right now
      </h2>
      <p className="mx-auto max-w-90 text-[13px] leading-relaxed text-fg-soft">
        Contests come around regularly, with real G$ rewards for learning,
        playing, and bringing friends. The next one will show up here.
      </p>

     
      <div className="mx-auto mt-6 flex max-w-95 flex-col gap-2 sm:flex-row sm:justify-center">
        <div className="flex items-center gap-2 rounded-xl bg-canvas-warm px-4 py-2.5 text-[12px] font-medium text-fg-soft">
          <Bell
            size={14}
            strokeWidth={2.5}
            className="text-terracotta shrink-0"
          />
          Keep your streak going so you&apos;re ready for the next one
        </div>
      </div>
    </div>
  );
}
