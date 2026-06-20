"use client";

import React from "react";
import { Flame, Coins } from "lucide-react";
import { TONE_MAP, type Tone } from "@/lib/themes/tones";
import { SunMotif, LeafMotif } from "@/components/home/motifs";

interface StatCardHeroProps {
  label: string;
  value: string;
  unit: string;
  sub: string;
  tone: Tone;
}

function iconForTone(tone: Tone) {
  switch (tone) {
    case "mustard":
      return <SunMotif size={28} />;
    case "terracotta":
      return <Flame size={26} strokeWidth={2} />;
    case "forest":
      return <LeafMotif size={26} />;
    case "indigo":
      return <Coins size={26} strokeWidth={2} />;
    default:
      return null;
  }
}

const StatCardHero = ({
  label,
  value,
  unit,
  sub,
  tone: toneName,
}: StatCardHeroProps) => {
  const t = TONE_MAP[toneName];

  return (
    <div
      className={`rounded-[20px] p-5 sm:p-6 w-full md:w-[47%] ${t.bg} ${t.shadow}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.14em] ${t.subFg}`}
        >
          {label}
        </span>
        <div className={`${t.fg} opacity-50`}>{iconForTone(toneName)}</div>
      </div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span
          className={`display text-[44px] sm:text-[52px] font-bold leading-none tabular-nums ${t.fg}`}
        >
          {value}
        </span>
        <span className={`text-[14px] font-medium ${t.subFg}`}>{unit}</span>
      </div>
      <div className={`text-[11px] font-medium ${t.subSubFg}`}>{sub}</div>
    </div>
  );
};

export default StatCardHero;