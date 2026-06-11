import { NextResponse } from "next/server";
import { formatUnits, type Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { claimPendingForUser, getPendingBalance } from "@/lib/onchain/badges";
import { isVerifiedOnchain } from "@/lib/onchain/identity";

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const userWallet = user.wallet_address as Address;

  let verified: boolean;
  try {
    verified = await isVerifiedOnchain(userWallet);
  } catch (err) {
    console.error("[claim-pending] verification check failed", err);
    return NextResponse.json(
      { error: "Couldn't verify your status. Please try again shortly." },
      { status: 503 }
    );
  }

  if (!verified) {
    return NextResponse.json(
      {
        error:
          "Your wallet isn't verified with GoodID yet. Complete verification to claim your pending G$.",
        code: "NOT_VERIFIED",
      },
      { status: 403 }
    );
  }

  // ─── Read pending balance ───────────────────────────────
  let pendingBefore: bigint;
  try {
    pendingBefore = await getPendingBalance(userWallet);
  } catch (err) {
    console.error("[claim-pending] balance read failed", err);
    return NextResponse.json(
      { error: "Couldn't read pending balance" },
      { status: 500 }
    );
  }

  if (pendingBefore === 0n) {
    return NextResponse.json({
      success: true,
      amountG: 0,
      amountWei: "0",
      txHash: null,
      message: "Nothing to claim",
    });
  }

  // ─── Sign the release ───────────────────────────────────
  let txHash: string;
  let amount: bigint;
  try {
    const result = await claimPendingForUser(userWallet);
    txHash = result.txHash;
    amount = result.amount;
  } catch (err) {
    console.error("[claim-pending] tx failed", err);
    const msg = err instanceof Error ? err.message : "Onchain call failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const amountG = parseFloat(formatUnits(amount, 18));
  await supabaseAdmin
    .from("users")
    .update({
      total_g_earned: (Number(user.total_g_earned) || 0) + amountG,
    })
    .eq("id", user.id);

  return NextResponse.json({
    success: true,
    amountG,
    amountWei: amount.toString(),
    txHash,
  });
}