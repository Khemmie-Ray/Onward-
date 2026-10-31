
export type MilestoneMetric = "streak" | "modules" | "referrals";
export type MilestoneIcon = "flame" | "modules" | "referrals";
export type MilestoneTone = "terracotta" | "forest" | "aubergine";

export type MilestoneTier = { name: string; threshold: number };

export type MilestoneTrack = {
  id: string;
  category: string; 
  metric: MilestoneMetric;
  icon: MilestoneIcon;
  tone: MilestoneTone;
  tiers: MilestoneTier[];
  describe: (threshold: number) => string;
  requirement: (threshold: number) => string; 
};

export const MILESTONE_TRACKS: MilestoneTrack[] = [
  {
    id: "streak",
    category: "Streak",
    metric: "streak",
    icon: "flame",
    tone: "terracotta",
    tiers: [
      { name: "Spark", threshold: 7 },
      { name: "Steady Flame", threshold: 14 },
      { name: "Bonfire", threshold: 30 },
      { name: "Torchbearer", threshold: 60 },
      { name: "Inferno", threshold: 100 },
    ],
    describe: (t) => `Keep a ${t} day streak.`,
    requirement: (t) => `${t} DAY STREAK`,
  },
  {
    id: "modules",
    category: "Modules",
    metric: "modules",
    icon: "modules",
    tone: "forest",
    tiers: [
      { name: "Curious Mind", threshold: 5 },
      { name: "Fast Learner", threshold: 10 },
      { name: "Scholar", threshold: 20 },
      { name: "Onward Master", threshold: 30 },
    ],
    describe: (t) => `Complete ${t} modules.`,
    requirement: (t) => `${t} MODULES`,
  },
  {
    id: "referrals",
    category: "Referrals",
    metric: "referrals",
    icon: "referrals",
    tone: "aubergine",
    tiers: [
      { name: "Welcomer", threshold: 3 },
      { name: "Connector", threshold: 5 },
      { name: "Community Builder", threshold: 10 },
      { name: "Ambassador", threshold: 25 },
    ],
    describe: (t) => `Bring ${t} friends who finish their first activity.`,
    requirement: (t) => `${t} FRIENDS`,
  },
];

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI"];

export type ResolvedMilestone = {
  track: MilestoneTrack;
  value: number;
  tierName: string;
  tierLevel: number; 
  threshold: number;
  nextName: string | null;
  done: boolean;
  progress: number; 
  description: string; 
};

export function resolveMilestone(
  track: MilestoneTrack,
  value: number,
): ResolvedMilestone {
  const v = Math.max(0, value);
  let idx = track.tiers.findIndex((tier) => tier.threshold > v);
  const done = idx === -1;
  if (done) idx = track.tiers.length - 1;

  const tier = track.tiers[idx];
  const next = done ? null : (track.tiers[idx + 1] ?? null);
  const progress = Math.min(1, tier.threshold === 0 ? 1 : v / tier.threshold);

  const description = `${track.describe(tier.threshold)}${
    next ? ` Then: ${next.name}.` : ""
  }`;

  return {
    track,
    value: v,
    tierName: tier.name,
    tierLevel: idx + 1,
    threshold: tier.threshold,
    nextName: next?.name ?? null,
    done,
    progress,
    description,
  };
}

export type TierState = "earned" | "next" | "locked";

export type ResolvedTier = {
  name: string;
  threshold: number;
  requirement: string;
  roman: string;
  state: TierState;
  value: number;
  progress: number; // 0..1
};

export type ResolvedTrack = {
  tiers: ResolvedTier[];
  earned: number;
  total: number;
};

export function resolveTrack(
  track: MilestoneTrack,
  value: number,
): ResolvedTrack {
  const v = Math.max(0, value);
  const nextIdx = track.tiers.findIndex((t) => t.threshold > v);

  const tiers: ResolvedTier[] = track.tiers.map((t, i) => {
    const earned = v >= t.threshold;
    const state: TierState = earned
      ? "earned"
      : i === nextIdx
        ? "next"
        : "locked";
    return {
      name: t.name,
      threshold: t.threshold,
      requirement: track.requirement(t.threshold),
      roman: ROMAN[i + 1] ?? String(i + 1),
      state,
      value: v,
      progress: Math.min(1, t.threshold === 0 ? 1 : v / t.threshold),
    };
  });

  return {
    tiers,
    earned: tiers.filter((t) => t.state === "earned").length,
    total: track.tiers.length,
  };
}
