import { NextResponse } from "next/server";
import { type Address } from "viem";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { processCompletion } from "@/lib/onchain/badges";
import { markStreakDay } from "@/lib/streak";
import type { ChoiceCardContent, SpotterCardContent } from "@/lib/supabase/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { slug } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { answers?: { card_index: number; answer: number | "scam" | "real" }[] }
    | null;

  if (!body?.answers || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Missing answers" }, { status: 400 });
  }

  // ─── Fetch module ───────────────────────────────────────
  const { data: module } = await supabaseAdmin
    .from("modules")
    .select("*")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (!module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // ─── Idempotency: already completed? ───────────────────
  const { data: existing } = await supabaseAdmin
    .from("module_completions")
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

  // ─── Prerequisite gating ───────────────────────────────
  // Enforced server-side. Frontend lock state is for UX; this is the guard
  // that prevents skipping ahead via direct API call.
  if (module.prerequisite_slug) {
    const { data: prereq } = await supabaseAdmin
      .from("modules")
      .select("id")
      .eq("slug", module.prerequisite_slug)
      .maybeSingle();

    if (prereq) {
      const { data: prereqDone } = await supabaseAdmin
        .from("module_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("module_id", prereq.id)
        .maybeSingle();

      if (!prereqDone) {
        return NextResponse.json(
          { error: `Complete "${module.prerequisite_slug}" first` },
          { status: 403 }
        );
      }
    }
  }

  // ─── Fetch cards for grading ───────────────────────────
  const { data: cards } = await supabaseAdmin
    .from("module_cards")
    .select("*")
    .eq("module_id", module.id)
    .order("order_index", { ascending: true });

  if (!cards || cards.length === 0) {
    return NextResponse.json({ error: "Module has no cards" }, { status: 500 });
  }

  // ─── Grade ─────────────────────────────────────────────
  const gradedCards = cards
    .filter((c) => c.type === "choice" || c.type === "spotter")
    .map((card) => {
      const submitted = body.answers!.find(
        (a) => a.card_index === card.order_index
      );
      if (card.type === "choice") {
        const content = card.content as ChoiceCardContent;
        return {
          card_index: card.order_index,
          correct: submitted?.answer === content.correct_index,
          type: "choice" as const,
        };
      } else {
        const content = card.content as SpotterCardContent;
        return {
          card_index: card.order_index,
          correct: submitted?.answer === content.correct_answer,
          type: "spotter" as const,
        };
      }
    });

  const correctCount = gradedCards.filter((g) => g.correct).length;
  const totalGraded = gradedCards.length;
  const passingThreshold = Math.ceil(totalGraded * 0.6);
  const passed = correctCount >= passingThreshold;

  if (!passed) {
    return NextResponse.json({
      status: "incomplete",
      passed: false,
      correct: correctCount,
      total: totalGraded,
      threshold: passingThreshold,
      incorrect_cards: gradedCards
        .filter((g) => !g.correct)
        .map((g) => g.card_index),
    });
  }

  // ─── Record completion ─────────────────────────────────
  const { data: completion, error: completionError } = await supabaseAdmin
    .from("module_completions")
    .insert({
      user_id: user.id,
      module_id: module.id,
      quiz_score: correctCount,
    })
    .select("*")
    .single();

  if (completionError || !completion) {
    return NextResponse.json(
      { error: "Failed to record completion" },
      { status: 500 }
    );
  }

  // ─── Update user G$ balance ────────────────────────────
  await supabaseAdmin
    .from("users")
    .update({
      total_g_earned: user.total_g_earned + module.reward_g_amount,
    })
    .eq("id", user.id);

  // ─── Clean up module_progress (no longer in progress) ──
  await supabaseAdmin
    .from("module_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("module_id", module.id);

  // ─── Mark today as a streak day ────────────────────────
  // Any meaningful daily action (module completion or game pass) counts.
  try {
    await markStreakDay(user.id);
  } catch (err) {
    // Don't fail the completion if streak update has issues
    console.error("[markStreakDay failed]", err);
  }

  // ─── Onchain mint + reward distribution ────────────────
  let onchainResult = {
    badgeTxHash: null as string | null,
    badgeTokenId: null as string | null,
    rewardTxHash: null as string | null,
    onchainError: null as string | null,
  };

  try {
    const result = await processCompletion({
      userWallet: user.wallet_address as Address,
      moduleSlug: slug,
      rewardAmountG: module.reward_g_amount,
    });

    onchainResult = {
      badgeTxHash: result.badgeTxHash,
      badgeTokenId: result.badgeTokenId.toString(),
      rewardTxHash: result.rewardTxHash,
      onchainError: null,
    };

    await supabaseAdmin
      .from("module_completions")
      .update({
        reward_tx_hash: result.rewardTxHash,
        badge_token_id: result.badgeTokenId.toString(),
      })
      .eq("id", completion.id);
  } catch (err) {
    console.error("[onchain processCompletion failed]", err);
    onchainResult.onchainError =
      err instanceof Error ? err.message : "Unknown onchain error";
  }

  return NextResponse.json({
    status: "complete",
    passed: true,
    correct: correctCount,
    total: totalGraded,
    reward_g_amount: module.reward_g_amount,
    completion,
    onchain: onchainResult,
  });
}