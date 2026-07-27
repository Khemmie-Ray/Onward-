import React from "react";
import { Lock, Check, ArrowRight } from "lucide-react";
import { LoopSigil } from "@/components/home/motifs";

export type TrackCard = {
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  status: "available" | "coming_soon";
  total_modules: number;
  completed_modules: number;
  progress_state:
    | "not_started"
    | "in_progress"
    | "complete"
    | "coming_soon"
    | "empty";
};

export const TrackCardView = ({
  track,
  onOpen,
}: {
  track: TrackCard;
  onOpen: () => void;
}) => {
  const isComingSoon = track.status === "coming_soon";
  const isComplete = track.progress_state === "complete";
  const pct =
    track.total_modules > 0
      ? Math.round((track.completed_modules / track.total_modules) * 100)
      : 0;
  
  return (
    <button
      onClick={onOpen}
      disabled={isComingSoon}
      className={`group relative text-left rounded-[18px] p-5 transition-all ${
        isComingSoon
          ? "bg-paper/40 cursor-not-allowed"
          : "bg-paper shadow-[0_2px_8px_rgba(31,58,110,0.05)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(31,58,110,0.1)]"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            isComingSoon
              ? "bg-canvas-warm/50"
              : isComplete
                ? "bg-forest/15"
                : "bg-mustard/15"
          }`}
        >
          {isComingSoon ? (
            <Lock size={16} strokeWidth={2.5} className="text-fg-soft/50" />
          ) : isComplete ? (
            <Check size={18} strokeWidth={3} className="text-forest" />
          ) : (
            <LoopSigil size={20} color="var(--color-indigo)" />
          )}
        </div>

        {!isComingSoon && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-fg-soft tabular-nums">
            {track.completed_modules}/{track.total_modules}
          </span>
        )}
      </div>

      <div className="display text-[17px] font-semibold text-indigo leading-tight mb-1.5">
        {track.title}
      </div>
      <p className="text-[12px] text-fg-soft leading-snug mb-4 line-clamp-2">
        {isComingSoon ? "Coming soon." : track.description}
      </p>
      {!isComingSoon && track.total_modules > 0 && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-canvas-warm overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isComplete ? "bg-forest" : "bg-terracotta"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
      {isComingSoon ? (
        <div className="text-[11px] font-bold uppercase tracking-widest text-fg-soft/40">
          Locked
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[12px] font-bold text-terracotta">
          {isComplete
            ? "Review"
            : track.completed_modules > 0
              ? "Continue"
              : "Start"}
          <ArrowRight
            size={13}
            strokeWidth={2.8}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </div>
      )}
    </button>
  );
};
