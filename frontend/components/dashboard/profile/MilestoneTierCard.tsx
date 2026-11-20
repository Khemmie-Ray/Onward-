import { Check } from "lucide-react";
import type {
  MilestoneIcon,
  MilestoneTone,
  ResolvedTier,
} from "@/lib/milestones";
import { MilestoneBadge } from "./MilestoneBadge";

const EARNED_BG: Record<MilestoneTone, string> = {
  terracotta: "bg-terracotta-tint",
  forest: "bg-forest-tint",
  aubergine: "bg-aubergine-tint",
};

const DOTS =
  "[background-image:radial-gradient(rgba(31,58,110,0.06)_1px,transparent_1px)] [background-size:11px_11px]";

export function MilestoneTierCard({
  tier,
  tone,
  icon,
}: {
  tier: ResolvedTier;
  tone: MilestoneTone;
  icon: MilestoneIcon;
}) {
  const { state } = tier;

  const cardCls =
    state === "earned"
      ? `${EARNED_BG[tone]} shadow-[0_6px_20px_rgba(31,58,110,0.06)]`
      : state === "next"
        ? "bg-paper border-2 border-indigo shadow-[0_6px_20px_rgba(31,58,110,0.08)]"
        : "border-2 border-dashed border-indigo/15 bg-paper/40";

  return (
    <div
      className={`relative flex flex-col items-center rounded-[20px] px-3 py-5 text-center ${DOTS} ${cardCls}`}
    >
      <div className="absolute left-3 top-3">
        <StatePill state={state} />
      </div>

      <div className="mt-6">
        <MilestoneBadge
          icon={icon}
          tone={tone}
          state={state}
          roman={tier.roman}
        />
      </div>

      <div className="display mt-3 text-[15px] font-bold text-indigo">
        {tier.name}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-fg-soft">
        {tier.requirement}
      </div>

      {state === "next" && (
        <div className="mt-3 w-full px-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas-warm">
            <div
              className="h-full rounded-full bg-mustard"
              style={{ width: `${Math.round(tier.progress * 100)}%` }}
            />
          </div>
          <div className="mt-1.5 text-[11px] font-bold tabular-nums text-indigo">
            {tier.value} / {tier.threshold}
          </div>
        </div>
      )}
    </div>
  );
}

function StatePill({ state }: { state: ResolvedTier["state"] }) {
  if (state === "earned") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-forest/15 px-2 py-0.5 text-[9.5px] font-bold text-forest">
        <Check size={10} strokeWidth={3} />
        Earned
      </span>
    );
  }
  if (state === "next") {
    return (
      <span className="rounded-full bg-mustard/30 px-2 py-0.5 text-[9.5px] font-bold text-indigo">
        Next up
      </span>
    );
  }
  return (
    <span className="rounded-full bg-canvas-warm px-2 py-0.5 text-[9.5px] font-bold text-fg-soft">
      Locked
    </span>
  );
}
