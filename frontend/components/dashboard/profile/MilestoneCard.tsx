import { Flame, GraduationCap, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  MilestoneIcon,
  MilestoneTone,
  ResolvedMilestone,
} from "@/lib/milestones";

const ICONS: Record<MilestoneIcon, LucideIcon> = {
  flame: Flame,
  modules: GraduationCap,
  referrals: Users,
};

const TILE: Record<MilestoneTone, { bg: string; icon: string }> = {
  terracotta: { bg: "bg-terracotta-tint", icon: "text-terracotta" },
  forest: { bg: "bg-forest-tint", icon: "text-forest" },
  aubergine: { bg: "bg-aubergine-tint", icon: "text-aubergine" },
};

export function MilestoneCard({ m }: { m: ResolvedMilestone }) {
  const Icon = ICONS[m.track.icon];
  const tile = TILE[m.track.tone];

  return (
    <div className="flex items-center gap-4 rounded-[20px] bg-paper px-4 py-4 shadow-[0_6px_24px_rgba(31,58,110,0.06)] sm:px-5">
      <div className="relative shrink-0">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-[18px] ${tile.bg}`}
        >
          <Icon size={26} strokeWidth={2} className={tile.icon} />
        </div>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-indigo px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-cream">
          {m.done ? "Maxed" : `Level ${m.tierLevel}`}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-soft">
              {m.track.category}
            </div>
            <div className="display truncate font-bold text-indigo">
              {m.tierName}
            </div>
          </div>
          <div className="shrink-0 text-[13px] font-bold tabular-nums text-indigo">
            {m.value}/{m.threshold}
          </div>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas-warm">
          <div
            className="h-full rounded-full bg-mustard transition-[width] duration-500"
            style={{ width: `${Math.round(m.progress * 100)}%` }}
          />
        </div>

        <p className="mt-2 text-[12px] text-fg-soft">{m.description}</p>
      </div>
    </div>
  );
}
