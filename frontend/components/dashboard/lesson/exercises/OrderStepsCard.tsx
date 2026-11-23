"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { OrderStepsCard as OrderStepsCardData } from "@/lib/lessons/lesson-data";
import { seededOrder } from "@/lib/learn/shuffle";
import { ExerciseFrame, tileClass } from "./ExerciseFrame";

export function OrderStepsCard({
  data,
  verdict,
  onDraft,
}: {
  data: OrderStepsCardData;
  verdict: boolean | null;
  onDraft: (answer: number[] | null) => void;
}) {
  const shuffled = seededOrder(data.steps.length, data.prompt);
  const [placed, setPlaced] = useState<number[]>([]);
  const checked = verdict !== null;
  const remaining = shuffled.filter((i) => !placed.includes(i));

  const update = (next: number[]) => {
    setPlaced(next);
    onDraft(next.length === data.steps.length ? next : null);
  };

  return (
    <ExerciseFrame label="Put in order" title={data.prompt}>
      <ol className="flex flex-col gap-2">
        {data.steps.map((_, slot) => {
          const step = placed[slot];
          const filled = step !== undefined;
          const isRight = checked && filled ? step === slot : null;
          return (
            <li key={slot} className="flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                  filled ? "bg-indigo text-paper" : "bg-canvas-warm text-fg-dim"
                }`}
              >
                {slot + 1}
              </span>
              {filled ? (
                <button
                  type="button"
                  onClick={() => update(placed.filter((s) => s !== step))}
                  disabled={checked}
                  className={`flex min-h-12.5 flex-1 items-center justify-between gap-2 rounded-2xl border-2 border-b-4 px-3 py-2 text-left text-[13.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo disabled:cursor-default ${
                    isRight === true
                      ? "border-forest bg-forest text-paper"
                      : isRight === false
                        ? "border-terracotta bg-terracotta text-paper"
                        : "border-mustard bg-mustard-tint text-indigo hover:bg-mustard-soft"
                  }`}
                >
                  <span>{data.steps[step]}</span>
                  {isRight === true && (
                    <Check size={14} strokeWidth={3} className="shrink-0" />
                  )}
                  {isRight === false && (
                    <X size={14} strokeWidth={3} className="shrink-0" />
                  )}
                </button>
              ) : (
                <span className="min-h-12.5 flex-1 rounded-2xl border-2 border-dashed border-shadow" />
              )}
            </li>
          );
        })}
      </ol>

      {!checked && remaining.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-t-2 border-canvas-warm pt-4">
          {remaining.map((i) => (
            <button
              key={data.steps[i]}
              type="button"
              onClick={() => update([...placed, i])}
              className={`min-h-12.5 px-3 py-2 text-left text-[13.5px] font-semibold ${tileClass("idle")}`}
            >
              {data.steps[i]}
            </button>
          ))}
        </div>
      )}
    </ExerciseFrame>
  );
}
