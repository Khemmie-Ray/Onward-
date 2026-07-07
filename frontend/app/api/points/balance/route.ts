import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { data: pointsRow } = await supabaseAdmin
    .from("user_points")
    .select("balance, lifetime_earned, lifetime_claimed")
    .eq("user_id", user.id)
    .maybeSingle();

  const balance = pointsRow?.balance ?? 0;
  const lifetimeEarned = pointsRow?.lifetime_earned ?? 0;
  const lifetimeClaimed = pointsRow?.lifetime_claimed ?? 0;

  const weekStart = getWeekStartUTC();
  const { data: weekClaims } = await supabaseAdmin
    .from("point_transactions")
    .select("delta")
    .eq("user_id", user.id)
    .eq("source", "claim_redemption")
    .gte("created_at", weekStart.toISOString());

  const claimedThisWeek = (weekClaims ?? []).reduce(
    (sum, r) => sum + Math.abs(r.delta ?? 0),
    0,
  );

  return NextResponse.json({
    balance,
    lifetime_earned: lifetimeEarned,
    lifetime_claimed: lifetimeClaimed,
    claimed_this_week: claimedThisWeek,
    weekly_cap: 1000,
    thresholds: {
      min_claim: 100,
      max_single_claim: 500,
      weekly_cap: 1000,
    },
  });
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
