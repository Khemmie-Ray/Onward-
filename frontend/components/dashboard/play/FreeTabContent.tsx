"use client";

import { Loader2, Trophy, Zap } from "lucide-react";
import { passThresholdText, rewardText } from "@/lib/scoring";
import type { DailyCapMessage, FreeStep } from "./type";

export function FreeTabContent({
  capMessage,
  errorMessage,
  step,
  onStart,
  onSwitchToPremium,
}: {
  capMessage: DailyCapMessage;
  errorMessage: string | null;
  step: FreeStep;
  onStart: () => void;
  onSwitchToPremium: () => void;
}) {
  const isLoading = step === "starting";

  if (capMessage) {
    return (
      <div className="text-center py-2">
        <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-mustard/15">
          <Trophy size={20} strokeWidth={2.5} className="text-mustard" />
        </div>
        <h2 className="display text-[20px] font-bold text-indigo mb-2">
          Day complete
        </h2>
        <p className="text-sm text-fg-soft mb-5">{capMessage.message}</p>
        <button
          onClick={onSwitchToPremium}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-mustard text-indigo font-bold text-sm hover:bg-mustard/90 transition"
        >
          <Zap size={14} strokeWidth={2.5} />
          Play Premium instead
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="display text-[22px] font-bold text-indigo mb-2">
        Today&apos;s free round
      </h2>
      <p className="text-sm text-fg-soft mb-4">
        60 seconds. One round per UTC day. Pass to earn {rewardText("free")} and
        add to your streak.
      </p>
      <ul className="mb-5 space-y-2 text-sm text-fg-soft">
        <li className="flex items-start gap-2">
          <span className="text-indigo font-bold mt-0.5">→</span>
          <span>Pass threshold: {passThresholdText("free")}</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-indigo font-bold mt-0.5">→</span>
          <span>Reward: {rewardText("free")} + streak day</span>
        </li>
      </ul>

      {errorMessage && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
          {errorMessage}
        </div>
      )}

      <button
        onClick={onStart}
        disabled={isLoading}
        className="w-full py-4 rounded-xl bg-indigo text-cream font-bold text-base disabled:bg-indigo/50 disabled:cursor-not-allowed hover:bg-indigo/90 transition flex items-center justify-center gap-2"
      >
        {isLoading && (
          <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
        )}
        {isLoading ? "Preparing your round…" : "Play today's round"}
      </button>
    </div>
  );
}