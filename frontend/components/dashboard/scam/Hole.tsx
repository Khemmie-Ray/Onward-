"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import type { WhackIcon } from "@/lib/scam/whackIcon";

export type HoleState = {
  id: number;
  icon: WhackIcon | null;
  isScam: boolean;
  appearedAt: number; // performance.now() timestamp
  durationMs: number;
};

export function Hole({
  state,
  onWhack,
  size = 100,
}: {
  state: HoleState | null;
  onWhack: (isScam: boolean) => void;
  size?: number;
}) {
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [whacked, setWhacked] = useState(false);

  useEffect(() => {
    setWhacked(false);
    setFeedback(null);
  }, [state?.id]);

  const handleClick = () => {
    if (!state?.icon || whacked) return;
    setWhacked(true);
    setFeedback(state.isScam ? "correct" : "wrong");
    onWhack(state.isScam);
    setTimeout(() => setFeedback(null), 400);
  };

  return (
    <div
      className="relative rounded-[14px] overflow-hidden bg-indigo/95 border border-indigo/40 shadow-inner"
      style={{ width: size, height: size }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[14px] bg-gradient-to-t from-black/40 to-transparent rounded-b-[14px]"
      />
      {feedback && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 rounded-[14px] ${
            feedback === "correct" ? "bg-forest/60" : "bg-terracotta/60"
          } animate-[fade-up_0.4s_ease_both]`}
        />
      )}
      {state?.icon && !whacked && (
        <button
          onClick={handleClick}
          aria-label={`Whack ${state.icon.label}`}
          className="absolute inset-0 flex items-end justify-center pb-1 cursor-pointer animate-[pop-up_0.25s_ease_both]"
        >
          <Image
            src={state.icon.src}
            alt={state.icon.label}
            width={size * 0.8}
            height={size * 0.8}
            className="object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.30)]"
            priority
            unoptimized
          />
        </button>
      )}

      <style jsx>{`
        @keyframes pop-up {
          0% {
            transform: translateY(60%);
            opacity: 0;
          }
          60% {
            transform: translateY(-8%);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
