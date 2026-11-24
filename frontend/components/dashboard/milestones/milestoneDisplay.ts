import {
  Award,
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Crown,
  Flame,
  GraduationCap,
  Medal,
  Sparkles,
  Star,
  Sun,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MilestoneView } from "@/lib/server/milestone-rewards";
import type { MilestoneCategory } from "@/lib/supabase/types";

export type SectionKey = MilestoneCategory | "streak";

export type MedalPalette =
  | "aubergine"
  | "terracotta"
  | "forest"
  | "mustard"
  | "indigo";

/** Order the sections appear in on the milestones page. */
export const SECTION_ORDER: SectionKey[] = [
  "getting_started",
  "streak",
  "learning",
  "quests",
  "seasonal",
];

export const SECTION_META: Record<
  SectionKey,
  { label: string; blurb: string; palette: MedalPalette; icon: LucideIcon }
> = {
  getting_started: {
    label: "Getting started",
    blurb: "Your first steps on Onward.",
    palette: "aubergine",
    icon: BadgeCheck,
  },
  streak: {
    label: "Streaks",
    blurb: "Paid in G$ straight to your wallet. Claim each one once.",
    palette: "terracotta",
    icon: Flame,
  },
  learning: {
    label: "Learning",
    blurb: "Rewards for the lessons you finish.",
    palette: "forest",
    icon: GraduationCap,
  },
  quests: {
    label: "Quests",
    blurb: "Rewards for clearing your daily and monthly quests.",
    palette: "mustard",
    icon: Target,
  },
  seasonal: {
    label: "Seasons",
    blurb: "Badges for taking part in each season.",
    palette: "indigo",
    icon: Sparkles,
  },
};

/** A distinct icon per milestone, so each badge looks like its own thing. */
const MILESTONE_ICONS: Record<string, LucideIcon> = {
  verified: BadgeCheck,
  modules_20: BookOpen,
  modules_40: Zap,
  modules_60: GraduationCap,
  modules_100: Crown,
  track_web3: Award,
  quest_first_clear: Target,
  quest_clear_7: CalendarCheck,
  monthly_1: CalendarDays,
  monthly_3: Medal,
  monthly_6: Trophy,
  season_5: Sparkles,
};

const STREAK_ICONS: Record<number, LucideIcon> = {
  7: Flame,
  14: Sun,
  30: Star,
  60: Medal,
  100: Crown,
};

export function milestoneIcon(m: MilestoneView): LucideIcon {
  return MILESTONE_ICONS[m.id] ?? SECTION_META[m.category].icon;
}

export function streakIcon(day: number): LucideIcon {
  return STREAK_ICONS[day] ?? Flame;
}

/** Plain-language requirement shown under each badge. */
export function requirementText(m: MilestoneView): string {
  const t = m.threshold;
  switch (m.metric) {
    case "verified":
      return "Verify with GoodID";
    case "modules_completed":
      return `Finish ${t} lesson${t === 1 ? "" : "s"}`;
    case "track_completed":
      return "Finish the whole course";
    case "full_clear_days":
      return t === 1
        ? "Clear all 3 daily quests in one day"
        : `Clear all 3 daily quests on ${t} days`;
    case "monthly_quests_completed":
      return `Complete ${t} monthly quest${t === 1 ? "" : "s"}`;
    case "season_participant":
      return "Take part in the season";
  }
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function toRoman(n: number): string {
  return ROMAN[n] ?? String(n);
}

export function formatEarnedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
