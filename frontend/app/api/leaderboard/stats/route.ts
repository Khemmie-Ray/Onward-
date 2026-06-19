import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PERIOD_DAYS } from "@/lib/leaderboard";

export async function GET() {
  const { data: payouts } = await supabaseAdmin
    .from("leaderboard_payouts")
    .select("amount_g, period_start");

  const lifetimeGPaid = (payouts ?? []).reduce(
    (sum, p) => sum + (p.amount_g ?? 0),
    0
  );

  const weeksPaid = new Set((payouts ?? []).map((p) => p.period_start)).size;

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - PERIOD_DAYS);

  const { data: weekSessions } = await supabaseAdmin
    .from("game_sessions")
    .select("user_id")
    .eq("status", "submitted")
    .eq("passed", true)
    .gte("completed_at", periodStart.toISOString());

  const activePlayersThisWeek = new Set(
    (weekSessions ?? []).map((s) => s.user_id)
  ).size;
  const roundsThisWeek = (weekSessions ?? []).length;

  return NextResponse.json({
    lifetime: {
      g_paid_out: lifetimeGPaid,
      weeks_paid: weeksPaid,
    },
    this_week: {
      active_players: activePlayersThisWeek,
      rounds_played: roundsThisWeek,
      days: PERIOD_DAYS,
    },
  });
}