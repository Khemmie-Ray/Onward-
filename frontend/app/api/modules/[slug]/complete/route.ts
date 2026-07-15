import { NextResponse } from "next/server";
import type { Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mintModuleBadge } from "@/lib/onchain/badges";
import { markStreakDay } from "@/lib/streak";
import { isModuleLocked } from "@/lib/modules/lock-check";
import { awardPoints } from "@/lib/server/point";
import { triggerReferralOnFirstActivity } from "@/lib/referral/trigger";

type Body = {
  answers?: Array<{ card_index: number; answer: number | string }>;
};

const POINTS_PER_MODULE = 100;

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

  const { data: module, error: modErr } = await supabaseAdmin
    .from("modules")
    .select("id, slug, category, order_in_category, status")
    .eq("slug", slug)
    .single();

  if (modErr || !module || module.status !== "live") {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // ─── Category + order based lock check ─────────────────
  const locked = await isModuleLocked(
    user.id,
    module.category,
    module.order_in_category,
  );

  if (locked) {
    return NextResponse.json(
      { error: `Complete the earlier ${module.category} modules first` },
      { status: 403 },
    );
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

  for (const card of cards) {
    if (card.type === "flip") continue;
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

  // Badge only — no G$ moves on module completion. Modules award POINTS; G$
  // moves only when a verified user claims. The contract's processCompletion()
  // bundles the mint with a G$ transfer, so an underfunded reserve reverted
  // with InsufficientReserve() and silently killed the badge too. mint() has
  // no reserve dependency.
  let onchainResult: {
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

    onchainResult = {
      badgeTxHash: result.txHash,
      badgeTokenId: result.badgeTokenId.toString(),
      alreadyMinted: result.alreadyMinted,
      onchainError: null,
    };
  } catch (err) {
    console.error("[complete route badge mint failed]", err);
    onchainResult.onchainError =
      err instanceof Error ? err.message : "Badge mint failed";
  }

  const { data: completion, error: insertErr } = await supabaseAdmin
    .from("module_completions")
    .insert({
      user_id: user.id,
      module_id: module.id,
      quiz_score: correct,
      reward_tx_hash: onchainResult.badgeTxHash,
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

  let pointsAwarded = 0;
  let newPointsBalance: number | null = null;
  try {
    const pointsResult = await awardPoints({
      userId: user.id,
      delta: POINTS_PER_MODULE,
      source: "module_complete",
      referenceId: slug,
      metadata: {
        module_id: module.id,
        quiz_score: correct,
        total_graded: totalGraded,
      },
    });
    pointsAwarded = POINTS_PER_MODULE;
    newPointsBalance = pointsResult.newBalance;
  } catch (err) {
    console.error("[complete route points award failed]", err);
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
    completion,
    onchain: onchainResult,
  });
}