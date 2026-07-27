import { NextResponse } from "next/server";
import type { Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mintModuleBadge } from "@/lib/onchain/badges";
import { markStreakDay } from "@/lib/streak";
import { awardPoints } from "@/lib/server/point";
import { triggerReferralOnFirstActivity } from "@/lib/referral/trigger";
import { assertModulePlayable } from "@/lib/learn/lock";

type Body = {
  answers?: Array<{ card_index: number; answer: number | string }>;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { slug } = await params;
  const body = (await request.json().catch(() => null)) as Body | null;
  const answers = body?.answers ?? [];

  // ─── Load the module (need id + points_reward) ──────────
  const { data: module, error: modErr } = await supabaseAdmin
    .from("learn_modules")
    .select("id, slug, points_reward, status")
    .eq("slug", slug)
    .single();

  if (modErr || !module || module.status !== "live") {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const playable = await assertModulePlayable(slug, user.id);
  if (!playable.ok) {
    if (playable.reason === "not_found") {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Complete the earlier module in this track first" },
      { status: 403 },
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("learn_completions")
    .select("*")
    .eq("user_id", user.id)
    .eq("module_id", module.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      status: "complete",
      already_completed: true,
      completion: existing,
    });
  }

  const { data: cards } = await supabaseAdmin
    .from("learn_cards")
    .select("id, order_index, type, content")
    .eq("module_id", module.id)
    .order("order_index", { ascending: true });

  if (!cards) {
    return NextResponse.json({ error: "Module has no cards" }, { status: 500 });
  }

  let correct = 0;
  let totalGraded = 0;
  const incorrectCards: number[] = [];

  for (const card of cards) {
    if (card.type === "flip") continue;
    totalGraded++;

    const submitted = answers.find(
      (a) => a.card_index === card.order_index + 1,
    );
    if (!submitted) {
      incorrectCards.push(card.order_index + 1);
      continue;
    }

    const content = card.content as {
      correct_index?: number;
      correct_answer?: number | string;
    };
    const expected =
      card.type === "choice" ? content.correct_index : content.correct_answer;

    if (submitted.answer === expected) {
      correct++;
    } else {
      incorrectCards.push(card.order_index + 1);
    }
  }

  const threshold = totalGraded > 0 ? Math.ceil(totalGraded * 0.6) : 0;
  const passed = correct >= threshold;

  if (!passed) {
    return NextResponse.json({
      status: "incomplete",
      passed: false,
      correct,
      total: totalGraded,
      threshold,
      incorrect_cards: incorrectCards,
    });
  }

  let onchain: {
    badgeTxHash: string | null;
    badgeTokenId: string;
    alreadyMinted: boolean;
    onchainError: string | null;
  } = {
    badgeTxHash: null,
    badgeTokenId: "0",
    alreadyMinted: false,
    onchainError: null,
  };

  try {
    const result = await mintModuleBadge({
      userWallet: user.wallet_address as Address,
      moduleSlug: slug,
    });
    onchain = {
      badgeTxHash: result.txHash,
      badgeTokenId: result.badgeTokenId.toString(),
      alreadyMinted: result.alreadyMinted,
      onchainError: null,
    };
  } catch (err) {
    console.error("[learn complete] badge mint failed", err);
    onchain.onchainError =
      err instanceof Error ? err.message : "Badge mint failed";
  }

  const { data: completion, error: insertErr } = await supabaseAdmin
    .from("learn_completions")
    .insert({
      user_id: user.id,
      module_id: module.id,
      quiz_score: totalGraded > 0 ? correct : null,
      points_awarded: 0,
      badge_token_id:
        onchain.badgeTokenId !== "0" ? onchain.badgeTokenId : null,
      badge_tx_hash: onchain.badgeTxHash,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json(
      { error: insertErr.message, onchain },
      { status: 500 },
    );
  }

  let pointsAwarded = 0;
  let newPointsBalance: number | null = null;
  try {
    const pointsResult = await awardPoints({
      userId: user.id,
      delta: module.points_reward,
      source: "module_complete",
      referenceId: slug,
      metadata: {
        module_id: module.id,
        quiz_score: correct,
        total_graded: totalGraded,
        flow: "learn",
      },
    });
    pointsAwarded = module.points_reward;
    newPointsBalance = pointsResult.newBalance;

    await supabaseAdmin
      .from("learn_completions")
      .update({ points_awarded: pointsAwarded })
      .eq("id", completion.id);
  } catch (err) {
    console.error("[learn complete] points award failed", err);
  }

  await triggerReferralOnFirstActivity(user.id);
  await markStreakDay(user.id);

  return NextResponse.json({
    status: "complete",
    passed: true,
    correct,
    total: totalGraded,
    points_awarded: pointsAwarded,
    new_points_balance: newPointsBalance,
    completion: { ...completion, points_awarded: pointsAwarded },
    onchain,
  });
}
