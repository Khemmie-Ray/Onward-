"use client";

import { motion } from "framer-motion";
import { Lock, Check, ArrowRight, Clock, Sparkles } from "lucide-react";
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
  next_module: {
    slug: string;
    title: string;
    estimated_minutes: number;
    points_reward: number;
  } | null;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export const TrackCardView = ({
  track,
  onOpen,
  index = 0,
}: {
  track: TrackCard;
  onOpen: () => void;
  index?: number;
}) => {
  const isComingSoon = track.status === "coming_soon";
  const isComplete = track.progress_state === "complete";
  const pct =
    track.total_modules > 0
      ? Math.round((track.completed_modules / track.total_modules) * 100)
      : 0;
  const cta = isComplete
    ? "Review"
    : track.completed_modules > 0
      ? "Continue"
      : "Start";

  return (
    <motion.div
      onClick={onOpen}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: EASE }}
      whileHover={isComingSoon ? undefined : { y: -3 }}
      whileTap={isComingSoon ? undefined : { scale: 0.995 }}
      className={`group flex w-full flex-col rounded-2xl p-5 text-left mb-4 ${
        isComingSoon
          ? "cursor-not-allowed bg-white/55 shadow-[0_2px_10px_rgba(31,58,110,0.05)]"
          : "bg-white shadow-[0_6px_24px_rgba(31,58,110,0.10)] transition-shadow hover:shadow-[0_14px_38px_rgba(31,58,110,0.16)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isComingSoon
              ? "bg-canvas-warm"
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
            <LoopSigil size={19} color="var(--color-indigo)" />
          )}
        </span>
        <h3 className="display flex-1 text-[18px] font-bold leading-tight text-indigo">
          {track.title}
        </h3>
        {!isComingSoon && (
          <span className="shrink-0 rounded-full bg-canvas-warm px-2.5 py-1 text-[11px] font-bold tabular-nums text-indigo">
            {track.completed_modules}/{track.total_modules}
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-1 text-[12.5px] leading-snug text-fg-soft">
        {isComingSoon ? "Coming soon." : track.description}
      </p>

      {!isComingSoon && track.total_modules > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-fg-soft">
            <span>{isComplete ? "Complete" : `${pct}% complete`}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-canvas-warm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{
                duration: 0.7,
                delay: index * 0.06 + 0.2,
                ease: EASE,
              }}
              className={`h-full rounded-full ${
                isComplete ? "bg-forest" : "bg-mustard"
              }`}
            />
          </div>
        </div>
      )}
      {isComingSoon ? (
        <div className="mt-4 border-t border-canvas-warm pt-3.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-fg-soft/40">
            Locked
          </span>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-canvas-warm/60 p-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft">
              {isComplete ? "Finished" : "Up next"}
            </div>
            <div className="mt-0.5 truncate text-[13px] font-semibold text-indigo">
              {isComplete
                ? "You've completed this track"
                : (track.next_module?.title ?? "Start the first module")}
            </div>
            {!isComplete && track.next_module && (
              <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-fg-soft">
                <span className="flex items-center gap-1">
                  <Clock size={11} strokeWidth={2.4} />
                  {track.next_module.estimated_minutes} min
                </span>
                <span className="flex items-center gap-1 text-terracotta">
                  <Sparkles size={11} strokeWidth={2.4} />
                  {track.next_module.points_reward} pts
                </span>
              </div>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-indigo px-3.5 py-2 text-[12px] font-bold text-paper transition group-hover:bg-indigo/90">
            {cta}
            <ArrowRight
              size={13}
              strokeWidth={2.8}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      )}
    </motion.div>
  );
};
