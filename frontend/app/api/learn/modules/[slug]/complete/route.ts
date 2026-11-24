import { NextResponse } from "next/server";
import type { Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mintModuleBadge } from "@/lib/onchain/badges";
import { invalidateBadges } from "@/lib/server/badge-cache";
import { markStreakDay } from "@/lib/streak-data";
import { awardPoints } from "@/lib/server/point";
import { triggerReferralOnFirstActivity } from "@/lib/referral/trigger";
import { evaluateQuests } from "@/lib/server/quest";
import { assertModulePlayable } from "@/lib/learn/lock";
import { isCardCorrect, UNGRADED_CARD_TYPES } from "@/lib/learn/grading";
import type { CardAnswer } from "@/lib/lessons/lesson-data";
import {
  getPublishedSection,
  getServedSectionVersion,
  recordSectionCompletion,
  sectionContentEnabled,
} from "@/lib/learn/section-content";
import {
  checkSectionAccess,
  insertSectionCompletion,
  mirrorToLegacyCompletion,
} from "@/lib/learn/course-store";
import type { DbSectionCompletion } from "@/lib/supabase/types";

type Body = {
  answers?: Array<{ card_index: number; answer: CardAnswer }>;
  version_id?: string;
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

  if (sectionContentEnabled()) {
    return completeSection(slug, user, answers, body?.version_id);
  }

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
    if (playable.reason === "not_enrolled") {
      return NextResponse.json(
        { error: "Enrol in this course to complete its lessons." },
        { status: 403 },
      );
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
      onchain: {
        badgeTxHash: existing.badge_tx_hash ?? null,
        badgeTokenId: existing.badge_token_id
          ? String(existing.badge_token_id)
          : "0",
        alreadyMinted: true,
        onchainError: null,
      },
    });
  }

  const served =
    typeof body?.version_id === "string"
      ? await getServedSectionVersion(slug, body.version_id)
      : null;

  const { data: cards } = served
    ? { data: served.cards }
    : await supabaseAdmin
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
    if (UNGRADED_CARD_TYPES.has(card.type)) continue;
    totalGraded++;

    const submitted = answers.find(
      (a) => a.card_index === card.order_index + 1,
    );
    if (!submitted) {
      incorrectCards.push(card.order_index + 1);
      continue;
    }

    if (
      isCardCorrect(
        card.type,
        card.content as Record<string, unknown>,
        submitted.answer,
      )
    ) {
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

    invalidateBadges(user.wallet_address as string);

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

  await recordSectionCompletion({
    userId: user.id,
    legacyModuleId: module.id,
    versionId: served?.versionId ?? null,
    score: totalGraded > 0 ? correct : null,
    pointsAwarded,
    badgeTokenId: onchain.badgeTokenId !== "0" ? onchain.badgeTokenId : null,
    badgeTxHash: onchain.badgeTxHash,
    legacyCompletionId: completion.id,
  });

  await triggerReferralOnFirstActivity(user.id);
  await markStreakDay(user.id);
  await evaluateQuests(user.id);

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

// ─── New course tables ──────────────────────────────────────────────────────

type AuthedUser = { id: string; wallet_address: string };
type CardRow = {
  order_index: number;
  type: string;
  content: Record<string, unknown>;
};

function gradeAnswers(cards: CardRow[], answers: NonNullable<Body["answers"]>) {
  let correct = 0;
  let totalGraded = 0;
  const incorrectCards: number[] = [];
  for (const card of cards) {
    if (UNGRADED_CARD_TYPES.has(card.type)) continue;
    totalGraded++;
    const submitted = answers.find(
      (a) => a.card_index === card.order_index + 1,
    );
    if (submitted && isCardCorrect(card.type, card.content, submitted.answer))
      correct++;
    else incorrectCards.push(card.order_index + 1);
  }
  const threshold = totalGraded > 0 ? Math.ceil(totalGraded * 0.6) : 0;
  return {
    correct,
    totalGraded,
    incorrectCards,
    threshold,
    passed: correct >= threshold,
  };
}

function alreadyComplete(completion: DbSectionCompletion) {
  return NextResponse.json({
    status: "complete",
    already_completed: true,
    completion,
    onchain: {
      badgeTxHash: completion.badge_tx_hash ?? null,
      badgeTokenId: completion.badge_token_id
        ? String(completion.badge_token_id)
        : "0",
      alreadyMinted: true,
      onchainError: null,
    },
  });
}

async function completeSection(
  slug: string,
  user: AuthedUser,
  answers: NonNullable<Body["answers"]>,
  versionId: string | undefined,
) {
  const access = await checkSectionAccess(slug, user.id);
  if (!access.ok) {
    if (access.reason === "not_found") {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    if (access.reason === "not_enrolled") {
      return NextResponse.json(
        { error: "Enrol in this course to complete its lessons." },
        { status: 403 },
      );
    }
    if (access.reason === "daily_limit") {
      return NextResponse.json(
        {
          error:
            "You've finished today's section. The next one opens tomorrow.",
          resets_at: access.resets_at,
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "Complete the earlier module in this track first" },
      { status: 403 },
    );
  }
  if (access.completion) return alreadyComplete(access.completion);

  const served =
    (typeof versionId === "string"
      ? await getServedSectionVersion(slug, versionId)
      : null) ?? (await getPublishedSection(slug));
  if (!served) {
    return NextResponse.json(
      { error: "This section isn't ready yet" },
      { status: 404 },
    );
  }

  const grade = gradeAnswers(served.cards, answers);
  if (!grade.passed) {
    return NextResponse.json({
      status: "incomplete",
      passed: false,
      correct: grade.correct,
      total: grade.totalGraded,
      threshold: grade.threshold,
      incorrect_cards: grade.incorrectCards,
    });
  }

  const onchain: {
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
    invalidateBadges(user.wallet_address);
    onchain.badgeTxHash = result.txHash;
    onchain.badgeTokenId = result.badgeTokenId.toString();
    onchain.alreadyMinted = result.alreadyMinted;
  } catch (err) {
    console.error("[learn complete] badge mint failed", err);
    onchain.onchainError =
      err instanceof Error ? err.message : "Badge mint failed";
  }

  let completion: DbSectionCompletion | null;
  try {
    completion = await insertSectionCompletion({
      userId: user.id,
      sectionId: access.section.id,
      versionId: served.versionId,
      score: grade.totalGraded > 0 ? grade.correct : null,
      badgeTokenId: onchain.badgeTokenId !== "0" ? onchain.badgeTokenId : null,
      badgeTxHash: onchain.badgeTxHash,
    });
  } catch (err) {
    console.error("[learn complete] completion insert failed", err);
    return NextResponse.json(
      { error: "We couldn't save your progress. Please try again.", onchain },
      { status: 500 },
    );
  }

  if (!completion) {
    const recheck = await checkSectionAccess(slug, user.id);
    if (recheck.ok && recheck.completion)
      return alreadyComplete(recheck.completion);
    return NextResponse.json({ error: "Please try again." }, { status: 409 });
  }

  let pointsAwarded = 0;
  let newPointsBalance: number | null = null;
  try {
    const pointsResult = await awardPoints({
      userId: user.id,
      delta: access.section.points_reward,
      source: "module_complete",
      referenceId: slug,
      metadata: {
        section_id: access.section.id,
        quiz_score: grade.correct,
        total_graded: grade.totalGraded,
        flow: "learn_sections",
      },
    });
    
    pointsAwarded = pointsResult.wasNew ? access.section.points_reward : 0;
    newPointsBalance = pointsResult.newBalance;
    await supabaseAdmin
      .from("section_completions")
      .update({ points_awarded: pointsAwarded })
      .eq("id", completion.id);
    completion = { ...completion, points_awarded: pointsAwarded };
  } catch (err) {
    console.error("[learn complete] points award failed", err);
  }

  await mirrorToLegacyCompletion({
    userId: user.id,
    legacyModuleId: access.section.legacy_module_id,
    completion,
  });

  await triggerReferralOnFirstActivity(user.id);
  await markStreakDay(user.id);
  await evaluateQuests(user.id);

  return NextResponse.json({
    status: "complete",
    passed: true,
    correct: grade.correct,
    total: grade.totalGraded,
    points_awarded: pointsAwarded,
    new_points_balance: newPointsBalance,
    completion,
    onchain,
  });
}
