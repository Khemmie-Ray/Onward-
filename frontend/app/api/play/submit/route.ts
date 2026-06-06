import { NextResponse } from "next/server";
import { type Address } from "viem";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveRoundOnchain } from "@/lib/onchain/play";

type SubmitBody = {
  round_id?: string;
  correct_whacks?: number;
  wrong_whacks?: number;
  missed_scams?: number;
};

const FREE_REWARD_G = 5;
const PREMIUM_BONUS_G = 5;

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as SubmitBody | null;
  if (!body?.round_id) {
    return NextResponse.json({ error: "Missing round_id" }, { status: 400 });
  }

  const { data: session } = await supabaseAdmin
    .from("game_sessions")
    .select("*")
    .eq("id", body.round_id)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }
  if (session.status !== "active") {
    return NextResponse.json(
      { error: "Round already submitted" },
      { status: 409 }
    );
  }

  const mode = (session.mode ?? "free") as "free" | "premium";
  const correctWhacks = Math.max(0, body.correct_whacks ?? 0);
  const wrongWhacks = Math.max(0, body.wrong_whacks ?? 0);
  const missedScams = Math.max(0, body.missed_scams ?? 0);
  const score = Math.max(0, correctWhacks - wrongWhacks);
  const totalGraded = correctWhacks + wrongWhacks + missedScams;
  const accuracy = totalGraded > 0 ? correctWhacks / totalGraded : 0;

  const passed =
    mode === "premium"
      ? accuracy >= 0.75 && correctWhacks >= 8
      : accuracy >= 0.6 && correctWhacks >= 5;

  const levelBefore = user.current_level;
  const levelAfter = passed ? Math.min(levelBefore + 1, 100) : levelBefore;
  const rewardAmount = mode === "free" && passed ? FREE_REWARD_G : 0;

  await supabaseAdmin
    .from("game_sessions")
    .update({
      status: "submitted",
      completed_at: new Date().toISOString(),
      score,
      correct_whacks: correctWhacks,
      wrong_whacks: wrongWhacks,
      missed_scams: missedScams,
      passed,
      reward_g_amount: rewardAmount,
      level_after: levelAfter,
    })
    .eq("id", session.id);

  if (passed) {
    const userUpdate: { current_level: number; total_g_earned?: number } = {
      current_level: levelAfter,
    };

    if (mode === "free") {
      userUpdate.total_g_earned =
        Number(user.total_g_earned) + rewardAmount;

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const dayStr = today.toISOString().slice(0, 10);

      const { data: existingDay } = await supabaseAdmin
        .from("streak_days")
        .select("*")
        .eq("user_id", user.id)
        .eq("day", dayStr)
        .maybeSingle();

      if (existingDay) {
        await supabaseAdmin
          .from("streak_days")
          .update({
            passed: true,
            rounds_played: (existingDay.rounds_played ?? 0) + 1,
          })
          .eq("user_id", user.id)
          .eq("day", dayStr);
      } else {
        await supabaseAdmin.from("streak_days").insert({
          user_id: user.id,
          day: dayStr,
          passed: true,
          rounds_played: 1,
        });
      }

      await recomputeUserStreak(user.id);
    } else {
      userUpdate.total_g_earned =
        Number(user.total_g_earned) + PREMIUM_BONUS_G;
    }

    await supabaseAdmin.from("users").update(userUpdate).eq("id", user.id);
  }

  let onchain = {
    rewardTxHash: null as string | null,
    stakeResolveTxHash: null as string | null,
    levelBadgeTxHash: null as string | null,
    levelBadgeTokenId: null as string | null,
    onchainError: null as string | null,
  };

  try {
    const r = await resolveRoundOnchain({
      userWallet: user.wallet_address as Address,
      roundId: session.id,
      mode,
      passed,
      rewardAmountG: rewardAmount,
      levelBefore,
      levelAfter,
    });
    onchain = {
      rewardTxHash: r.rewardTxHash,
      stakeResolveTxHash: r.stakeResolveTxHash,
      levelBadgeTxHash: r.levelBadgeTxHash,
      levelBadgeTokenId: r.levelBadgeTokenId?.toString() ?? null,
      onchainError: null,
    };
    await supabaseAdmin
      .from("game_sessions")
      .update({
        reward_tx_hash: r.rewardTxHash,
        level_badge_tx_hash: r.levelBadgeTxHash,
      })
      .eq("id", session.id);
  } catch (err) {
    console.error("[onchain resolveRoundOnchain]", err);
    onchain.onchainError =
      err instanceof Error ? err.message : "Unknown onchain error";
  }

  return NextResponse.json({
    mode,
    passed,
    score,
    correct_whacks: correctWhacks,
    wrong_whacks: wrongWhacks,
    missed_scams: missedScams,
    reward_g_amount:
      mode === "premium" && passed ? PREMIUM_BONUS_G : rewardAmount,
    level_before: levelBefore,
    level_after: levelAfter,
    onchain,
  });
}

async function recomputeUserStreak(userId: string) {
  const { data: days } = await supabaseAdmin
    .from("streak_days")
    .select("day, passed")
    .eq("user_id", userId)
    .eq("passed", true)
    .order("day", { ascending: false });

  if (!days || days.length === 0) return;

  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const row of days) {
    const expected = new Date(today);
    expected.setUTCDate(today.getUTCDate() - streak);
    if (row.day === expected.toISOString().slice(0, 10)) streak++;
    else break;
  }

  const { data: u } = await supabaseAdmin
    .from("users")
    .select("longest_streak")
    .eq("id", userId)
    .single();

  const longestStreak = Math.max(u?.longest_streak ?? 0, streak);

  await supabaseAdmin
    .from("users")
    .update({ current_streak: streak, longest_streak: longestStreak })
    .eq("id", userId);
}