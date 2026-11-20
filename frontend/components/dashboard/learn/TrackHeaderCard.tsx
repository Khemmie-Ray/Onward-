"use client";

import { ChevronDown } from "lucide-react";
import { TrackProgressRing } from "./TrackProgressRing";

export function TrackHeaderCard({
  index,
  total,
  title,
  description,
  done,
  totalModules,
  onTitleClick,
}: {
  index: number;
  total: number;
  title: string;
  description: string | null;
  done: number;
  totalModules: number;
  onTitleClick: () => void;
}) {
  return (
    <div className="rounded-[22px] bg-[#5CC27C] p-6 sm:p-7">
      <div className="flex items-center justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-indigo/70">
            Track {index} of {total}
          </p>

          <button
            type="button"
            onClick={onTitleClick}
            className="group mt-1 flex items-center gap-2 text-left"
            aria-label="Switch track"
          >
            <h1 className="display text-[28px] font-bold leading-tight text-indigo sm:text-[30px]">
              {title}
            </h1>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo/10 text-indigo transition group-hover:bg-indigo/20">
              <ChevronDown size={15} strokeWidth={2.6} />
            </span>
          </button>

          {description && (
            <p className="mt-2 max-w-[460px] text-[13.5px] leading-snug text-indigo/80">
              {description}
            </p>
          )}
        </div>

        <TrackProgressRing done={done} total={totalModules} />
      </div>
    </div>
  );
}
