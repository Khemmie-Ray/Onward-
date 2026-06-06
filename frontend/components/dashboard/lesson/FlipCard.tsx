"use client";

import { useState } from "react";
import { HandMetal, ArrowRight } from "lucide-react";
import { MudclothPattern } from "@/components/home/motifs";
import type { FlipCard as FlipCardData } from "@/lib/lessons/lesson-data";

export function FlipCard({
  data,
  onFlip,
}: {
  data: FlipCardData;
  onFlip?: (flipped: boolean) => void;
}) {
  const [flipped, setFlipped] = useState(false);

  const handleClick = () => {
    const next = !flipped;
    setFlipped(next);
    onFlip?.(next);
  };

  return (
    <div
      className="lg:w-[35%] md:w-[35%] w-full mx-auto"
      style={{ perspective: "1200px" }}
    >
      <button
        onClick={handleClick}
        aria-label={flipped ? "Show question" : "Reveal answer"}
        className="relative w-full aspect-[9/14] cursor-pointer"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 rounded-[24px] bg-mustard-tint p-7 flex flex-col text-left shadow-[0_20px_50px_rgba(31,58,110,0.10)] overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-indigo opacity-[0.05]"
          >
            <MudclothPattern />
          </div>
          <div className="relative flex flex-col h-full">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-mustard mb-auto">
              The question
            </div>
            <div className="display text-[26px] md:text-[30px] font-bold leading-[1.15] tracking-[-0.02em] text-indigo">
              {data.front}
            </div>
            <div className="mt-6 flex items-center gap-2 text-[12px] font-semibold text-indigo/70">
              <HandMetal size={14} strokeWidth={2.5} />
              <span>{data.hint}</span>
            </div>
          </div>
        </div>
        <div
          className="absolute inset-0 rounded-[24px] bg-aubergine p-7 flex flex-col text-left shadow-[0_20px_50px_rgba(91,46,92,0.25)] overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-paper opacity-[0.06]"
          >
          </div>
          <div className="relative flex flex-col h-full">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-mustard mb-3">
              The answer
            </div>
            <div className="text-[16px] md:text-[18px] leading-[1.55] text-paper">
              {data.back}
            </div>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-[12px] font-semibold text-mustard">
                Got it
              </span>
              <ArrowRight
                size={16}
                strokeWidth={2.5}
                className="text-mustard"
              />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
