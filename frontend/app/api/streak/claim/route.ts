import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAddress, type Address } from "viem";
import {
  isVerifiedOnchain,
  streakRewardFor,
  hasClaimedOnchain,
  streakClaimOnchain,
} from "@/lib/onchain/streak";
import { computeLiveStreak } from "@/lib/streak-data";

const MILESTONES = new Set([7, 14, 30, 60]);

const bare = (w: string) => w.split(":").pop()!.toLowerCase();

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  let body: { day?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const day = Number(body.day);
  if (!MILESTONES.has(day)) {
    return NextResponse.json({ error: "Unknown milestone" }, { status: 400 });
  }

  const wallet = getAddress(bare(user.wallet_address as string)) as Address;

  const currentStreak = await computeLiveStreak(user.id as string);
  if (currentStreak < day) {
    return NextResponse.json(
      {
        error: `Your current streak (${currentStreak}) hasn't reached ${day} days.`,
      },
      { status: 400 },
    );
  }

  let verified = false;
  try {
    verified = await isVerifiedOnchain(wallet);
  } catch (e) {
    console.error("[streak claim] verify read failed", e);
    return NextResponse.json(
      { error: "Couldn't verify right now, try again." },
      { status: 502 },
    );
  }
  if (!verified) {
    return NextResponse.json(
      { error: "This wallet isn't verified (or is a linked wallet)." },
      { status: 403 },
    );
  }

  let rewardWholeG = 0;
  try {
    const reward = await streakRewardFor(day);
    if (reward === 0n) {
      return NextResponse.json(
        { error: "This milestone isn't active yet." },
        { status: 400 },
      );
    }
    rewardWholeG = Number(reward / 10n ** 18n); // whole G$ for the DB record
    if (await hasClaimedOnchain(wallet, day)) {
      return NextResponse.json({ error: "Already claimed." }, { status: 409 });
    }
  } catch (e) {
    console.error("[streak claim] onchain pre-read failed", e);
    return NextResponse.json(
      { error: "Network busy, try again." },
      { status: 502 },
    );
  }

  const { error: insErr } = await supabaseAdmin
    .from("streak_reward_claims")
    .insert({
      user_id: user.id,
      milestone_day: day,
      amount_g: rewardWholeG, 
      status: "pending",
    });
  if (insErr) {
    
    return NextResponse.json(
      { error: "Already claimed or in progress." },
      { status: 409 },
    );
  }

  let txHash: `0x${string}`;
  try {
    txHash = await streakClaimOnchain(wallet, day);
  } catch (e) {
    console.error("[streak claim] payment errored", e);
    return NextResponse.json(
      {
        error:
          "We couldn't confirm the payment. If it doesn't appear shortly, it will be resolved automatically — you won't be double-charged or double-paid.",
        pending: true,
      },
      { status: 202 },
    );
  }

  await supabaseAdmin
    .from("streak_reward_claims")
    .update({
      status: "paid",
      tx_hash: txHash,
      paid_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("milestone_day", day);

  return NextResponse.json({
    ok: true,
    day,
    amount_g: rewardWholeG,
    tx_hash: txHash,
  });
}
