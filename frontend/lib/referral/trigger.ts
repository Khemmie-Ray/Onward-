import { supabaseAdmin } from "@/lib/supabase/admin";
import { maybeAwardReferralBonus } from "@/lib/server/referral";

export async function triggerReferralOnFirstActivity(
  referredUserId: string,
): Promise<void> {
  try {
    const { data: u } = await supabaseAdmin
      .from("users")
      .select("referred_by_user_id")
      .eq("id", referredUserId)
      .single();

    if (!u?.referred_by_user_id) return; // not referred — nothing to do

    await maybeAwardReferralBonus(referredUserId);
  } catch (err) {
    console.error("[triggerReferralOnFirstActivity] failed", err);
    // swallow — referral bonus is recoverable, must not break the activity
  }
}
