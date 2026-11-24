"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Keyboard } from "lucide-react";
import type { RecapCard as RecapCardData } from "@/lib/lessons/lesson-data";
import { recapMatches } from "@/lib/lessons/recap";
import { ExerciseFrame } from "./ExerciseFrame";

type TermState = "typing" | "retype" | "right" | "learned";

export function RecapCard({
  data,
  onReady,
}: {
  data: RecapCardData;
  onReady: (ready: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<TermState>("typing");
  const [typed, setTyped] = useState("");
  const [nudge, setNudge] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const term = data.terms[index];
  const isLast = index === data.terms.length - 1;
  const settled = state === "right" || state === "learned";

  useEffect(() => {
    onReady(isLast && settled);
  }, [isLast, settled, onReady]);

  useEffect(() => {
    if (!settled) inputRef.current?.focus({ preventScroll: true });
  }, [index, state, settled]);

  if (!term) return null;

  const check = () => {
    if (!typed.trim() || settled) return;
    const match = recapMatches(term, typed);
    if (state === "typing") {
      if (match) setState("right");
      else {
        setState("retype");
        setTyped("");
      }
      return;
    }
    
    if (match) {
      setState("learned");
      setNudge(false);
    } else {
      setNudge(true);
    }
  };

  const nextWord = () => {
    setIndex((i) => i + 1);
    setState("typing");
    setTyped("");
    setNudge(false);
  };

  return (
    <ExerciseFrame label="Recap" tone="mustard" title="Type the word">
      <div className="flex items-center justify-between text-[12px] font-bold uppercase tracking-[0.12em] text-fg-soft">
        <span>
          Word {index + 1} of {data.terms.length}
        </span>
        <span className="normal-case tracking-normal">Not scored</span>
      </div>

      <div className="mt-3 rounded-3xl bg-paper p-5 md:bg-canvas md:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-aubergine">It means</p>
        <p className="display mt-2 text-[20px] font-bold leading-snug text-indigo md:text-[22px]">
          {term.meaning}
        </p>
      </div>

      {state === "retype" && (
        <div className="mt-4 rounded-2xl bg-terracotta-tint p-4">
          <p className="text-[13px] font-semibold text-terracotta">Not quite. The word is:</p>
          <p className="display mt-1 text-[22px] font-bold text-indigo">{term.word}</p>
          <p className="mt-1 text-[13px] text-indigo/80">Type it in below to keep going.</p>
        </div>
      )}

      {settled ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-forest-tint p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-paper">
            <Check size={16} strokeWidth={3.2} />
          </span>
          <div>
            <p className="display text-[18px] font-bold text-forest">
              {state === "right" ? "That's the word" : "Got it"}
            </p>
            <p className="text-[14px] font-semibold text-indigo">{term.word}</p>
          </div>
        </div>
      ) : (
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          <label className="sr-only" htmlFor="recap-answer">
            Type the word that matches this meaning
          </label>
          <div className="relative flex-1">
            <Keyboard
              size={18}
              strokeWidth={2.2}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-dim"
            />
            <input
              id="recap-answer"
              ref={inputRef}
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setNudge(false);
              }}
              placeholder={state === "retype" ? "Type the word shown above" : "Type the word"}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              className={`min-h-13 w-full rounded-2xl border-2 bg-paper pl-11 pr-4 text-[17px] font-semibold text-indigo outline-none transition placeholder:font-medium placeholder:text-fg-dim focus:border-indigo md:bg-canvas ${
                nudge ? "border-terracotta" : "border-shadow"
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={!typed.trim()}
            className="min-h-13 rounded-full bg-indigo px-7 text-[15px] font-bold text-paper shadow-[0_4px_0_#0E0920] transition hover:bg-indigo/90 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-shadow disabled:text-fg-dim disabled:shadow-none"
          >
            Check
          </button>
        </form>
      )}

      {nudge && (
        <p className="mt-2 text-[13px] font-semibold text-terracotta">
          Check the spelling against the word above.
        </p>
      )}

      {settled && !isLast && (
        <button
          type="button"
          onClick={nextWord}
          className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-indigo px-6 text-[14px] font-bold text-paper transition hover:bg-indigo/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2"
        >
          Next word
          <ArrowRight size={15} strokeWidth={2.8} />
        </button>
      )}
    </ExerciseFrame>
  );
}