"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import type { SortBucketsCard as SortBucketsCardData } from "@/lib/lessons/lesson-data";
import { seededOrder } from "@/lib/learn/shuffle";
import { ExerciseFrame, tileClass } from "./ExerciseFrame";

const BUCKET_TONES = [
  { box: "bg-forest-tint", drop: "border-forest text-forest" },
  { box: "bg-[#CDC4FB]", drop: "border-indigo-soft text-indigo" },
  { box: "bg-mustard-tint", drop: "border-mustard text-indigo" },
];

export function SortBucketsCard({
  data,
  verdict,
  onDraft,
}: {
  data: SortBucketsCardData;
  verdict: boolean | null;
  onDraft: (answer: string[] | null) => void;
}) {
  const order = seededOrder(data.cards.length, data.prompt);
  const [placed, setPlaced] = useState<(string | null)[]>(() =>
    Array(data.cards.length).fill(null),
  );
  const [active, setActive] = useState<number | null>(null);
  const checked = verdict !== null;
  const pile = order.filter((i) => placed[i] === null);

  const update = (next: (string | null)[]) => {
    setPlaced(next);
    onDraft(next.every((b) => b !== null) ? (next as string[]) : null);
  };

  const drop = (bucket: string) => {
    if (checked || active === null) return;
    update(placed.map((b, i) => (i === active ? bucket : b)));
    setActive(null);
  };

  const takeBack = (card: number) => {
    if (checked) return;
    update(placed.map((b, i) => (i === card ? null : b)));
  };

  const canDrop = active !== null && !checked;

  return (
    <ExerciseFrame label="Sort them" title={data.prompt}>
      <div
        className={`grid gap-2.5 ${data.buckets.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}
      >
        {data.buckets.map((bucket, b) => {
          const tone = BUCKET_TONES[b % BUCKET_TONES.length];
          const inside = order.filter((i) => placed[i] === bucket.id);
          return (
            <div
              key={bucket.id}
              className={`flex min-h-44 flex-col gap-2 rounded-[20px] p-2.5 ${tone.box}`}
            >
              <button
                type="button"
                onClick={() => drop(bucket.id)}
                disabled={!canDrop}
                className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] px-2 text-center text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo ${
                  canDrop
                    ? `border-2 border-dashed bg-paper/70 hover:bg-paper ${tone.drop}`
                    : "text-indigo"
                }`}
              >
                {canDrop && <Plus size={14} strokeWidth={3} />}
                {bucket.label}
              </button>
              {inside.map((i) => {
                const isRight = checked
                  ? data.cards[i].bucket === bucket.id
                  : null;
                return (
                  <button
                    key={data.cards[i].text}
                    type="button"
                    onClick={() => takeBack(i)}
                    disabled={checked}
                    aria-label={
                      checked
                        ? undefined
                        : `Take ${data.cards[i].text} out of ${bucket.label}`
                    }
                    className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo ${
                      isRight === true
                        ? "bg-forest text-paper"
                        : isRight === false
                          ? "bg-terracotta text-paper"
                          : "bg-paper text-indigo hover:bg-cream"
                    }`}
                  >
                    {data.cards[i].text}
                    {isRight === true && (
                      <Check size={13} strokeWidth={3} className="shrink-0" />
                    )}
                    {isRight === false && (
                      <X size={13} strokeWidth={3} className="shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {!checked && pile.length > 0 && (
        <div className="mt-5 flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-dim">
            Left to sort
          </span>
          <div className="flex flex-wrap gap-2">
            {pile.map((i) => (
              <button
                key={data.cards[i].text}
                type="button"
                onClick={() => setActive(active === i ? null : i)}
                aria-pressed={active === i}
                className={`min-h-11 px-3.5 text-[13.5px] font-semibold ${
                  active === i
                    ? "rounded-2xl border-2 border-b-4 border-indigo bg-indigo text-paper transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2"
                    : tileClass("idle")
                }`}
              >
                {data.cards[i].text}
              </button>
            ))}
          </div>
          <span className="text-[13px] text-fg-dim">
            {active === null
              ? "Tap a card to pick it up."
              : "Now tap the box it belongs in."}
          </span>
        </div>
      )}
    </ExerciseFrame>
  );
}
