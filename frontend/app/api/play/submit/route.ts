import { NextResponse } from "next/server";
import { type Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveRoundOnchain } from "@/lib/onchain/play";
import { isVerifiedOnchainSafe } from "@/lib/onchain/identity";
import { gradeRound, nextLevel, SCORING, type PlayMode } from "@/lib/scoring";
import { awardPoints } from "@/lib/server/point";
import { triggerReferralOnFirstActivity } from "@/lib/referral/trigger";

type SubmitBody = {
  round_id?: string;
  whacks?: string[];
  missed_scams?: number;
};

const POINTS_PER_ROUND = {
  free: 25,
} as const;

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as SubmitBody | null;
  if (!body?.round_id) {
    return NextResponse.json({ error: "Missing round_id" }, { status: 400 });
  }
  if (!Array.isArray(body.whacks)) {
    return NextResponse.json(
      { error: "Invalid whacks array" },
      { status: 400 },
    );
  }

  const isVerified = await isVerifiedOnchainSafe(
    user.wallet_address as Address,
  );

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
      { error: "Round not active (already submitted or not begun)" },
      { status: 409 },
    );
  }

  const mode = (session.mode ?? "free") as PlayMode;

  if (body.whacks.length > SCORING.maxTotalWhacks) {
    return NextResponse.json(
      { error: "Too many whacks submitted" },
      { status: 400 },
    );
  }

  const items = session.items as Array<{
    pattern_id: string;
    is_scam: boolean;
  }>;
  const patternMap = new Map<string, boolean>();
  for (const item of items) {
    patternMap.set(item.pattern_id, item.is_scam);
  }

  const perPatternCount = new Map<string, number>();
  for (const pid of body.whacks) {
    if (!patternMap.has(pid)) {
      return NextResponse.json(
        { error: "Invalid pattern_id in whacks" },
        { status: 400 },
      );
    }
    const c = (perPatternCount.get(pid) ?? 0) + 1;
    if (c > SCORING.maxPerPatternWhacks) {
      return NextResponse.json(
        { error: "Per-pattern whack cap exceeded" },
        { status: 400 },
      );
    }
    perPatternCount.set(pid, c);
  }

  let correctWhacks = 0;
  let wrongWhacks = 0;
  for (const pid of body.whacks) {
    if (patternMap.get(pid)) correctWhacks++;
    else wrongWhacks++;
  }

  const scamsInList = items.filter((it) => it.is_scam).length;
  const reportedMissed = Math.max(0, body.missed_scams ?? 0);
  const maxPossibleMissed = Math.max(0, scamsInList - correctWhacks);
  const missedScams = Math.min(reportedMissed, maxPossibleMissed);
  const appearedScams = correctWhacks + missedScams;

  const grade = gradeRound({ mode, correctWhacks, wrongWhacks, missedScams });

  const levelBefore = user.current_level;
  const levelAfter = nextLevel(levelBefore, grade.passed);
  const rewardAmount = grade.rewardAmount;

  await supabaseAdmin
    .from("game_sessions")
    .update({
      status: "submitted",
      completed_at: new Date().toISOString(),
      score: grade.score,
      correct_whacks: correctWhacks,
      wrong_whacks: wrongWhacks,
      missed_scams: missedScams,
      appeared_scams: appearedScams,
      passed: grade.passed,
      reward_g_amount: rewardAmount,
      level_after: levelAfter,
    })
    .eq("id", session.id);

  await triggerReferralOnFirstActivity(user.id);

  if (grade.passed) {
    const userUpdate: { current_level: number; total_g_earned?: number } = {
      current_level: levelAfter,
    };

    if (mode === "free") {
      if (isVerified) {
        userUpdate.total_g_earned = Number(user.total_g_earned) + rewardAmount;
      }
    } else {
      userUpdate.total_g_earned =
        Number(user.total_g_earned) + SCORING.premiumBonus;
    }

    await supabaseAdmin.from("users").update(userUpdate).eq("id", user.id);
  }

  let pointsAwarded = 0;
  let newPointsBalance: number | null = null;
  if (grade.passed && mode === "free") {
    const pointsDelta = POINTS_PER_ROUND.free;
    try {
      const result = await awardPoints({
        userId: user.id,
        delta: pointsDelta,
        source: "free_round_pass",
        referenceId: session.id,
        metadata: {
          score: grade.score,
          correctWhacks,
          wrongWhacks,
        },
      });
      pointsAwarded = pointsDelta;
      newPointsBalance = result.newBalance;
    } catch (err) {
      console.error("[submit route points award failed]", err);
    }
  }

  // ─── Onchain resolution ─────────────────────────────────
  let onchain = {
    rewardTxHash: null as string | null,
    stakeResolveTxHash: null as string | null,
    levelBadgeTxHash: null as string | null,
    levelBadgeTokenId: null as string | null,
    wasPaidDirect: false,
    wasAccrued: false,
    onchainError: null as string | null,
  };

  try {
    const r = await resolveRoundOnchain({
      userWallet: user.wallet_address as Address,
      roundId: session.id,
      mode,
      passed: grade.passed,
      rewardAmountG: rewardAmount,
      isVerified,
      levelBefore,
      levelAfter,
    });
    onchain = {
      rewardTxHash: r.rewardTxHash,
      stakeResolveTxHash: r.stakeResolveTxHash,
      levelBadgeTxHash: r.levelBadgeTxHash,
      levelBadgeTokenId: r.levelBadgeTokenId?.toString() ?? null,
      wasPaidDirect: r.wasPaidDirect,
      wasAccrued: r.wasAccrued,
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
    passed: grade.passed,
    score: grade.score,
    correct_whacks: correctWhacks,
    wrong_whacks: wrongWhacks,
    missed_scams: missedScams,
    total_scams: appearedScams,
    precision_percent: grade.precisionPercent,
    recall_percent: grade.recallPercent,
    reward_g_amount: rewardAmount,
    points_awarded: pointsAwarded,
    new_points_balance: newPointsBalance,
    level_before: levelBefore,
    level_after: levelAfter,
    threshold: grade.threshold,
    onchain,
  });
}
