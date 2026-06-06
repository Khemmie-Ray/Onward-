"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Coins,
  Globe,
  Sparkles,
  Users,
} from "lucide-react";
import { tintForEcosystemCategory } from "@/lib/themes/tones";
import { MudclothPattern } from "@/components/home/motifs";
import type { EcosystemApp } from "@/lib/ecosystem/type";

export function AppRow({
  app,
  isOpen,
  onToggle,
}: {
  app: EcosystemApp;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const t = tintForEcosystemCategory(app.category);
  const isComingSoon = app.status === "coming-soon";

  return (
    <div
      className={`overflow-hidden rounded-[18px] transition-all ${
        isComingSoon ? "opacity-65 bg-paper" : t.bg
      } shadow-[0_6px_20px_rgba(31,58,110,0.06)]`}
    >
      <button
        onClick={onToggle}
        className="relative w-full text-left p-5 flex items-center gap-4 cursor-pointer"
      >
        {!isComingSoon && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-indigo opacity-[0.04]"
          >
            <MudclothPattern />
          </div>
        )}
        <div className="relative flex items-center gap-4 flex-1">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-[12px] flex-shrink-0 ${
              isComingSoon
                ? "bg-canvas-warm text-fg-dim"
                : `${t.iconBg} ${t.iconColor}`
            }`}
          >
            <Globe size={20} strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="display text-[16px] font-semibold text-indigo truncate">
                {app.name}
              </h3>
              {app.isNew && (
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] bg-terracotta text-paper px-2 py-0.5 rounded-full flex-shrink-0">
                  New
                </span>
              )}
              {isComingSoon && (
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] bg-canvas-warm text-fg-dim px-2 py-0.5 rounded-full flex-shrink-0">
                  Coming soon
                </span>
              )}
            </div>
            <p className="text-[12px] text-fg-soft truncate">{app.tagline}</p>
          </div>
          <ChevronDown
            size={18}
            strokeWidth={2.5}
            className={`text-indigo flex-shrink-0 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      {isOpen && (
        <div className="relative px-5 pb-5 animate-[fade-up_0.4s_ease_both]">
          <div className="h-px bg-indigo/10 mb-5" />

          <p className="text-[13.5px] leading-[1.6] text-fg-soft mb-5 max-w-[640px]">
            {app.description}
          </p>
          <div className="grid md:grid-cols-3 gap-3 mb-5">
            <div className="relative overflow-hidden rounded-[14px] bg-paper p-4 shadow-[0_4px_12px_rgba(31,58,110,0.06)]">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] mb-2 text-fg-soft">
                Built by
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${t.iconBg}`}
                >
                  <Users size={14} strokeWidth={2.5} className={t.iconColor} />
                </div>
                <span className="text-[12px] font-semibold text-indigo">
                  {app.builder}
                </span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] mb-1 text-fg-soft">
                Category
              </div>
              <span className={`text-[12px] font-semibold ${t.accent}`}>
                {app.category}
              </span>
            </div>
            <div className="relative overflow-hidden rounded-[14px] bg-paper p-4 shadow-[0_4px_12px_rgba(31,58,110,0.06)]">
              <div
                className={`text-[9px] font-bold uppercase tracking-[0.12em] mb-2 ${t.accent}`}
              >
                You'll try
              </div>
              <ul className="text-[11.5px] leading-[1.5] text-fg-soft space-y-1.5">
                {app.highlights.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span
                      className={`mt-1.5 h-1 w-1 flex-shrink-0 rounded-full ${t.accentBg}`}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-[14px] bg-paper p-4 shadow-[0_4px_12px_rgba(31,58,110,0.06)]">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] mb-2 text-fg-soft">
                Tutorial
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="display text-[28px] font-bold leading-none text-indigo tabular-nums">
                  {app.tutorialMinutes}
                </span>
                <span className="text-[11px] text-fg-soft">minutes</span>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[12px] font-semibold text-indigo">
                <Coins
                  size={13}
                  strokeWidth={2.5}
                  className="text-terracotta"
                />
                +{app.reward} g$ on completion
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-fg-soft">
              {isComingSoon
                ? "Launching soon — turn on notifications"
                : "Complete the tutorial to earn the badge and the g$"}
            </div>
            {isComingSoon ? (
              <button className="inline-flex items-center gap-2 rounded-full bg-canvas-warm px-5 py-2.5 text-[13px] font-bold text-fg-soft cursor-not-allowed">
                Notify me <Sparkles size={13} strokeWidth={2.8} />
              </button>
            ) : (
              <Link
                href={`/ecosystem`}
                className={`group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 ${t.iconBg} ${t.iconColor} shadow-[0_4px_14px_rgba(0,0,0,0.10)]`}
              >
                Start tutorial
                <ArrowRight
                  size={13}
                  strokeWidth={2.8}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
