"use client";

import { useState } from "react";
import Image from "next/image";
import { HandMetal, ArrowRight } from "lucide-react";
import type { FlipCard as FlipCardData } from "@/lib/lessons/lesson-data";
import { resolveCardIcon } from "@/lib/lessons/card-icons";

export function FlipCard({
  data,
  onFlip,
}: {
  data: FlipCardData;
  onFlip?: (flipped: boolean) => void;
}) {
  const [flipped, setFlipped] = useState(false);

  const icon = resolveCardIcon((data as { icon?: string }).icon);

  const handleClick = () => {
    const next = !flipped;
    setFlipped(next);
    onFlip?.(next);
  };

  return (
    <div className="w-full max-w-[900px] lg:w-[85%] md:w-[90%] mx-auto p-4">
      <button
        onClick={handleClick}
        aria-label={flipped ? "Show question" : "Reveal answer"}
        className="relative w-full cursor-pointer"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div className="grid" style={{ transformStyle: "preserve-3d" }}>
          <div
            className="rounded-[24px] bg-mustard-tint p-7 flex flex-col text-left shadow-[0_20px_50px_rgba(31,58,110,0.10)] min-h-[320px] max-h-[70vh] overflow-y-auto no-scrollbar"
            style={{
              gridArea: "1 / 1",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div className="flex flex-col h-full">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-mustard mb-auto">
                The question
              </div>
              {icon && (
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-paper/60 p-2.5 shadow-sm">
                    {icon.kind === "brand" ? (
                      <Image
                        src={icon.url}
                        alt={data.front}
                        width={48}
                        height={48}
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <icon.Icon
                        size={34}
                        strokeWidth={1.9}
                        className="text-indigo"
                        aria-hidden
                      />
                    )}
                  </div>
                </div>
              )}
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
            className="rounded-[24px] bg-aubergine p-7 flex flex-col text-left shadow-[0_20px_50px_rgba(91,46,92,0.25)] min-h-[320px] max-h-[70vh] overflow-y-auto no-scrollbar"
            style={{
              gridArea: "1 / 1",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex flex-col h-full">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-mustard mb-3">
                The answer
              </div>
              <div className="text-[16px] md:text-[18px] leading-[1.55] text-paper whitespace-pre-line">
                {data.back}
              </div>
              <div className="mt-6 flex items-center justify-between shrink-0">
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
        </div>
      </button>
    </div>
  );
}
