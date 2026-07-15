import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWeeklyStandings, findRank } from "@/lib/leaderboard";

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

  let weeklyRank: number | null = null;
  try {
    const standings = await getWeeklyStandings();
    weeklyRank = findRank(standings, user.id);
  } catch (err) {
    console.error("[play/stats standings]", err);
  }

  const stats: PlayStats = {
    current_streak: currentStreak,
    lifetime_points_from_play: lifetimePointsFromPlay,
    scams_whacked_today: scamsWhackedToday,
    weekly_rank: weeklyRank,
  };

  return NextResponse.json({ stats });
}