import { supabaseAdmin } from "@/lib/supabase/admin";

export async function attributeReferral(
  newUserId: string,
  referralCode: string | null,
): Promise<{ attributed: boolean }> {
  if (!referralCode?.trim()) return { attributed: false };

  const { data: referrer } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("referral_code", referralCode.trim().toUpperCase())
    .maybeSingle();

  if (!referrer) return { attributed: false };

  if (referrer.id === newUserId) return { attributed: false };

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("referred_by_user_id")
    .eq("id", newUserId)
    .single();

  if (existing?.referred_by_user_id) return { attributed: false };

  await supabaseAdmin
    .from("users")
    .update({ referred_by_user_id: referrer.id })
    .eq("id", newUserId);

  return { attributed: true };
}

export async function maybeAwardReferralBonus(
  referredUserId: string,
): Promise<{ awarded: boolean }> {
  const REFERRAL_POINTS = 250;

  const { data: referredUser } = await supabaseAdmin
    .from("users")
    .select("referred_by_user_id")
    .eq("id", referredUserId)
    .single();

  const referrerId = referredUser?.referred_by_user_id;
  if (!referrerId) return { awarded: false };

  const { awardPoints } = await import("@/lib/server/point");

  try {
    await awardPoints({
      userId: referrerId,
      delta: REFERRAL_POINTS,
      source: "referral",
      referenceId: `referral:${referredUserId}`,
      metadata: { referred_user_id: referredUserId },
    });
    return { awarded: true };
  } catch (err) {
    console.error("[maybeAwardReferralBonus] failed", err);
    return { awarded: false };
  }
}
