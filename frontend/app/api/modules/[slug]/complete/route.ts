import { NextResponse } from "next/server";
import type { Address } from "viem";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { processCompletion } from "@/lib/onchain/badges";
import { markStreakDay } from "@/lib/streak";

/**
 * POST /api/modules/[slug]/complete
 *
 * Body shape:
 *   {
 *     answers: { card_index: number, answer: number | "scam" | "real" }[],
 *     isVerified: boolean   // ← NEW: frontend tells us if user is GoodID-verified
 *   }
 *
 * Flow:
 *   1. Auth user
 *   2. Validate prerequisites + answers
 *   3. If passing score, create completion row + call contract
 *   4. Contract handles direct payout (verified) vs accrue (unverified)
 *   5. Mark streak day
 *   6. Return completion details + onchain result
 */

type Body = {
  answers?: Array<{ card_index: number; answer: number | string }>;
  isVerified?: boolean;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { slug } = await params;
  const body = (await request.json().catch(() => null)) as Body | null;
  const answers = body?.answers ?? [];
  const isVerified = body?.isVerified === true;

  // ─── Lookup module + cards ──────────────────────────────
  const { data: module, error: modErr } = await supabaseAdmin
    .from("modules")
    .select("id, slug, prerequisite_slug, reward_g_amount, status")
    .eq("slug", slug)
    .single();

  if (modErr || !module || module.status !== "live") {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // ─── Prerequisite gate ──────────────────────────────────
  if (module.prerequisite_slug) {
    const { data: prereqModule } = await supabaseAdmin
      .from("modules")
      .select("id")
      .eq("slug", module.prerequisite_slug)
      .single();

    if (prereqModule) {
      const { count: prereqCount } = await supabaseAdmin
        .from("module_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("module_id", prereqModule.id);

      if ((prereqCount ?? 0) === 0) {
        return NextResponse.json(
          { error: "Complete the previous module first" },
          { status: 403 },
        );
      }
    }
  }

  // ─── Idempotency: if already completed, return existing ─
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

  // ─── Validate answers ───────────────────────────────────
  const { data: cards } = await supabaseAdmin
    .from("module_cards")
    .select("id, order_index, type, content")
    .eq("module_id", module.id)
    .order("order_index", { ascending: true });

  if (!cards) {
    return NextResponse.json({ error: "Module has no cards" }, { status: 500 });
  }

  let correct = 0;
  let totalGraded = 0;
  const incorrectCards: number[] = [];

  console.log("[grading]", {
    receivedAnswers: answers,
    cardsInDb: cards.map((c) => ({ order_index: c.order_index, type: c.type })),
  });

  for (const card of cards) {
    if (card.type === "flip") continue; // flip cards aren't graded
    totalGraded++;

    const submitted = answers.find((a) => a.card_index === card.order_index);
    if (!submitted) {
      incorrectCards.push(card.order_index);
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
      incorrectCards.push(card.order_index);
    }
  }

  const threshold = Math.ceil(totalGraded * 0.6);
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

  // ─── Onchain call (mint + distribute|accrue atomically) ─
  let onchainResult: {
    badgeTxHash: string;
    badgeTokenId: string;
    rewardTxHash: string;
    wasPaidDirect: boolean;
    wasAccrued: boolean;
    onchainError: string | null;
  } = {
    badgeTxHash: "0x" + "0".repeat(64),
    badgeTokenId: "0",
    rewardTxHash: "0x" + "0".repeat(64),
    wasPaidDirect: false,
    wasAccrued: false,
    onchainError: null,
  };

  try {
    const result = await processCompletion({
      userWallet: user.wallet_address as Address,
      moduleSlug: slug,
      rewardAmountG: module.reward_g_amount,
      isVerified,
    });

    onchainResult = {
      badgeTxHash: result.txHash,
      badgeTokenId: result.badgeTokenId.toString(),
      // Both ops are in the same tx in the new contract design.
      // Keep separate field names for frontend compatibility.
      rewardTxHash: result.txHash,
      wasPaidDirect: result.wasPaidDirect,
      wasAccrued: result.wasAccrued,
      onchainError: null,
    };
  } catch (err) {
    console.error("[complete route onchain failed]", err);
    onchainResult.onchainError =
      err instanceof Error ? err.message : "Onchain call failed";
  }

  // ─── DB write ───────────────────────────────────────────
  const { data: completion, error: insertErr } = await supabaseAdmin
    .from("module_completions")
    .insert({
      user_id: user.id,
      module_id: module.id,
      quiz_score: correct,
      reward_tx_hash:
        onchainResult.badgeTxHash !== "0x" + "0".repeat(64)
          ? onchainResult.badgeTxHash
          : null,
      badge_token_id:
        onchainResult.badgeTokenId !== "0" ? onchainResult.badgeTokenId : null,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json(
      { error: insertErr.message, onchain: onchainResult },
      { status: 500 },
    );
  }

  // Only credit total_g_earned in DB if it was a direct payout (it's now in the wallet)
  // Accrued amounts will be credited when they're claimed via /api/badges/claim-pending
  if (onchainResult.wasPaidDirect) {
    await supabaseAdmin
      .from("users")
      .update({
        total_g_earned:
          (Number(user.total_g_earned) || 0) + module.reward_g_amount,
      })
      .eq("id", user.id);
  }

  // ─── Streak ─────────────────────────────────────────────
  await markStreakDay(user.id);

  return NextResponse.json({
    status: "complete",
    passed: true,
    correct,
    total: totalGraded,
    reward_g_amount: module.reward_g_amount,
    completion,
    onchain: onchainResult,
  });
}
