"use client";

import { BookOpen, Check, ChevronDown, Coins, Lock } from "lucide-react";
import { tintForCategory } from "@/lib/themes/tones";
import { MudclothPattern } from "@/components/home/motifs";
import { ModuleRowPreview } from "./ModuleRowPreview";
import type { ModulePreview } from "@/lib/modules/types";

export function ModuleRow({
  module,
  isOpen,
  onToggle,
}: {
  module: ModulePreview;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const t = tintForCategory(module.category);
  const isLocked = module.status === "locked";
  const isComplete = module.status === "complete";
  const isActive = module.status === "active";

  return (
    <div
      className={`overflow-hidden rounded-[18px] transition-all ${
        isLocked
          ? "opacity-60 bg-paper shadow-[0_2px_8px_rgba(31,58,110,0.04)]"
          : `${t.bg} shadow-[0_6px_20px_rgba(31,58,110,0.08)]`
      }`}
    >
      <button
        onClick={onToggle}
        disabled={isLocked}
        className={`relative w-full text-left p-5 flex items-center gap-4 ${
          isLocked ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        {!isLocked && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-indigo opacity-[0.04]"
          >
            <MudclothPattern />
          </div>
        )}
        <div className="relative flex items-center gap-4 flex-1">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-[12px] flex-shrink-0 ${
              isLocked
                ? "bg-canvas-warm text-fg-dim"
                : `${t.iconBg} ${t.iconColor}`
            }`}
          >
            {isComplete ? (
              <Check size={22} strokeWidth={3} />
            ) : isLocked ? (
              <Lock size={18} strokeWidth={2.5} />
            ) : (
              <BookOpen size={20} strokeWidth={2.2} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="display text-[16px] font-semibold text-indigo truncate">
                {module.title}
              </h3>
              {isActive && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-aubergine bg-paper px-2 py-0.5 rounded-full shrink-0">
                  In progress
                </span>
              )}
              {isComplete && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-forest bg-paper px-2 py-0.5 rounded-full shrink-0">
                  Earned
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-indigo/75">
              <span>{module.minutes} min</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Coins size={11} strokeWidth={2.5} className="text-terracotta" />
                +{module.reward} g$
              </span>
            </div>
          </div>
          {!isLocked && (
            <ChevronDown
              size={18}
              strokeWidth={2.5}
              className={`text-indigo flex-shrink-0 transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>
      </button>

      {isOpen && !isLocked && <ModuleRowPreview module={module} />}
    </div>
  );
}