"use client";

import { Check, Coins, Lock } from "lucide-react";
import type { ModulePreview } from "@/lib/modules/types";

export function TrackModuleListItem({
  module,
  index,
  selected,
  onSelect,
}: {
  module: ModulePreview;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const isLocked = module.status === "locked";
  const isComplete = module.status === "complete";
  const isActive = module.status === "active" || module.status === "available";

  const hasLearnPoints = module.whatYouWillLearn.length > 0;
  const showExpansion = !isLocked && selected && hasLearnPoints;

  const cardClass = isLocked
    ? "bg-paper/50 opacity-60 cursor-not-allowed"
    : selected
      ? "bg-paper shadow-[0_6px_20px_rgba(31,58,110,0.1)] cursor-pointer"
      : "bg-paper shadow-[0_2px_8px_rgba(31,58,110,0.05)] cursor-pointer hover:-translate-y-0.5 transition-transform";

  const iconWrapperClass = isLocked
    ? "bg-canvas-warm text-fg-dim"
    : isComplete
      ? "bg-forest/15 text-forest"
      : "bg-mustard/20 text-indigo";

  return (
    <button
      onClick={onSelect}
      disabled={isLocked}
      className={`w-full text-left rounded-[14px] overflow-hidden transition-all mb-3 ${cardClass}`}
    >
      <div className="flex items-center p-4 gap-3">
        <div
          className={`relative flex h-11 w-11 items-center justify-center rounded-[10px] shrink-0 ${iconWrapperClass}`}
        >
          {isComplete ? (
            <Check size={18} strokeWidth={3} />
          ) : isLocked ? (
            <Lock size={15} strokeWidth={2.5} />
          ) : (
            <span className="display text-[15px] font-bold tabular-nums">
              {index}
            </span>
          )}
        </div>

        <div className="">
          <div className="text-[14px] font-semibold text-indigo truncate">
            {module.title}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-fg-soft mt-0.5">
            <span>{module.minutes} min</span>
            <span>·</span>
            <span className="inline-flex items-center gap-0.5">
              <Coins size={9} strokeWidth={2.5} className="text-terracotta" />+
              {module.reward}
            </span>
            {isActive && !isComplete && (
              <>
                <span>·</span>
                <span className="font-bold uppercase tracking-wide text-terracotta">
                  {module.progress && module.progress > 0
                    ? "In progress"
                    : "Start"}
                </span>
              </>
            )}
            {isComplete && (
              <>
                <span>·</span>
                <span className="font-bold uppercase tracking-wide text-forest">
                  Done
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div
        className={`transition-all duration-300 ease-out ${
          showExpansion ? "max-h-52 overflow-y-auto" : "max-h-0 overflow-hidden"
        }`}
      >
        <div className="px-4 pb-4">
          <div className="border-t border-indigo/10 pt-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-indigo/60 mb-2">
              What you&apos;ll learn
            </div>
            <ul className="flex flex-col gap-1.5">
              {module.whatYouWillLearn.map((point, i) => (
                <li
                  key={i}
                  className="text-[11px] leading-[1.45] text-indigo/85 flex items-start gap-1.5"
                >
                  <span className="mt-1 h-1 w-1 rounded-full bg-indigo/40 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </button>
  );
}
