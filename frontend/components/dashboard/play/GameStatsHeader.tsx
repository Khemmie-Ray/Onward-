"use client";

import { Check } from "lucide-react";

function fmt(s: number): string {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = Math.max(0, s) % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function Ring({ seconds, total }: { seconds: number; total: number }) {
  const size = 44;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.max(0, Math.min(1, seconds / total)) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-paper/15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="text-[#5CC27C] transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold tabular-nums text-paper">
        {fmt(seconds)}
      </span>
    </div>
  );
}

export function GameStatsHeader({
  secondsLeft,
  totalSeconds = 60,
  status,
  caught,
  threshold,
  totalScams,
  points,
  wrong,
  escaped,
}: {
  secondsLeft: number;
  totalSeconds?: number;
  status: string;
  caught: number;
  threshold: number;
  totalScams: number;
  points: number;
  wrong: number;
  escaped: number;
}) {
  const passed = caught >= threshold;

  const denom = totalScams;
  const pct = denom > 0 ? Math.min(100, Math.round((caught / denom) * 100)) : 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_auto]">
      <div className="flex items-center gap-3 rounded-2xl bg-[#1C133D] px-4 py-3">
        <Ring seconds={secondsLeft} total={totalSeconds} />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-paper/55">
            Time left
          </div>
          <div className="text-[13px] font-bold text-paper">{status}</div>
        </div>
      </div>
      <div className="flex flex-col justify-center rounded-2xl bg-white px-4 py-3 shadow-[0_2px_10px_rgba(31,58,110,0.05)]">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-bold text-indigo">Pass line</span>
          <span className="text-[12.5px] font-semibold text-fg-soft">
            <span className="display text-[16px] font-bold text-indigo tabular-nums">
              {caught}
            </span>{" "}
            / {denom} scams caught
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas-warm">
            <div
              className={`h-full rounded-full transition-all ${passed ? "bg-forest" : "bg-mustard"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              passed ? "bg-forest text-paper" : "bg-canvas-warm text-fg-soft"
            }`}
          >
            <Check size={12} strokeWidth={3} />
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-mustard px-5 py-3">
        <div className="display text-[26px] font-bold tabular-nums text-indigo">
          {points}
        </div>
        <div>
          <div className="text-[12px] font-bold text-indigo">points</div>
          <div className="text-[11px] font-semibold text-indigo/70">
            {wrong} wrong · {escaped} escaped
          </div>
        </div>
      </div>
    </div>
  );
}
