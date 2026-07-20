import { NextResponse } from "next/server";
import type { Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getClaimableNow } from "@/lib/onchain/claims";

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { data: balanceRow } = await supabaseAdmin
    .from("user_points")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  const pointsBalance = balanceRow?.balance ?? 0;

  let claimableG = 0;
  if (user.wallet_address) {
    try {
      const wei = await getClaimableNow(user.wallet_address as Address);
      claimableG = Number(wei / 1_000_000_000_000_000_000n);
    } catch (err) {
      console.error("[claims/status] claimableNow failed", err);
    }
  }

  return NextResponse.json({
    points_balance: pointsBalance,
    claimable_g: claimableG, // ceiling from caps + reserve, whole G$
  });
}
