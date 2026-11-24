// frontend/components/dashboard/milestones/MilestoneTile.tsx
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MilestoneMedal, type MedalState } from "./MilestoneMedal";
import type { MedalPalette } from "./milestoneDisplay";

const EARNED_BG: Record<MedalPalette, string> = {
  aubergine: "bg-aubergine-tint",
  terracotta: "bg-terracotta-tint",
  forest: "bg-forest-tint",
  mustard: "bg-mustard-tint",
  indigo: "bg-indigo/10",
};

const DOTS =
  "[background-image:radial-gradient(rgba(31,58,110,0.06)_1px,transparent_1px)] [background-size:11px_11px]";

export function MilestoneTile({
  title,
  requirement,
  icon,
  palette,
  state,
  roman,
  reward,
  earnedOn,
  progress,
  action,
}: {
  title: string;
  requirement: string;
  icon: LucideIcon;
  palette: MedalPalette;
  state: MedalState;
  roman?: string;
  reward?: string;
  earnedOn?: string;
  progress?: { value: number; target: number };
  action?: ReactNode;
}) {
  const card =
    state === "earned" || state === "ready"
      ? `${EARNED_BG[palette]} shadow-[0_6px_20px_rgba(31,58,110,0.06)]`
      : state === "next"
        ? "border-2 border-indigo bg-paper shadow-[0_6px_20px_rgba(31,58,110,0.08)]"
        : "border-2 border-dashed border-indigo/15 bg-paper/40";

  const pct =
    progress && progress.target > 0
      ? Math.min(100, Math.round((progress.value / progress.target) * 100))
      : 0;

  return (
    <div
      className={`flex flex-col rounded-[20px] px-3 py-4 text-center ${DOTS} ${card}`}
    >
      <div className="self-start">
        <StatePill state={state} />
      </div>

      <div className="mt-2 flex justify-center">
        <MilestoneMedal
          icon={icon}
          palette={palette}
          state={state}
          roman={roman}
        />
      </div>

      <div className="display mt-3 text-[15px] font-bold text-indigo">
        {title}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-fg-soft">
        {requirement}
      </div>

      {reward && (
        <div
          className={`mx-auto mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            state === "earned"
              ? "bg-forest/15 text-forest"
              : "bg-mustard/25 text-indigo"
          }`}
        >
          {reward}
        </div>
      )}

      {state === "earned" && earnedOn && (
        <div className="mt-1.5 text-[10.5px] font-semibold text-fg-soft">
          Earned {earnedOn}
        </div>
      )}

      {state === "next" && progress && (
        <div className="mt-3 w-full px-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas-warm">
            <div
              className="h-full rounded-full bg-mustard"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 text-[11px] font-bold tabular-nums text-indigo">
            {Math.min(progress.value, progress.target)} / {progress.target}
          </div>
        </div>
      )}

      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

function StatePill({ state }: { state: MedalState }) {
  if (state === "earned") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-forest/15 px-2 py-0.5 text-[9.5px] font-bold text-forest">
        <Check size={10} strokeWidth={3} />
        Earned
      </span>
    );
  }
  if (state === "ready") {
    return (
      <span className="rounded-full bg-terracotta px-2 py-0.5 text-[9.5px] font-bold text-cream">
        Ready to claim
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
