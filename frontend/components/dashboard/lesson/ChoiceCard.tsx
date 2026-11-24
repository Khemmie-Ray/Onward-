"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { ChoiceCard as ChoiceCardData } from "@/lib/lessons/lesson-data";
import { seededOrder } from "@/lib/learn/shuffle";
import {
  ExerciseFrame,
  tileClass,
  type TileState,
} from "./exercises/ExerciseFrame";

export function ChoiceCard({
  data,
  verdict,
  onDraft,
}: {
  data: ChoiceCardData;
  verdict: boolean | null;
  onDraft: (answer: number | null) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const checked = verdict !== null;

  const order = data.optionFeedback
    ? seededOrder(data.options.length, data.question)
    : data.options.map((_, i) => i);

  const pick = (index: number) => {
    if (checked) return;
    setSelected(index);
    onDraft(index);
  };

  const stateOf = (index: number): TileState => {
    if (!checked) return selected === index ? "selected" : "idle";
    if (index === data.correctIndex) return "correct";
    if (index === selected) return "wrong";
    return "muted";
  };

  return (
    <ExerciseFrame label="Pick one" title={data.question}>
      <div className="flex flex-col gap-2.5">
        {order.map((i) => {
          const state = stateOf(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={checked}
              aria-pressed={selected === i}
              className={`flex min-h-14 items-center gap-3 px-3.5 py-2.5 text-left text-[14.5px] font-semibold leading-snug ${tileClass(state)}`}
            >
              <Marker state={state} />
              <span>{data.options[i]}</span>
            </button>
          );
        })}
      </div>
    </ExerciseFrame>
  );
}

function Marker({ state }: { state: TileState }) {
  if (state === "correct") {
    return (
      <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-forest text-paper">
        <Check size={13} strokeWidth={3.5} />
      </span>
    );
  }
  if (state === "wrong") {
    return (
      <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-terracotta text-paper">
        <X size={13} strokeWidth={3.5} />
      </span>
    );
  }
  if (state === "selected") {
    return (
      <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border-2 border-indigo">
        <span className="h-3 w-3 rounded-full bg-indigo" />
      </span>
    );
  }
  return (
    <span className="h-6.5 w-6.5 shrink-0 rounded-full border-2 border-shadow" />
  );
}
