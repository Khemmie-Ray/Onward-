"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { MudclothPattern } from "@/components/home/motifs";
import type { SpotterCard as SpotterCardData } from "@/lib/lessons/lesson-data";
import SpotterButton from "./SpotterButton";

export function SpotterCard({
  data,
  onAnswer,
}: {
  data: SpotterCardData;
  onAnswer: (selectedAnswer: "scam" | "real", correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<"scam" | "real" | null>(null);

  const handleSelect = (answer: "scam" | "real") => {
    if (selected !== null) return;
    setSelected(answer);
    onAnswer(answer, answer === data.correctAnswer);
  };

  const locked = selected !== null;
  const wasCorrect = selected === data.correctAnswer;

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div className="relative rounded-[24px] bg-paper p-7 shadow-[0_20px_50px_rgba(31,58,110,0.10)] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-indigo opacity-[0.03]"
        >
          <MudclothPattern />
        </div>

        <div className="relative">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-terracotta mb-3">
            Real or scam?
          </div>
          <div className="bg-canvas-warm rounded-[16px] p-5 mb-6 border-l-4 border-terracotta">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-fg-soft mb-2">
              You see this
            </div>
            <p className="text-[15px] leading-[1.5] text-indigo italic">
              {data.scenario}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <SpotterButton
              answer="scam"
              icon={AlertTriangle}
              label="Scam"
              selected={selected}
              correct={data.correctAnswer === "scam"}
              onClick={() => handleSelect("scam")}
            />
            <SpotterButton
              answer="real"
              icon={ShieldCheck}
              label="Real"
              selected={selected}
              correct={data.correctAnswer === "real"}
              onClick={() => handleSelect("real")}
            />
          </div>

          {locked && (
            <div
              className={`mt-3 p-4 rounded-[14px] text-[13px] leading-[1.55] animate-[fade-up_0.4s_ease_both] ${
                wasCorrect
                  ? "bg-forest-tint text-forest"
                  : "bg-terracotta-tint text-terracotta"
              }`}
            >
              <div className="font-bold mb-1 text-[11px] uppercase tracking-[0.1em]">
                {wasCorrect ? "You spotted it" : "Caught you"}
              </div>
              {data.teaching}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

