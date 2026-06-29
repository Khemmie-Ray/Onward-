"use client";

import { BookOpen, Check, Coins, Lock } from "lucide-react";
import type { ModulePreview } from "@/lib/modules/types";
import { tintForCategory, type ModuleCategory } from "@/lib/themes/tones";

export function ModuleListItem({
  module,
  selected,
  onSelect,
}: {
  module: ModulePreview;
  selected: boolean;
  onSelect: () => void;
}) {
  const isLocked = module.status === "locked";
  const isComplete = module.status === "complete";
  const isActive = module.status === "active";

  const t = tintForCategory(module.category as ModuleCategory);

  const cardClass = isLocked
    ? `${t.bg} opacity-50 cursor-not-allowed mb-3`
    : `${t.bg} shadow-lg cursor-pointer transition-transform duration-200 hover:-translate-y-1 mb-3`;

  const iconWrapperClass = isLocked
    ? "bg-canvas-warm text-fg-dim"
    : `${t.iconBg} ${t.iconColor}`;

  const hasLearnPoints = module.whatYouWillLearn.length > 0;
  const showExpansion = !isLocked && selected && hasLearnPoints;

  return (
    <button
      onClick={onSelect}
      disabled={isLocked}
      className={`w-full text-left rounded-[14px] overflow-hidden transition-all ${cardClass}`}
    >
      <div className="flex items-center p-4 gap-3">
        <div
          className={`flex p-3 items-center justify-center rounded-[10px] ${iconWrapperClass}`}
        >
          {isComplete ? (
            <Check size={18} strokeWidth={3} />
          ) : isLocked ? (
            <Lock size={15} strokeWidth={2.5} />
          ) : (
            <BookOpen size={16} strokeWidth={2.2} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[14px] font-semibold ${t.textColor} truncate`}>
            {module.title}
          </div>
          <div
            className={`flex items-center gap-1.5 text-[12px] font-medium ${t.textColor}/70 mt-0.5`}
          >
            <span>{module.minutes} min</span>
            <span>·</span>
            <span className="inline-flex items-center gap-0.5">
              <Coins size={9} strokeWidth={2.5} className="text-terracotta" />+
              {module.reward}
            </span>
            {isActive && (
              <>
                <span>·</span>
                <span
                  className={`font-bold uppercase tracking-wide ${t.accent}`}
                >
                  In progress
                </span>
              </>
            )}
            {isComplete && (
              <>
                <span>·</span>
                <span
                  className={`font-bold uppercase tracking-wide ${t.accent}`}
                >
                  Done
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-out ${
          showExpansion ? "max-h-50 overflow-y-auto" : "max-h-0 overflow-hidden"
        }`}
      >
        <div className="px-3 pb-3">
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
