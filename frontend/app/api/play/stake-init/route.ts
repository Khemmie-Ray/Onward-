import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { keccak256, toBytes } from "viem";

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: todaysPremium, error: countErr } = await supabaseAdmin
    .from("game_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("mode", "premium")
    .gte("started_at", todayStart.toISOString());

  if (countErr) {
    return NextResponse.json({ error: "Failed to check daily cap" }, { status: 500 });
  }

  const todaysCount = todaysPremium?.length ?? 0;
  if (todaysCount >= 5) {
    return NextResponse.json(
      { error: "Daily premium round limit reached. Try again after UTC midnight." },
      { status: 429 }
    );
  }

  const roundId = crypto.randomUUID();
  const roundIdHash = keccak256(toBytes(roundId));

  return NextResponse.json({
    round_id: roundId,
    round_id_hash: roundIdHash,
    rounds_remaining_today: 5 - todaysCount - 1,
  });
}