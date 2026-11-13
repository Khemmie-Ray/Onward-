"use client";

import { Loader2 } from "lucide-react";
import { WhackResult } from "./type";
import type { PlayMode } from "@/lib/scoring";

export function EndRoundModal({
  result,
  passed,
  familyLabel,
  rewardAmount,
  pointsAwarded,
  txPending,
  txHash,
  onSeeMissed,
  onPlayAgain,
}: {
  result: WhackResult;
  passed: boolean | null;
  mode: PlayMode;
  familyLabel: string;
  rewardAmount: number;
  pointsAwarded: number;
  txPending: boolean;
  txHash: string | null;
  onSeeMissed: () => void;
  onPlayAgain: () => void;
}) {
  const waiting = passed === null;
  const didPass = passed === true;

  const badge = waiting
    ? "Scoring…"
    : didPass
      ? pointsAwarded > 0
        ? `Round passed · +${pointsAwarded} pts`
        : "Round passed"
      : "Not passed yet";

  const title = waiting
    ? "Checking your round…"
    : didPass
      ? `You caught the ${familyLabel.toLowerCase()}`
      : "Close. A few slipped past you";

  return (
    <div className="w-full">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold ${
          waiting
            ? "bg-canvas-warm text-fg-soft"
            : didPass
              ? "bg-forest text-paper"
              : "bg-mustard/25 text-[#9a6b12]"
        }`}
      >
        {waiting && (
          <Loader2 size={12} strokeWidth={2.6} className="animate-spin" />
        )}
        {badge}
      </span>

      <h2 className="display mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em] text-indigo">
        {title}
      </h2>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <StatTile value={result.correctWhacks} label="caught" tone="forest" />
        <StatTile
          value={result.wrongWhacks}
          label="real ones tapped"
          tone="terracotta"
        />
        <StatTile value={result.missedScams} label="escaped" tone="aubergine" />
      </div>

      {didPass && rewardAmount > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-mustard/10 px-3 py-2 text-[12px]">
          <span className="font-semibold text-indigo">Bonus G$ paid</span>
          {txPending ? (
            <span className="flex items-center gap-1 text-fg-soft">
              <Loader2 size={11} strokeWidth={2.6} className="animate-spin" />
              Confirming…
            </span>
          ) : txHash ? (
            <a
              href={`https://celoscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-mustard hover:opacity-80"
            >
              +{rewardAmount} G$ →
            </a>
          ) : (
            <span className="font-bold text-mustard">+{rewardAmount} G$</span>
          )}
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onSeeMissed}
          className="flex-1 rounded-full bg-indigo py-3 text-[13px] font-bold text-paper transition hover:bg-indigo/90"
        >
          See what you missed
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex-1 rounded-full border-2 border-indigo/15 py-3 text-[13px] font-bold text-indigo transition hover:border-indigo/30 hover:bg-canvas-warm"
        >
          Play again
        </button>
      </div>
    </div>
  );
}

function StatTile({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "forest" | "terracotta" | "aubergine";
}) {
  const bg =
    tone === "forest"
      ? "bg-forest-tint"
      : tone === "terracotta"
        ? "bg-terracotta-tint"
        : "bg-aubergine-tint";
  const fg =
    tone === "forest"
      ? "text-forest"
      : tone === "terracotta"
        ? "text-terracotta"
        : "text-aubergine";
  return (
    <div className={`rounded-2xl p-3 ${bg}`}>
      <div
        className={`display text-[26px] font-bold leading-none tabular-nums ${fg}`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-indigo/70">
        {label}
      </div>
    </div>
  );
}
