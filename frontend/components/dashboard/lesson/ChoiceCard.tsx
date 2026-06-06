"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { MudclothPattern } from "@/components/home/motifs";
import type { ChoiceCard as ChoiceCardData } from "@/lib/lessons/lesson-data";

export function ChoiceCard({
  data,
  onAnswer,
}: {
  data: ChoiceCardData;
  onAnswer: (selectedIndex: number, correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    onAnswer(index, index === data.correctIndex);
  };

  const locked = selected !== null;
  const wasCorrect = selected === data.correctIndex;

  return (
    <div className="w-full max-w-120 mx-auto">
      <div className="relative rounded-[24px] bg-paper p-7 shadow-[0_20px_50px_rgba(31,58,110,0.10)] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-indigo opacity-[0.03]"
        >
          <MudclothPattern />
        </div>

        <div className="relative">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-terracotta mb-3">
            Quick check
          </div>
          <h2 className="display text-[22px] md:text-[26px] font-semibold leading-tight tracking-[-0.015em] text-indigo mb-6">
            {data.question}
          </h2>

          <div className="flex flex-col gap-2.5">
            {data.options.map((option, i) => {
              const isThisSelected = selected === i;
              const isCorrect = i === data.correctIndex;
              const showCorrect = locked && isCorrect;
              const showWrong = locked && isThisSelected && !isCorrect;

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={locked}
                  className={`group text-left p-4 rounded-[14px] text-[14px] font-medium transition-all ${
                    showCorrect
                      ? "bg-forest text-paper"
                      : showWrong
                        ? "bg-terracotta text-paper"
                        : locked
                          ? "bg-canvas-warm text-fg-soft opacity-60"
                          : "bg-canvas-warm text-indigo hover:bg-mustard-tint hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{option}</span>
                    {showCorrect && (
                      <Check size={18} strokeWidth={3} className="shrink-0" />
                    )}
                    {showWrong && (
                      <X size={18} strokeWidth={3} className="shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {locked && (
            <div
              className={`mt-5 p-4 rounded-[14px] text-[13px] leading-[1.55] animate-[fade-up_0.4s_ease_both] ${
                wasCorrect
                  ? "bg-forest-tint text-forest"
                  : "bg-terracotta-tint text-terracotta"
              }`}
            >
              <div className="font-bold mb-1 text-[11px] uppercase tracking-widest">
                {wasCorrect ? "Right" : "Not quite"}
              </div>
              {data.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
