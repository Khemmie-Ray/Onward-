import React from "react";
import { Flame } from "lucide-react";
import { TONE_MAP, type Tone } from "@/lib/themes/tones";
import { SunMotif, LeafMotif, MudclothPattern } from "@/components/home/motifs";

interface StatCardHeroProps {
  label: string;
  value: string;
  unit: string;
  sub: string;
  tone: Tone;
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
      className={`relative overflow-hidden rounded-[20px] p-6 ${t.bg} ${t.shadow}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${t.fg} opacity-[0.08]`}
      >
        <MudclothPattern />
      </div>
      <div
        aria-hidden
        className={`pointer-events-none absolute right-4 top-4 ${t.fg} opacity-40`}
      >
        {toneName === "mustard" && <SunMotif size={36} />}
        {toneName === "terracotta" && <Flame size={32} strokeWidth={2} />}
        {toneName === "forest" && <LeafMotif size={32} />}
      </div>
      <div className="relative">
        <div
          className={`mb-3 text-[10px] font-bold uppercase tracking-[0.14em] ${t.subFg}`}
        >
          {label}
        </div>
        <div className="mb-1.5 flex items-baseline gap-2">
          <span
            className={`display text-[52px] font-bold leading-none tabular-nums ${t.fg}`}
          >
            {value}
          </span>
          <span className={`text-[14px] font-medium ${t.subFg}`}>{unit}</span>
        </div>
        <div className={`text-[11px] font-medium ${t.subSubFg}`}>{sub}</div>
      </div>
    </div>
  );
};

export default StatCardHero;