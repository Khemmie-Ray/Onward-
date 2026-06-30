"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import type { WhackIcon } from "@/lib/scam/whackIcon";

type ExemplarShape = {
  kind: string;
  content: Record<string, unknown>;
  teaching: string;
};

type Props = {
  familyLabel: string;
  familyDescription: string;
  exemplar: ExemplarShape;
  scamIcon: WhackIcon;
  onReady: () => void;
  isStarting?: boolean;
};

export function PreRoundBriefing({
  familyLabel,
  familyDescription,
  scamIcon,
  onReady,
  isStarting = false,
}: Props) {
  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-5">
        <div className="relative w-20 h-20 rounded-2xl bg-aubergine/95 flex items-center justify-center shadow-[0_8px_24px_rgba(91,46,92,0.25)] mb-3">
          <Image
            src={scamIcon.src}
            alt={scamIcon.label}
            width={56}
            height={56}
            priority
          />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-soft">
          Whack this when you see it
        </p>
      </div>
      <div className="text-center mb-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-terracotta mb-1">
          Today&apos;s scam pattern
        </div>
        <h2 className="display text-[22px] font-bold text-indigo leading-tight mb-2">
          {familyLabel}
        </h2>
        <p className="text-sm text-fg-soft leading-relaxed">
          {familyDescription}
        </p>
      </div>
      <button
        onClick={onReady}
        disabled={isStarting}
        className="w-full lg:w-[50%] md:w-[50%] mx-auto py-4 rounded-xl bg-indigo text-cream font-bold text-base disabled:bg-indigo/50 disabled:cursor-not-allowed hover:bg-indigo/90 transition flex items-center justify-center gap-2"
      >
        {isStarting && (
          <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
        )}
        {isStarting ? "Starting…" : "Play →"}
      </button>
    </div>
  );
}
