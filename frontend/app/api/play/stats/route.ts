import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type PlayStats = {
  current_streak: number;
  lifetime_points_from_play: number;
  scams_whacked_today: number;
  weekly_rank: number | null;
};

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const currentStreak = user.current_streak ?? 0;

  const { data: pointRows } = await supabaseAdmin
    .from("point_transactions")
    .select("delta")
    .eq("user_id", user.id)
    .in("source", ["free_round_pass"]);

  const lifetimePointsFromPlay = (pointRows ?? []).reduce(
    (sum, r) => sum + (r.delta ?? 0),
    0,
  );

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: todaySessionRows } = await supabaseAdmin
    .from("game_sessions")
    .select("correct_whacks")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .gte("completed_at", todayStart.toISOString());

  const scamsWhackedToday = (todaySessionRows ?? []).reduce(
    (sum, r) => sum + (r.correct_whacks ?? 0),
    0,
  );

  const weekStart = getWeekStartUTC();
  const { data: weekRows } = await supabaseAdmin
    .from("point_transactions")
    .select("user_id, delta")
    .gte("created_at", weekStart.toISOString())
    .gt("delta", 0);

  let weeklyRank: number | null = null;
  if (weekRows && weekRows.length > 0) {
    const totals = new Map<string, number>();
    for (const row of weekRows) {
      totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + row.delta);
    }
    const ranked = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const userIndex = ranked.findIndex(([id]) => id === user.id);
    weeklyRank = userIndex >= 0 ? userIndex + 1 : null;
  }

  const stats: PlayStats = {
    current_streak: currentStreak,
    lifetime_points_from_play: lifetimePointsFromPlay,
    scams_whacked_today: scamsWhackedToday,
    weekly_rank: weeklyRank,
  };

  return NextResponse.json({ stats });
}

function getWeekStartUTC(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}
