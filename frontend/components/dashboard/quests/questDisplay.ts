import { BookOpen, Gamepad2, Hammer, Sparkles, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { QuestMetric, QuestTier } from "@/lib/supabase/types";

/** Icon for each kind of quest. Add an entry when a new metric is added. */
export const QUEST_ICONS: Record<QuestMetric, LucideIcon> = {
  modules_completed: BookOpen,
  rounds_played: Gamepad2,
  rounds_passed: Trophy,
  correct_whacks: Hammer,
  activity_points: Sparkles,
};

export const TIER_LABEL: Record<QuestTier, string> = {
  easy: "Easy",
  medium: "Medium",
  stretch: "Stretch",
};

export function progressPercent(progress: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((progress / target) * 100));
}