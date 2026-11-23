"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { MatchPairsCard as MatchPairsCardData } from "@/lib/lessons/lesson-data";
import { seededOrder } from "@/lib/learn/shuffle";
import { ExerciseFrame, tileClass } from "./ExerciseFrame";

const PAIR_COLOURS = [
  "border-mustard bg-mustard-tint",
  "border-indigo-soft bg-[#CDC4FB]",
  "border-forest bg-forest-tint",
  "border-aubergine bg-aubergine-tint",
  "border-terracotta-soft bg-terracotta-tint",
];

const BASE =
  "flex min-h-16 items-center justify-between gap-2 rounded-2xl border-2 border-b-4 px-3 py-2 text-left text-indigo transition active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 disabled:cursor-default";

export function MatchPairsCard({
  data,
  verdict,
  onDraft,
}: {
  data: MatchPairsCardData;
  verdict: boolean | null;
  onDraft: (answer: number[] | null) => void;
}) {
  const count = data.pairs.length;
  const rightOrder = seededOrder(count, data.prompt);
  const [matchOf, setMatchOf] = useState<(number | null)[]>(() =>
    Array(count).fill(null),
  );
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const checked = verdict !== null;
  const matched = matchOf.filter((r) => r !== null).length;

  const update = (next: (number | null)[]) => {
    setMatchOf(next);
    onDraft(next.every((r) => r !== null) ? (next as number[]) : null);
  };

  const leftOfRight = (right: number) => matchOf.findIndex((r) => r === right);

  const tapLeft = (left: number) => {
    if (checked) return;
    if (matchOf[left] !== null) {
      update(matchOf.map((r, i) => (i === left ? null : r)));
      setActiveLeft(left);
      return;
    }
    setActiveLeft(left === activeLeft ? null : left);
  };

  const tapRight = (right: number) => {
    if (checked) return;
    const pairedLeft = leftOfRight(right);
    if (pairedLeft !== -1) {
      update(matchOf.map((r, i) => (i === pairedLeft ? null : r)));
      return;
    }
    if (activeLeft === null) return;
    update(matchOf.map((r, i) => (i === activeLeft ? right : r)));
    setActiveLeft(null);
  };

  const look = (
    pairIndex: number,
    active: boolean,
    isRight: boolean | null,
  ) => {
    if (isRight === true) return "border-forest bg-forest text-paper";
    if (isRight === false) return "border-terracotta bg-terracotta text-paper";
    if (pairIndex !== -1) return PAIR_COLOURS[pairIndex % PAIR_COLOURS.length];
    if (active) return "border-indigo bg-paper";
    return null;
  };

  return (
    <ExerciseFrame label="Match the pairs" title={data.prompt}>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-2.5">
          {data.pairs.map((pair, left) => {
            const isRight = checked ? matchOf[left] === left : null;
            const custom = look(
              matchOf[left] !== null ? left : -1,
              activeLeft === left,
              isRight,
            );
            return (
              <button
                key={`l-${pair.left}`}
                type="button"
                onClick={() => tapLeft(left)}
                disabled={checked}
                aria-pressed={activeLeft === left}
                className={`text-[14px] font-bold leading-snug ${custom ? `${BASE} ${custom}` : `${BASE} ${tileClass("idle")}`}`}
              >
                <span>{pair.left}</span>
                <Verdict isRight={isRight} />
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5">
          {rightOrder.map((right) => {
            const pairedLeft = leftOfRight(right);
            const isRight =
              checked && pairedLeft !== -1 ? pairedLeft === right : null;
            const custom = look(pairedLeft, false, isRight);
            return (
              <button
                key={`r-${data.pairs[right].right}`}
                type="button"
                onClick={() => tapRight(right)}
                disabled={checked}
                className={`text-[13px] font-medium leading-snug ${custom ? `${BASE} ${custom}` : `${BASE} ${tileClass("idle")}`}`}
              >
                <span>{data.pairs[right].right}</span>
                <Verdict isRight={isRight} />
              </button>
            );
          })}
        </div>
      </div>

      {!checked && (
        <p className="mt-4 text-center text-[13px] text-fg-dim">
          {matched} of {count} matched. Tap a match to undo it.
        </p>
      )}
    </ExerciseFrame>
  );
}

function Verdict({ isRight }: { isRight: boolean | null }) {
  if (isRight === true)
    return <Check size={14} strokeWidth={3} className="shrink-0" />;
  if (isRight === false)
    return <X size={14} strokeWidth={3} className="shrink-0" />;
  return null;
}
