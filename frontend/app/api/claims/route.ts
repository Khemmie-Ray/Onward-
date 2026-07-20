import { NextResponse } from "next/server";
import type { Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/server/point";
import { settleClaim, makeClaimId } from "@/lib/onchain/claims";

const CLAIM_TIERS = [100, 200, 500] as const;
type ClaimTier = (typeof CLAIM_TIERS)[number];

type Body = { points?: number };

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as Body | null;
  const points = body?.points;

  if (!points || !CLAIM_TIERS.includes(points as ClaimTier)) {
    return NextResponse.json(
      { error: "Choose a valid claim amount (100, 200, or 500 points)" },
      { status: 400 },
    );
  }

  if (!user.wallet_address) {
    return NextResponse.json({ error: "No wallet on file" }, { status: 400 });
  }

  // ─── 1. Confirm the user actually has the points ─────────────
  const { data: balanceRow, error: balErr } = await supabaseAdmin
    .from("user_points")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  if (balErr || !balanceRow) {
    return NextResponse.json(
      { error: "Could not read your points balance" },
      { status: 500 },
    );
  }

  if (balanceRow.balance < points) {
    return NextResponse.json(
      { error: "You don't have enough points for this claim" },
      { status: 400 },
    );
  }

  // A per-attempt nonce keeps the claimId unique across separate claims by the
  // same user, while staying deterministic within a single attempt.
  const nonce = `${Date.now()}`;
  const claimId = makeClaimId(user.wallet_address as Address, nonce);

  // ─── 2. Record the claim as pending ──────────────────────────
  const { data: claimRow, error: insErr } = await supabaseAdmin
    .from("point_claims")
    .insert({
      user_id: user.id,
      points_claimed: points,
      g_amount: points,
      status: "pending",
      claim_id: claimId,
    })
    .select("id")
    .single();

  if (insErr || !claimRow) {
    console.error("[claims] insert failed", insErr);
    return NextResponse.json(
      { error: "Could not start the claim" },
      { status: 500 },
    );
  }

  const claimRowId = claimRow.id;

  let deducted = false;
  try {
    await awardPoints({
      userId: user.id,
      delta: -points,
      source: "claim_redemption",
      referenceId: claimId,
      metadata: { claim_row_id: claimRowId, g_amount: points },
    });
    deducted = true;
  } catch (err) {
    console.error("[claims] point deduction failed", err);
    await supabaseAdmin
      .from("point_claims")
      .update({ status: "failed", error_message: "point deduction failed" })
      .eq("id", claimRowId);
    return NextResponse.json(
      { error: "Could not reserve your points. Try again." },
      { status: 500 },
    );
  }

  try {
    await supabaseAdmin
      .from("point_claims")
      .update({ status: "submitted" })
      .eq("id", claimRowId);

    const { txHash, gAmount } = await settleClaim({
      userWallet: user.wallet_address as Address,
      points,
      claimId,
    });

    await supabaseAdmin
      .from("point_claims")
      .update({
        status: "confirmed",
        tx_hash: txHash,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", claimRowId);

    await supabaseAdmin
      .from("users")
      .update({
        total_g_earned: (Number(user.total_g_earned) || 0) + points,
      })
      .eq("id", user.id);

    return NextResponse.json({
      ok: true,
      tx_hash: txHash,
      g_amount: points,
      g_amount_wei: gAmount.toString(),
    });
  } catch (err) {
    console.error("[claims] settle failed, refunding points", err);

    if (deducted) {
      try {
        console.log("[claims] DEDUCT DEBUG", {
          points,
          typeof_points: typeof points,
          delta_being_sent: -points,
          balance_read: balanceRow.balance,
        });
        
        await awardPoints({
          userId: user.id,
          delta: points,
          source: "claim_redemption",
          referenceId: `${claimId}:refund`,
          metadata: { claim_row_id: claimRowId, refund: true },
        });
      } catch (refundErr) {
        // If even the refund fails, the row stays failed with a message so it
        // can be reconciled by hand. The user is short points but NO G$ moved.
        console.error("[claims] REFUND FAILED — manual reconcile", refundErr);
        await supabaseAdmin
          .from("point_claims")
          .update({
            status: "failed",
            error_message: "settle failed AND refund failed — reconcile",
          })
          .eq("id", claimRowId);
        return NextResponse.json(
          { error: "Claim failed. Our team will restore your points shortly." },
          { status: 500 },
        );
      }
    }

    const message =
      err instanceof Error ? err.message : "on-chain settle failed";

    await supabaseAdmin
      .from("point_claims")
      .update({ status: "failed", error_message: message })
      .eq("id", claimRowId);

    let friendly = "Claim couldn't be completed. Your points are safe.";
    if (message.includes("ExceedsUserDailyCap")) {
      friendly = "You've hit today's claim limit. Try again tomorrow.";
    } else if (message.includes("ExceedsUserWeeklyCap")) {
      friendly = "You've hit this week's claim limit.";
    } else if (message.includes("ExceedsGlobalDailyCap")) {
      friendly = "Claims are maxed out for today. Come back tomorrow.";
    } else if (message.includes("NotVerified")) {
      friendly = "You need to verify with GoodDollar before claiming G$.";
    } else if (message.includes("InsufficientReserve")) {
      friendly = "The claim pool is temporarily empty. Try again soon.";
    }

    return NextResponse.json({ error: friendly }, { status: 400 });
  }
}
