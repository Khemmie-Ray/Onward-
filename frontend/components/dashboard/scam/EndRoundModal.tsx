"use client";

import Link from "next/link";
import { ArrowRight, Eye, Loader2, Trophy, X } from "lucide-react";
import ScenarioCard from "./ScenarioCard";
import { MudclothPattern } from "@/components/home/motifs";
import type { Scenario } from "@/lib/scam/patterns";
import type { WhackResult } from "./WhackAScamGame";
import { passThresholdText, type PlayMode } from "@/lib/scoring";

export function EndRoundModal({
  result,
  passed,
  mode,
  familyLabel,
  familyDescription,
  exemplar,
  rewardAmount,
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

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[10%] left-[15%] h-[400px] w-[400px] rounded-full opacity-50 blur-[100px] bg-[radial-gradient(circle,rgba(230,180,72,0.6)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[10%] right-[15%] h-[400px] w-[400px] rounded-full opacity-40 blur-[100px] bg-[radial-gradient(circle,rgba(199,93,63,0.5)_0%,transparent_70%)]"
      />

      <div className="relative w-full max-w-[500px] animate-[fade-up_0.8s_ease_both]">
        <div className="text-center mb-7">
          <div className="mb-4 inline-flex items-center justify-center">
            {isWaitingForVerdict ? (
              <Loader2
                size={56}
                strokeWidth={1.8}
                className="text-indigo animate-spin"
              />
            ) : didPass ? (
              <Trophy size={56} strokeWidth={1.8} className="text-mustard" />
            ) : (
              <X size={56} strokeWidth={1.8} className="text-terracotta" />
            )}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-soft mb-2">
            {isWaitingForVerdict
              ? "Calculating result…"
              : didPass
              ? "Round passed"
              : "Round didn't pass"}
          </div>
          <h1 className="display text-[40px] font-bold leading-[1.1] tracking-[-0.025em] text-indigo">
            {result.score} {result.score === 1 ? "point" : "points"}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <StatTile
            label="Correct"
            value={result.correctWhacks}
            tone="forest"
          />
          <StatTile
            label="Wrong"
            value={result.wrongWhacks}
            tone="terracotta"
          />
          <StatTile
            label="Missed"
            value={result.missedScams}
            tone="aubergine"
          />
        </div>

        {didPass && (
          <div className="relative w-full bg-aubergine rounded-[18px] p-5 mb-5 overflow-hidden shadow-[0_8px_24px_rgba(91,46,92,0.20)]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 text-paper opacity-[0.06]"
            >
              <MudclothPattern />
            </div>
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-mustard mb-0.5">
                  Reward
                </div>
                <div className="display text-[24px] font-bold text-mustard tabular-nums">
                  +{rewardAmount} g$
                </div>
              </div>
              {leveledUp && (
                <div className="text-right">
                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-mustard mb-0.5">
                    Level up
                  </div>
                  <div className="display text-[20px] font-bold text-paper tabular-nums">
                    {levelBefore} → {levelAfter}
                  </div>
                </div>
              )}
            </div>
            {txPending ? (
              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-paper/70">
                <Loader2 size={11} strokeWidth={2.5} className="animate-spin" />
                Confirming on Celo…
              </div>
            ) : (
              txHash && (
                <a
                  href={`https://celoscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center justify-center gap-1 text-[10px] font-semibold text-mustard hover:opacity-80"
                >
                  View reward tx →
                </a>
              )
            )}
          </div>
        )}

        {passed === false && (
          <div className="rounded-[18px] bg-terracotta-tint p-5 mb-5 text-center">
            <p className="text-[13px] font-semibold text-terracotta leading-snug">
              You need {passThresholdText(mode)} to earn the reward. Try again — you&apos;ll get faster.
            </p>
          </div>
        )}

        <div className="rounded-[20px] bg-paper p-6 mb-6 shadow-[0_8px_24px_rgba(31,58,110,0.08)]">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={14} strokeWidth={2.5} className="text-terracotta" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-terracotta">
              Today&apos;s scam pattern
            </span>
          </div>
          <h2 className="display text-[22px] font-bold tracking-[-0.015em] text-indigo mb-2">
            {familyLabel}
          </h2>
          <p className="text-[13px] text-fg-soft leading-[1.55] mb-5">
            {familyDescription}
          </p>

          <div className="flex justify-center mb-4">
            <ScenarioCard scenario={exemplar as unknown as Scenario} />
          </div>

          <div className="rounded-[12px] bg-indigo p-3.5">
            <p className="text-[12px] leading-[1.5] text-paper">
              {exemplar.teaching}
            </p>
          </div>
        </div>

        <div className="text-center text-[11px] text-fg-soft mb-6">
          You judged {totalWhacks} popups with {precision}% precision.
        </div>

        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 rounded-full bg-terracotta py-3.5 text-[13px] font-bold text-paper shadow-[0_6px_20px_rgba(199,93,63,0.30)] transition-transform hover:-translate-y-0.5"
          >
            Play again
          </button>
          <Link
            href="/overview"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-paper py-3.5 text-[13px] font-bold text-indigo shadow-[0_4px_12px_rgba(31,58,110,0.06)] transition-transform hover:-translate-y-0.5"
          >
            Back
            <ArrowRight size={13} strokeWidth={2.8} />
          </Link>
        </div>
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
    <div className={`rounded-[14px] p-3.5 ${bg} text-center`}>
      <div className={`display text-[26px] font-bold tabular-nums ${fg}`}>
        {value}
      </div>
      <div
        className={`text-[9px] font-bold uppercase tracking-[0.12em] ${fg} opacity-80 mt-0.5`}
      >
        {label}
      </div>
    </div>
  );
}