"use client";

import Link from "next/link";
import { ArrowRight, Eye, Loader2, Trophy, X } from "lucide-react";
import ScenarioCard from "../scam/ScenarioCard";
import { MudclothPattern } from "@/components/home/motifs";
import type { Scenario } from "@/lib/scam/patterns";
import { WhackResult } from "./type";
import { passThresholdText, type PlayMode } from "@/lib/scoring";

export function EndRoundModal({
  result,
  passed,
  mode,
  familyLabel,
  familyDescription,
  exemplar,
  rewardAmount,
  pointsAwarded,
  newPointsBalance,
  levelBefore,
  levelAfter,
  txPending,
  txHash,
  onPlayAgain,
}: {
  result: WhackResult;
  passed: boolean | null;
  mode: PlayMode;
  familyLabel: string;
  familyDescription: string;
  exemplar: {
    kind: string;
    content: Record<string, unknown>;
    teaching: string;
  };
  rewardAmount: number;
  pointsAwarded: number;
  newPointsBalance: number | null;
  levelBefore: number;
  levelAfter: number;
  txPending: boolean;
  txHash: string | null;
  onPlayAgain: () => void;
}) {
  const leveledUp = levelAfter > levelBefore;
  const totalWhacks = result.correctWhacks + result.wrongWhacks;
  const precision =
    totalWhacks > 0
      ? Math.round((result.correctWhacks / totalWhacks) * 100)
      : 0;

  const isWaitingForVerdict = passed === null;
  const didPass = passed === true;
  const hasGReward = rewardAmount > 0;
  const hasPointsReward = pointsAwarded > 0;

  return (
    <div className="w-full">
      <div className="text-center mb-5">
        <div className="mb-3 inline-flex items-center justify-center">
          {isWaitingForVerdict ? (
            <Loader2
              size={44}
              strokeWidth={1.8}
              className="text-indigo animate-spin"
            />
          ) : didPass ? (
            <Trophy size={44} strokeWidth={1.8} className="text-mustard" />
          ) : (
            <X size={44} strokeWidth={1.8} className="text-terracotta" />
          )}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-soft mb-2">
          {isWaitingForVerdict
            ? "Calculating result…"
            : didPass
              ? "Round passed"
              : "Round didn't pass"}
        </div>
        <h1 className="display text-[32px] font-bold leading-[1.1] tracking-[-0.025em] text-indigo">
          {result.score} {result.score === 1 ? "point" : "points"}
        </h1>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatTile label="Correct" value={result.correctWhacks} tone="forest" />
        <StatTile label="Wrong" value={result.wrongWhacks} tone="terracotta" />
        <StatTile label="Missed" value={result.missedScams} tone="aubergine" />
      </div>

      {/* Reward block - shows when passed with any reward */}
      {didPass && (hasPointsReward || hasGReward || leveledUp) && (
        <div className="relative w-full bg-aubergine rounded-[16px] p-4 mb-4 overflow-hidden shadow-[0_4px_16px_rgba(91,46,92,0.15)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-paper opacity-[0.06]"
          >
            <MudclothPattern />
          </div>
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              {hasPointsReward && (
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-mustard mb-0.5">
                    Points earned
                  </div>
                  <div className="display text-[22px] font-bold text-mustard tabular-nums">
                    +{pointsAwarded}
                  </div>
                </div>
              )}
              {leveledUp && (
                <div className="text-right">
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-mustard mb-0.5">
                    Level up
                  </div>
                  <div className="display text-[18px] font-bold text-paper tabular-nums">
                    {levelBefore} → {levelAfter}
                  </div>
                </div>
              )}
            </div>

            {newPointsBalance != null && hasPointsReward && (
              <div className="border-t border-paper/15 pt-3 mt-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-paper/70">
                  Your balance
                </span>
                <span className="display text-[18px] font-bold text-paper tabular-nums">
                  {newPointsBalance.toLocaleString()}
                </span>
              </div>
            )}

            {/* Only show G$ if it was actually distributed (interim, for premium) */}
            {hasGReward && (
              <div className="border-t border-paper/15 pt-3 mt-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mustard">
                  Bonus G$ paid
                </span>
                <span className="display text-[18px] font-bold text-mustard tabular-nums">
                  +{rewardAmount} G$
                </span>
              </div>
            )}
          </div>

          {hasGReward && txPending ? (
            <div className="relative mt-3 flex items-center justify-center gap-2 text-[10px] text-paper/70">
              <Loader2 size={11} strokeWidth={2.5} className="animate-spin" />
              Confirming on Celo…
            </div>
          ) : (
            hasGReward &&
            txHash && (
              <a
                href={`https://celoscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="relative mt-3 flex items-center justify-center gap-1 text-[10px] font-semibold text-mustard hover:opacity-80"
              >
                View reward tx →
              </a>
            )
          )}
        </div>
      )}

      {/* Points → G$ note (when points-only, no immediate G$) */}
      {didPass && hasPointsReward && !hasGReward && (
        <div className="rounded-[12px] bg-mustard/10 border border-mustard/30 p-3 mb-4">
          <p className="text-[11px] text-indigo/80 leading-snug text-center">
            Your points will convert to G$ when claims open.
          </p>
        </div>
      )}

      {passed === false && (
        <div className="rounded-[14px] bg-terracotta-tint p-4 mb-4 text-center">
          <p className="text-[12px] font-semibold text-terracotta leading-snug">
            You need {passThresholdText(mode)} to earn the reward. Try again —
            you&apos;ll get faster.
          </p>
        </div>
      )}

      {/* Scam pattern teaching */}
      <div className="rounded-[16px] bg-canvas-warm p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Eye size={12} strokeWidth={2.5} className="text-terracotta" />
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-terracotta">
            Today&apos;s scam pattern
          </span>
        </div>
        <h2 className="display text-[18px] font-bold tracking-[-0.015em] text-indigo mb-2">
          {familyLabel}
        </h2>
        <p className="text-[12px] text-fg-soft leading-[1.55] mb-4">
          {familyDescription}
        </p>

        <div className="flex justify-center mb-3">
          <ScenarioCard scenario={exemplar as unknown as Scenario} />
        </div>

        <div className="rounded-[10px] bg-indigo p-3">
          <p className="text-[11px] leading-[1.5] text-paper">
            {exemplar.teaching}
          </p>
        </div>
      </div>

      <div className="text-center text-[10px] text-fg-soft mb-4">
        You judged {totalWhacks} popups with {precision}% precision.
      </div>

      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 rounded-full bg-terracotta py-3 text-[12px] font-bold text-paper shadow-[0_4px_14px_rgba(199,93,63,0.25)] transition-transform hover:-translate-y-0.5"
        >
          Play again
        </button>
        <Link
          href="/overview"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-canvas-warm py-3 text-[12px] font-bold text-indigo transition-transform hover:-translate-y-0.5"
        >
          Back
          <ArrowRight size={12} strokeWidth={2.8} />
        </Link>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
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
    <div className={`rounded-[12px] p-3 ${bg} text-center`}>
      <div className={`display text-[22px] font-bold tabular-nums ${fg}`}>
        {value}
      </div>
      <div
        className={`text-[8px] font-bold uppercase tracking-[0.12em] ${fg} opacity-80 mt-0.5`}
      >
        {label}
      </div>
    </div>
  );
}
