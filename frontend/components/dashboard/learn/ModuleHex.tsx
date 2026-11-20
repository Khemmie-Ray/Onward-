"use client";

import { Check, Clock, Sparkles } from "lucide-react";

export type HexState = "done" | "in_progress" | "next" | "locked";

export type HexModule = {
  slug: string;
  order: number;
  title: string;
  minutes: number;
  points: number;
  state: HexState;
  progressPct?: number | null;
};

const FILL: Record<HexState, string> = {
  done: "#5CC27C",
  in_progress: "#241A4D",
  next: "transparent",
  locked: "rgba(255,255,255,0.03)",
};

const STROKE: Record<HexState, string> = {
  done: "#2E7A4C",
  in_progress: "#E6B448",
  next: "rgba(255,255,255,0.6)",
  locked: "rgba(255,255,255,0.12)",
};
const STROKE_W: Record<HexState, number> = {
  done: 3,
  in_progress: 3,
  next: 3,
  locked: 2,
};
const HEX_POINTS = "50,1.5 99,29 99,86.5 50,114 1,86.5 1,29";

export function ModuleHex({
  module,
  width = 104,
  onOpen,
}: {
  module: HexModule;
  width?: number;
  onOpen?: (slug: string) => void;
}) {
  const height = Math.round(width * 1.1547);
  const isLocked = module.state === "locked";
  const num = String(module.order).padStart(2, "0");
  const textColor =
    module.state === "done"
      ? "#15321F"
      : isLocked
        ? "rgba(255,255,255,0.35)"
        : "#F7EDDD";

  return (
    <div className="group/hex relative" style={{ width, height }}>
      <button
        type="button"
        disabled={isLocked}
        onClick={() => !isLocked && onOpen?.(module.slug)}
        aria-label={`Module ${num}: ${module.title}`}
        className={`relative block h-full w-full transition-transform ${
          isLocked ? "cursor-default" : "cursor-pointer hover:scale-[1.05]"
        }`}
      >
        <svg
          viewBox="0 0 100 115"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <polygon
            points={HEX_POINTS}
            fill={FILL[module.state]}
            stroke={STROKE[module.state]}
            strokeWidth={STROKE_W[module.state]}
            strokeDasharray={module.state === "next" ? "5 5" : undefined}
          />
        </svg>
        <span
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ color: textColor }}
        >
          <span className="display text-[20px] font-bold leading-none tabular-nums">
            {num}
          </span>
          <HexLabel state={module.state} pct={module.progressPct} />
        </span>
      </button>
      {!isLocked && (
        <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 w-44 -translate-x-1/2 scale-95 rounded-xl bg-paper p-3 text-left opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-all duration-150 group-hover/hex:scale-100 group-hover/hex:opacity-100">
          <p className="line-clamp-2 text-[12.5px] font-bold leading-tight text-indigo">
            {module.title}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-fg-soft">
            <span className="flex items-center gap-1">
              <Clock size={12} strokeWidth={2.4} />
              {module.minutes} min
            </span>
            <span className="flex items-center gap-1 text-terracotta">
              <Sparkles size={12} strokeWidth={2.4} />
              {module.points} pts
            </span>
          </div>
          <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-paper" />
        </div>
      )}
    </div>
  );
}

function HexLabel({ state, pct }: { state: HexState; pct?: number | null }) {
  if (state === "done")
    return (
      <span className="mt-0.5 flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide">
        <Check size={9} strokeWidth={3} />
        done
      </span>
    );
  if (state === "in_progress")
    return (
      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-mustard">
        {pct != null ? `${pct}%` : "in progress"}
      </span>
    );
  if (state === "next")
    return (
      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-paper/70">
        next
      </span>
    );
  return null;
}
