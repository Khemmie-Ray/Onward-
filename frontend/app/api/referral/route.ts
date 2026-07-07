import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { data: me } = await supabaseAdmin
    .from("users")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  const { count: totalReferred } = await supabaseAdmin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("referred_by_user_id", user.id);

  const { data: rewardedRows } = await supabaseAdmin
    .from("point_transactions")
    .select("delta")
    .eq("user_id", user.id)
    .eq("source", "referral");

  const referralPointsEarned = (rewardedRows ?? []).reduce(
    (sum, r) => sum + (r.delta ?? 0),
    0,
  );
  const qualifiedReferrals = (rewardedRows ?? []).length;

  return NextResponse.json({
    referral_code: me?.referral_code ?? null,
    total_referred: totalReferred ?? 0,
    qualified_referrals: qualifiedReferrals,
    referral_points_earned: referralPointsEarned,
  });
}