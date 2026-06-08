import { Coins, Globe } from "lucide-react";
import { tintForEcosystemCategory } from "@/lib/themes/tones";
import { MudclothPattern } from "@/components/home/motifs";
import type { EcosystemApp } from "@/lib/ecosystem/type";

export function FeaturedAppCard({ app }: { app: EcosystemApp }) {
  const t = tintForEcosystemCategory(app.category);

  return (
    <div
      className={`relative block overflow-hidden rounded-[20px] p-6 ${t.bg} shadow-[0_8px_24px_rgba(31,58,110,0.10)]`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-indigo opacity-[0.05]"
      >
        <MudclothPattern />
      </div>
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${t.iconBg}`}
          >
            <Globe size={22} strokeWidth={2.2} className={t.iconColor} />
          </div>
          <span
            className={`text-[9px] font-bold uppercase tracking-[0.12em] ${t.accent}`}
          >
            {app.category}
          </span>
        </div>
        <h3 className="display text-[22px] font-semibold tracking-[-0.015em] text-indigo mb-1">
          {app.name}
        </h3>
        <p className="text-[13px] font-medium text-fg-soft mb-3">
          {app.tagline}
        </p>
        <p className="text-[12.5px] leading-[1.55] text-fg-soft mb-4">
          {app.description}
        </p>
        <div className="flex items-center gap-2 text-[11px] font-medium text-indigo/75">
          <span>{app.tutorialMinutes} min tutorial</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Coins size={11} strokeWidth={2.5} className="text-terracotta" />
            +{app.reward} g$
          </span>
        </div>
      </div>
    </div>
  );
}