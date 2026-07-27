"use client";

import { BookOpen, Check, Coins } from "lucide-react";
import type { ModulePreview } from "@/lib/modules/types";
import { TrackModuleListItem } from "./TrackModuleListItem";

export function TrackModulesPanel({
  trackTitle,
  modules,
  selectedSlug,
  onSelect,
}: {
  trackTitle: string;
  modules: ModulePreview[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  const completed = modules.filter((m) => m.status === "complete").length;
  const total = modules.length;

  const pointsFromTrack = modules.reduce((sum, m) => sum + (m.reward ?? 0), 0);
  const pointsEarned = modules
    .filter((m) => m.status === "complete")
    .reduce((sum, m) => sum + (m.reward ?? 0), 0);

  return (
    <div className="flex flex-col h-full min-h-0 animate-[fade-up_0.8s_0.05s_ease_both]">
      <div className="shrink-0">
        <div className="flex gap-2">
          <StatCard
            label="Progress"
            value={`${completed}/${total}`}
            icon={<BookOpen size={13} strokeWidth={2.5} />}
            iconClass="bg-forest text-paper"
          />
          <StatCard
            label="Points earned"
            value={pointsEarned.toLocaleString()}
            icon={<Coins size={13} strokeWidth={2.5} />}
            iconClass="bg-mustard text-indigo"
          />
          <StatCard
            label="Points available"
            value={pointsFromTrack.toLocaleString()}
            icon={<Check size={13} strokeWidth={2.5} />}
            iconClass="bg-terracotta text-paper"
          />
        </div>
      </div>
      <div>
        <h2 className="text-[24px] font-semibold leading-[1.1] tracking-tight text-indigo mt-8 mb-1">
          Modules
        </h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1 mb-6">
        {modules.map((m, i) => (
          <TrackModuleListItem
            key={m.slug}
            module={m}
            index={i + 1}
            selected={m.slug === selectedSlug}
            onSelect={() => onSelect(m.slug)}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="flex-1 rounded-[12px] bg-paper p-3 shadow-[0_2px_8px_rgba(31,58,110,0.05)]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-[6px] ${iconClass}`}
        >
          {icon}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft">
          {label}
        </span>
      </div>
      <div className="display text-[18px] font-bold text-indigo tabular-nums leading-none">
        {value}
      </div>
    </div>
  );
}
