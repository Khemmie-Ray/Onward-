"use client";

import { Loader2, Trophy, Zap } from "lucide-react";
import type { DailyCapMessage, FreeStep } from "./type";

export function FreeAction({
  step,
  capMessage,
  errorMessage,
  onStart,
  onSwitchToPremium,
}: {
  step: FreeStep;
  capMessage: DailyCapMessage;
  errorMessage: string | null;
  onStart: () => void;
  onSwitchToPremium: () => void;
}) {
  const isLoading = step === "starting";

  if (capMessage) {
    return (
      <div className="text-center w-full">
        <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-mustard/15">
          <Trophy size={24} strokeWidth={2.5} className="text-mustard" />
        </div>
        <h2 className="display text-[22px] font-bold text-indigo mb-2">
          Day complete
        </h2>
        <p className="text-sm text-fg-soft mb-6 max-w-70 mx-auto">
          {capMessage.message}
        </p>
        <button
          onClick={onSwitchToPremium}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-mustard text-indigo font-bold text-sm hover:bg-mustard/90 transition"
        >
          <Zap size={14} strokeWidth={2.5} />
          Play Premium instead
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="display text-[20px] font-bold text-indigo mb-2 text-center">
        Tap when you see scams
      </h2>
      <p className="text-[13px] text-fg-soft text-center   mb-6 leading-relaxed">
        Each round runs 60 seconds. Stay sharp and watch the popups.
      </p>

      {errorMessage && (
        <div className="w-full mb-4 px-4 py-3 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm text-center">
          {errorMessage}
        </div>
      )}

      <button
        onClick={onStart}
        disabled={isLoading}
        className="w-full lg:w-[50%] md:w-[50%] mx-auto py-4 rounded-xl bg-indigo text-cream font-bold text-base disabled:bg-indigo/50 disabled:cursor-not-allowed hover:bg-indigo/90 transition flex items-center justify-center gap-2"
      >
        {isLoading && (
          <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
        )}
        {isLoading ? "Preparing your round…" : "Play today's round"}
      </button>
    </div>
  );
}