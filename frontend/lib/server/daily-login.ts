import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/server/point";

const DAILY_LOGIN_POINTS = 5;

export async function awardDailyLoginBonus(
  userId: string,
): Promise<{ awarded: boolean; points: number; newBalance: number | null }> {
  const dayKey = new Date().toISOString().slice(0, 10); 
  const referenceId = `daily_login:${dayKey}`;

  const { data: existing } = await supabaseAdmin
    .from("point_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("source", "daily_login")
    .eq("reference_id", referenceId)
    .maybeSingle();

  if (existing) {
    return { awarded: false, points: 0, newBalance: null };
  }

  try {
    const result = await awardPoints({
      userId,
      delta: DAILY_LOGIN_POINTS,
      source: "daily_login",
      referenceId,
      metadata: { day: dayKey },
    });

    return {
      awarded: result.wasNew,
      points: result.wasNew ? DAILY_LOGIN_POINTS : 0,
      newBalance: result.newBalance,
    };
  } catch (err) {
    console.error("[awardDailyLoginBonus] failed", err);
    return { awarded: false, points: 0, newBalance: null };
  }
}