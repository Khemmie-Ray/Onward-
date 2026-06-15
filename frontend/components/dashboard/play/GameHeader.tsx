"use client";

import { Clock, Trophy, X } from "lucide-react";

export function GameHeader({
  secondsLeft,
  score,
  onAbandonClick,
}: {
  secondsLeft: number;
  score: number;
  onAbandonClick: () => void;
}) {
  return (
    <div className="w-full flex items-center justify-between mb-6 px-2 max-w-[420px]">
      <div className="flex items-center gap-2">
        <Clock size={16} strokeWidth={2.5} className="text-terracotta" />
        <span className="display text-[24px] font-bold tabular-nums text-indigo">
          {secondsLeft}s
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Trophy size={16} strokeWidth={2.5} className="text-mustard" />
          <span className="display text-[24px] font-bold tabular-nums text-indigo">
            {score}
          </span>
        </div>
        <button
          onClick={onAbandonClick}
          aria-label="Quit round"
          className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-paper text-fg-soft hover:bg-terracotta-tint hover:text-terracotta transition"
        >
          <X size={14} strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
}
