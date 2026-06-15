"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import type { HoleState } from "./type";

export function Hole({
  state,
  onWhack,
  size = 100,
}: {
  state: HoleState | null;
  onWhack: () => void;
  size?: number;
}) {
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [floatNum, setFloatNum] = useState<1 | -1 | null>(null);
  const [whacked, setWhacked] = useState(false);

  useEffect(() => {
    setWhacked(false);
    setFeedback(null);
    setFloatNum(null);
  }, [state?.id]);

  const handleClick = () => {
    if (!state?.icon || whacked) return;
    setWhacked(true);
    setFeedback(state.isScam ? "correct" : "wrong");
    setFloatNum(state.isScam ? 1 : -1);
    onWhack();
    setTimeout(() => setFeedback(null), 400);
    setTimeout(() => setFloatNum(null), 800);
  };

  return (
    <div
      className="relative rounded-[14px] overflow-hidden bg-indigo/95 border border-indigo/40 shadow-inner"
      style={{ width: size, height: size }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3.5 bg-linear-to-t from-black/40 to-transparent rounded-b-[14px]"
      />

      {feedback && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 rounded-[14px] animate-fade-up ${
            feedback === "correct" ? "bg-forest/60" : "bg-terracotta/60"
          }`}
        />
      )}

      {state?.icon && !whacked && (
        <button
          onClick={handleClick}
          aria-label={`Whack ${state.icon.label}`}
          className="absolute inset-0 flex items-end justify-center pb-1 cursor-pointer animate-pop-up"
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

      {floatNum !== null && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 flex items-start justify-center pt-1 display font-bold text-[26px] animate-float-up [text-shadow:0_2px_8px_rgba(0,0,0,0.4)] ${
            floatNum > 0 ? "text-mustard" : "text-terracotta"
          }`}
        >
          {floatNum > 0 ? "+1" : "−1"}
        </div>
      )}
    </div>
  );
}