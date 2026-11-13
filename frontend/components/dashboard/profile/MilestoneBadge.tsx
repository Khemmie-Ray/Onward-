import { Flame, GraduationCap, Lock, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MilestoneIcon, MilestoneTone, TierState } from "@/lib/milestones";

const ICONS: Record<MilestoneIcon, LucideIcon> = {
  flame: Flame,
  modules: GraduationCap,
  referrals: Users,
};

const FILL: Record<
  MilestoneTone,
  { scallop: string; inner: string; icon: string }
> = {
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
  aubergine: {
    scallop: "fill-aubergine",
    inner: "fill-aubergine-tint",
    icon: "text-aubergine",
  },
};

const LOCKED = {
  scallop: "fill-[#CBC5BA]",
  inner: "fill-[#E7E2D7]",
  icon: "text-[#A9A294]",
};

function scallop(cx: number, cy: number, R: number, n: number): string {
  const step = (Math.PI * 2) / n;
  const rad = R * Math.tan(step / 2);
  let d = "";
  for (let i = 0; i < n; i++) {
    const a1 = (i + 1) * step;
    const x1 = (cx + Math.cos(a1) * R).toFixed(2);
    const y1 = (cy + Math.sin(a1) * R).toFixed(2);
    if (i === 0) {
      const x0 = (cx + Math.cos(0) * R).toFixed(2);
      const y0 = (cy + Math.sin(0) * R).toFixed(2);
      d += `M${x0},${y0} `;
    }
    d += `A${rad.toFixed(2)},${rad.toFixed(2)} 0 0 1 ${x1},${y1} `;
  }
  return `${d}Z`;
}

const SCALLOP = scallop(50, 50, 38, 12);

export function MilestoneBadge({
  icon,
  tone,
  state,
  roman,
  size = 92,
}: {
  icon: MilestoneIcon;
  tone: MilestoneTone;
  state: TierState;
  roman: string;
  size?: number;
}) {
  const Icon = ICONS[icon];
  const f = state === "locked" ? LOCKED : FILL[tone];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
        <path d={SCALLOP} className={f.scallop} />
        <circle cx="50" cy="50" r="29" className="fill-paper" />
        <circle cx="50" cy="50" r="29" className={f.inner} fillOpacity={0.55} />
      </svg>

      <span className="absolute inset-0 flex items-center justify-center">
        <Icon size={size * 0.34} strokeWidth={2} className={f.icon} />
      </span>
      <span className="absolute bottom-0 left-1/2 flex h-5 min-w-5 -translate-x-1/2 translate-y-1/4 items-center justify-center rounded-full bg-indigo px-1.5 text-[9px] font-bold text-cream">
        {roman}
      </span>
      {state !== "earned" && (
        <span className="absolute bottom-1 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo text-cream ring-2 ring-paper">
          <Lock size={11} strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
}
