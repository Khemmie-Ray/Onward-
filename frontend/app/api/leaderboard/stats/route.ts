import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPeriodStart, getPeriodEnd } from "@/lib/leaderboard-period";
import { getPlatformVolumeG } from "@/lib/onchain/volume";

export async function GET() {
  const platformGDistributed = await getPlatformVolumeG();

  const { data: periods } = await supabaseAdmin
    .from("leaderboard_periods")
    .select("points_awarded, period_start");

  const lifetimePointsAwarded = (periods ?? []).reduce(
    (sum, p) => sum + (p.points_awarded ?? 0),
    0,
  );
  const weeksPaid = (periods ?? []).length;

  const periodStart = getPeriodStart();
  const periodEnd = getPeriodEnd();

  const { data: weekSessions } = await supabaseAdmin
    .from("game_sessions")
    .select("user_id")
    .eq("status", "submitted")
    .eq("passed", true)
    .gte("completed_at", periodStart.toISOString())
    .lt("completed_at", periodEnd.toISOString());

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
    },
  });
}
