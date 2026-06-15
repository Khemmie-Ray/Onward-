import { NextResponse } from "next/server";
import { type Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveRoundOnchain } from "@/lib/onchain/play";

type AbandonBody = {
  round_id?: string;
};

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as AbandonBody | null;
  if (!body?.round_id) {
    return NextResponse.json({ error: "Missing round_id" }, { status: 400 });
  }

  const { data: session } = await supabaseAdmin
    .from("game_sessions")
    .select("id, mode, status, level_before")
    .eq("id", body.round_id)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }
  if (session.status !== "active") {
    return NextResponse.json(
      { error: "Cannot abandon — round is not active" },
      { status: 409 }
    );
  }

  await supabaseAdmin
    .from("game_sessions")
    .update({
      status: "expired",
      passed: false,
      completed_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (session.mode === "premium") {
    try {
      await resolveRoundOnchain({
        userWallet: user.wallet_address as Address,
        roundId: session.id,
        mode: "premium",
        passed: false,
        rewardAmountG: 0,
        isVerified: false,
        levelBefore: session.level_before ?? user.current_level,
        levelAfter: session.level_before ?? user.current_level,
      });
    } catch (err) {
      console.error("[abandon onchain forfeit failed]", err);
    }
  }

  return NextResponse.json({ ok: true });
}