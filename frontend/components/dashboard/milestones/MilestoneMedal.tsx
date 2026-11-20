import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MedalPalette } from "./milestoneDisplay";

export type MedalState = "earned" | "ready" | "next" | "locked";

const PALETTE: Record<
  MedalPalette,
  { scallop: string; inner: string; icon: string }
> = {
  aubergine: {
    scallop: "fill-aubergine",
    inner: "fill-aubergine-tint",
    icon: "text-aubergine",
  },
  terracotta: {
    scallop: "fill-terracotta",
    inner: "fill-terracotta-tint",
    icon: "text-terracotta",
  },
  forest: {
    scallop: "fill-forest",
    inner: "fill-forest-tint",
    icon: "text-forest",
  },
  mustard: {
    scallop: "fill-mustard",
    inner: "fill-mustard-tint",
    icon: "text-indigo",
  },
  indigo: {
    scallop: "fill-indigo",
    inner: "fill-cream",
    icon: "text-indigo",
  },
};

const LOCKED = {
  scallop: "fill-[#CBC5BA]",
  inner: "fill-[#E7E2D7]",
  icon: "text-[#A9A294]",
};

/** Scalloped badge. Locked badges are grey; everything else wears its colour. */
export function MilestoneMedal({
  icon: Icon,
  palette,
  state,
  roman,
}: {
  icon: LucideIcon;
  palette: MedalPalette;
  state: MedalState;
  roman?: string;
}) {
  const colours = state === "locked" ? LOCKED : PALETTE[palette];
  const showLock = state === "next" || state === "locked";

  return (
    <div className="relative h-[84px] w-[84px]">
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
        <path d={SCALLOP} className={colours.scallop} />
        <circle cx="50" cy="50" r="29" className="fill-paper" />
        <circle
          cx="50"
          cy="50"
          r="29"
          className={colours.inner}
          fillOpacity={0.55}
        />
      </svg>

      <span className="absolute inset-0 flex items-center justify-center">
        <Icon size={28} strokeWidth={2} className={colours.icon} />
      </span>

      {roman && (
        <span className="absolute bottom-0 left-1/2 flex h-5 min-w-5 -translate-x-1/2 translate-y-1/4 items-center justify-center rounded-full bg-indigo px-1.5 text-[9px] font-bold text-cream">
          {roman}
        </span>
      )}

      {showLock && (
        <span className="absolute bottom-1 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo text-cream ring-2 ring-paper">
          <Lock size={11} strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
}

function scallop(cx: number, cy: number, r: number, n: number): string {
  const step = (Math.PI * 2) / n;
  const arc = r * Math.tan(step / 2);
  let d = `M${(cx + r).toFixed(2)},${cy.toFixed(2)} `;
  for (let i = 0; i < n; i++) {
    const a = (i + 1) * step;
    const x = (cx + Math.cos(a) * r).toFixed(2);
    const y = (cy + Math.sin(a) * r).toFixed(2);
    d += `A${arc.toFixed(2)},${arc.toFixed(2)} 0 0 1 ${x},${y} `;
  }
  return `${d}Z`;
}

const SCALLOP = scallop(50, 50, 38, 12);
