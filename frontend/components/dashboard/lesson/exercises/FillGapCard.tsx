"use client";

import { useState } from "react";
import type { FillGapCard as FillGapCardData } from "@/lib/lessons/lesson-data";
import { seededOrder } from "@/lib/learn/shuffle";
import { ExerciseFrame, tileClass } from "./ExerciseFrame";

export function FillGapCard({
  data,
  verdict,
  onDraft,
}: {
  data: FillGapCardData;
  verdict: boolean | null;
  onDraft: (answer: string | null) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const checked = verdict !== null;
  const order = seededOrder(data.choices.length, data.sentence);
  const [before, after] = data.sentence.split("___");

  const pick = (word: string) => {
    if (checked) return;
    const next = picked === word ? null : word;
    setPicked(next);
    onDraft(next);
  };

  const gapClass =
    picked === null
      ? "min-w-24 border-2 border-dashed border-indigo/30 text-transparent"
      : verdict === true
        ? "bg-mint text-indigo"
        : verdict === false
          ? "bg-terracotta text-paper"
          : "bg-indigo text-paper";

  return (
    <ExerciseFrame label="Fill the gap">
      <p className="display rounded-3xl bg-paper p-5 text-[21px] font-bold leading-normal tracking-[-0.01em] text-indigo md:bg-canvas md:p-6 md:text-[23px]">
        {before}
        <span
          className={`mx-1 inline-block rounded-[10px] px-2.5 text-center ${gapClass}`}
        >
          {picked ?? "____"}
        </span>
        {after}
      </p>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {order.map((i) => {
          const word = data.choices[i];
          const inGap = picked === word;
          return (
            <button
              key={word}
              type="button"
              onClick={() => pick(word)}
              disabled={checked}
              aria-pressed={inGap}
              className={
                inGap
                  ? "min-h-12 rounded-2xl border-2 border-dashed border-shadow px-4 text-[14px] font-semibold text-fg-faint transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                  : `min-h-12 px-4 text-[14px] font-semibold ${tileClass(checked ? "muted" : "idle")}`
              }
            >
              {word}
            </button>
          );
        })}
      </div>
    </ExerciseFrame>
  );
}
