"use client";

import Image from "next/image";
import { Loader2, Hammer, ShieldCheck, Clock } from "lucide-react";
import type { WhackIcon } from "@/lib/scam/whackIcon";

type ExemplarShape = {
  kind: string;
  content: Record<string, unknown>;
  teaching: string;
};

type Props = {
  familyLabel: string;
  familyDescription: string;
  exemplar: ExemplarShape;
  scamIcon: WhackIcon;
  onReady: () => void;
  isStarting?: boolean;
};

export function PreRoundBriefing({
  familyLabel,
  familyDescription,
  scamIcon,
  onReady,
  isStarting = false,
}: Props) {
  return (
    <div className="w-full max-w-110 mx-auto">
      <div className="flex flex-col items-center mb-5">
        <div className="relative mb-3">
          <div className="absolute inset-0 rounded-2xl bg-mustard/30 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-2xl bg-aubergine/95 flex items-center justify-center shadow-[0_8px_24px_rgba(91,46,92,0.28)] animate-[fade-up_0.5s_ease_both]">
            <Image
              src={scamIcon.src}
              alt={scamIcon.label}
              width={64}
              height={64}
              priority
            />
          </div>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-terracotta mb-1">
          Today&apos;s scam to catch
        </div>
        <h2 className="display text-[24px] font-bold text-indigo leading-tight text-center">
          {familyLabel}
        </h2>
      </div>
      <p className="text-center text-[13px] text-fg-soft leading-relaxed mb-5">
        {familyDescription}
      </p>
      <div className="rounded-2xl bg-paper p-4 mb-6 shadow-[0_2px_10px_rgba(31,58,110,0.05)] space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-soft mb-1">
          How to play
        </div>
        <Rule
          icon={<Hammer size={15} strokeWidth={2.5} />}
          tint="terracotta"
          text={
            <>
              Cards pop up fast.{" "}
              <b className="text-indigo">
                Whack the {familyLabel.toLowerCase()} ones
              </b>{" "}
              before they vanish.
            </>
          }
        />
        <Rule
          icon={<ShieldCheck size={15} strokeWidth={2.5} />}
          tint="forest"
          text={
            <>
              Leave the <b className="text-indigo">safe cards</b> alone.
              Whacking a safe one costs you.
            </>
          }
        />
        <Rule
          icon={<Clock size={15} strokeWidth={2.5} />}
          tint="mustard"
          text={
            <>Beat the timer. The sharper your eye, the higher your score.</>
          }
        />
      </div>
      <button
        onClick={onReady}
        disabled={isStarting}
        className={`group relative w-full lg:w-[70%] mx-auto flex items-center justify-center gap-2
          rounded-2xl px-8 py-4 text-cream font-bold text-[17px]
          bg-linear-to-b from-indigo to-[#152845]
          shadow-[0_5px_0_0_#0f1d33,0_8px_16px_rgba(31,58,110,0.35)]
          transition-all
          hover:brightness-110
          active:translate-y-0.75 active:shadow-[0_2px_0_0_#0f1d33,0_3px_8px_rgba(31,58,110,0.3)]
          disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0`}
      >
        {isStarting ? (
          <>
            <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
            Starting…
          </>
        ) : (
          <>
            <Hammer
              size={18}
              strokeWidth={2.5}
              className="transition-transform group-hover:-rotate-12"
            />
            Let&apos;s Play
          </>
        )}
      </button>
    </div>
  );
}

function Rule({
  icon,
  text,
  tint,
}: {
  icon: React.ReactNode;
  text: React.ReactNode;
  tint: "terracotta" | "forest" | "mustard";
}) {
  const tintBg = {
    terracotta: "bg-terracotta/15 text-terracotta",
    forest: "bg-forest/15 text-forest",
    mustard: "bg-mustard/20 text-mustard",
  }[tint];
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tintBg}`}
      >
        {icon}
      </div>
      <p className="text-[12.5px] text-fg-soft leading-snug pt-1">{text}</p>
    </div>
  );
}
