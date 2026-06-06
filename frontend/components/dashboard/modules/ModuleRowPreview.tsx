import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { tintForCategory } from "@/lib/themes/tones";
import { MiniPreviewCard } from "./MiniPreviewCard";
import type { ModulePreview } from "@/lib/modules/types";

export function ModuleRowPreview({ module }: { module: ModulePreview }) {
  const t = tintForCategory(module.category);
  const isActive = module.status === "active";
  const isComplete = module.status === "complete";

  return (
    <div className="relative px-5 pb-5 animate-[fade-up_0.4s_ease_both]">
      <div className="h-px bg-indigo/10 mb-5" />

      <p className="text-[13.5px] leading-[1.6] text-fg-soft mb-5 max-w-[640px]">
        {module.description}
      </p>

      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <MiniPreviewCard eyebrow="Card 1 · Flip" accentClass={t.accent}>
          <div className="text-[14px] font-semibold leading-[1.3] text-indigo">
            {module.firstCardTease}
          </div>
        </MiniPreviewCard>

        <MiniPreviewCard eyebrow="You'll learn" accentClass={t.accent}>
          <ul className="text-[11.5px] leading-[1.5] text-fg-soft space-y-1">
            {module.whatYouWillLearn.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span
                  className={`mt-1.5 h-1 w-1 flex-shrink-0 rounded-full ${t.accentBg}`}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </MiniPreviewCard>

        <MiniPreviewCard eyebrow="Ends with · Spotter" accentClass={t.accent}>
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} strokeWidth={2.5} className={t.accent} />
            <span className="text-[11px] font-semibold text-indigo">
              Apply what you learned
            </span>
          </div>
          <p className="text-[11px] leading-[1.5] text-fg-soft">
            Judge a real-looking message. Real or scam? Earn the badge by
            getting it right.
          </p>
        </MiniPreviewCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-fg-soft">
          Five cards · {module.minutes} minutes · Mint a soulbound badge on
          completion
        </div>
        <Link
          href={`/modules/${module.slug}`}
          className={`group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform hover:-translate-y-0.5 ${t.iconBg} ${t.iconColor} shadow-[0_4px_14px_rgba(0,0,0,0.10)]`}
        >
          {isActive
            ? "Resume lesson"
            : isComplete
            ? "Replay lesson"
            : "Start lesson"}
          <ArrowRight
            size={13}
            strokeWidth={2.8}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </div>
  );
}