import { supabaseAdmin } from "@/lib/supabase/admin";

export {
  PAYOUTS_BY_RANK,
  TOP_PAID_RANK,
  TOTAL_WEEKLY_PRIZE_POOL,
  PERIOD_DAYS,
} from "@/lib/leaderboard-constants";

import { PERIOD_DAYS } from "@/lib/leaderboard-constants";

export type StandingRow = {
  user_id: string;
  correct_whacks: number;
  rounds: number;
  premium_rounds: number;
};

export async function getWeeklyStandings(): Promise<StandingRow[]> {
  const periodStart = getPeriodStart();

  const { data: sessions, error } = await supabaseAdmin
    .from("game_sessions")
    .select("user_id, correct_whacks, mode")
    .eq("status", "submitted")
    .eq("passed", true)
    .gte("completed_at", periodStart.toISOString());

  if (error) {
    console.error("[getWeeklyStandings]", error);
    throw error;
  }

  const statsMap = new Map<string, StandingRow>();
  for (const s of sessions ?? []) {
    const existing = statsMap.get(s.user_id) ?? {
      user_id: s.user_id,
      correct_whacks: 0,
      rounds: 0,
      premium_rounds: 0,
    };
    existing.correct_whacks += s.correct_whacks ?? 0;
    existing.rounds += 1;
    if (s.mode === "premium") existing.premium_rounds += 1;
    statsMap.set(s.user_id, existing);
  }

  return Array.from(statsMap.values()).sort(
    (a, b) => b.correct_whacks - a.correct_whacks,
  );
}

export function findRank(
  standings: StandingRow[],
  userId: string,
): number | null {
  const idx = standings.findIndex((s) => s.user_id === userId);
  return idx >= 0 ? idx + 1 : null;
}

export function getPeriodStart(): Date {
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - PERIOD_DAYS);
  return periodStart;
}

export function primaryMode(s: StandingRow): "free" | "premium" {
  return s.premium_rounds > s.rounds / 2 ? "premium" : "free";
}
