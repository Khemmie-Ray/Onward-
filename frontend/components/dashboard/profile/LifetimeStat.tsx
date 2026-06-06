import React from "react";
import { TONE_MAP, type Tone } from "@/lib/themes/tones";
import { MudclothPattern } from "@/components/home/motifs";

interface LifetimeStatProps {
  label: string;
  value: string;
  tone: Tone;
  icon: React.ReactNode;
}

const LifetimeStat = ({ label, value, tone: toneName, icon }: LifetimeStatProps) => {
  const t = TONE_MAP[toneName];
  return (
    <div className={`relative overflow-hidden rounded-[16px] p-5 ${t.bg} ${t.shadow}`}>
      <div aria-hidden className={`pointer-events-none absolute inset-0 ${t.fg} opacity-[0.06]`}>
        <MudclothPattern />
      </div>
      <div aria-hidden className={`pointer-events-none absolute right-3 top-3 ${t.fg} opacity-30`}>
        {icon}
      </div>
      <div className="relative">
        <div className={`text-[10px] font-bold uppercase tracking-[0.14em] ${t.subFg} mb-2`}>
          {label}
        </div>
        <div className={`display text-[32px] font-bold leading-none tabular-nums ${t.fg}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default LifetimeStat;