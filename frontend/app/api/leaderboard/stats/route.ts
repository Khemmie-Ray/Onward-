import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PERIOD_DAYS } from "@/lib/leaderboard";

export async function GET() {
  
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("total_g_earned");

  const platformGDistributed = (users ?? []).reduce(
    (sum, u) => sum + (Number(u.total_g_earned) || 0),
    0,
  );

  const { data: periods } = await supabaseAdmin
    .from("leaderboard_periods")
    .select("points_awarded, period_start");

  const lifetimePointsAwarded = (periods ?? []).reduce(
    (sum, p) => sum + (p.points_awarded ?? 0),
    0,
  );
  const weeksPaid = (periods ?? []).length;

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - PERIOD_DAYS);

  const { data: weekSessions } = await supabaseAdmin
    .from("game_sessions")
    .select("user_id")
    .eq("status", "submitted")
    .eq("passed", true)
    .gte("completed_at", periodStart.toISOString());

  const activePlayersThisWeek = new Set(
    (weekSessions ?? []).map((s) => s.user_id),
  ).size;
  const roundsThisWeek = (weekSessions ?? []).length;

  return NextResponse.json({
    platform: {
      g_distributed: platformGDistributed,
    },
    lifetime: {
      points_awarded: lifetimePointsAwarded,
      weeks_paid: weeksPaid,
    },
    this_week: {
      active_players: activePlayersThisWeek,
      rounds_played: roundsThisWeek,
      days: PERIOD_DAYS,
    },
  });
}