import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeLiveStreak } from "@/lib/streak-data";

const MILESTONE_DAYS = [7, 14, 30, 60];

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const isVerified = user.is_verified === true;

  const currentStreak = await computeLiveStreak(user.id as string);

  const { data: claims } = await supabaseAdmin
    .from("streak_reward_claims")
    .select("milestone_day, status, tx_hash")
    .eq("user_id", user.id);

  const { data: cached } = await supabaseAdmin
    .from("streak_reward_cache")
    .select("milestone_day, amount_g")
    .in("milestone_day", MILESTONE_DAYS);
  const amountByDay = new Map(
    (cached ?? []).map((c) => [c.milestone_day as number, Number(c.amount_g)]),
  );

  const byDay = new Map(
    (claims ?? []).map((c) => [c.milestone_day as number, c]),
  );

  const milestones = MILESTONE_DAYS.map((day) => {
    const claim = byDay.get(day);
    let state: "locked" | "claimable" | "claimed" | "pending";
    if (claim?.status === "paid") state = "claimed";
    else if (claim?.status === "pending") state = "pending";
    else if (currentStreak >= day) state = "claimable";
    else state = "locked";

    return {
      day,
      amount_g: amountByDay.get(day) ?? 0,
      state,
      tx_hash: claim?.tx_hash ?? null,
    };
  });

  return NextResponse.json({
    current_streak: currentStreak,
    is_verified: isVerified,
    milestones,
  });
}
