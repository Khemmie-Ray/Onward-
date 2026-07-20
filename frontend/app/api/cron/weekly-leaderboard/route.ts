import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/server/point";
import { PAYOUTS_BY_RANK, TOP_PAID_RANK } from "@/lib/leaderboard";
import {
  getPreviousPeriodStart,
  getPeriodStart,
  getWeekSlug,
} from "@/lib/leaderboard-period";

/**
 * Weekly leaderboard payout.
 *
 * Winners are awarded POINTS (not G$). They convert points to G$ themselves
 * once verified, which keeps this route off-chain: no gas, no tx failures,
 * no per-winner RPC verification check. Unverified winners simply hold points
 * they cannot convert yet, which is itself the verification incentive.
 *
 * Idempotent: reference_id is keyed to the period, so re-running the cron for
 * the same week is a no-op (award_points rejects the duplicate).
 *
 * Ranking uses the same rule as every other leaderboard surface: correct_whacks
 * over the period, passed rounds only. Payout amounts come from lib/leaderboard
 * so the cron can never drift from what the UI advertises.
 */

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pay the PREVIOUS full week. Run this at/after the Monday boundary: "now"
  // is in the new period, so the previous period is the week that just closed.
  const periodStart = getPreviousPeriodStart();
  const periodEnd = getPeriodStart(); // start of current = end of previous

  const periodStartStr = periodStart.toISOString().slice(0, 10);
  const periodEndStr = periodEnd.toISOString().slice(0, 10);
  const weekSlug = getWeekSlug(periodStart);

  // Standings for the CLOSED period (not the rolling window the UI shows).
  const { data: sessions, error: sessErr } = await supabaseAdmin
    .from("game_sessions")
    .select("user_id, correct_whacks")
    .eq("status", "submitted")
    .eq("passed", true)
    .gte("completed_at", periodStart.toISOString())
    .lt("completed_at", periodEnd.toISOString());

  if (sessErr) {
    console.error("[leaderboard payout] sessions query failed", sessErr);
    return NextResponse.json(
      { error: "Failed to load sessions" },
      { status: 500 },
    );
  }

  const totals = new Map<string, number>();
  for (const s of sessions ?? []) {
    totals.set(
      s.user_id,
      (totals.get(s.user_id) ?? 0) + (s.correct_whacks ?? 0),
    );
  }

  const winners = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_PAID_RANK)
    .map(([user_id, correct_whacks], idx) => ({
      user_id,
      correct_whacks,
      rank: idx + 1,
    }));

  if (winners.length === 0) {
    return NextResponse.json({
      message: "No players this period",
      period_start: periodStartStr,
      period_end: periodEndStr,
    });
  }

  const results: Array<{
    user_id: string;
    rank: number;
    points?: number;
    status: string;
    error?: string;
  }> = [];

  let totalPointsAwarded = 0;

  for (const w of winners) {
    const points = PAYOUTS_BY_RANK[w.rank] ?? 0;
    if (points === 0) continue;

    // Idempotency key: one award per user, per period, per source.
    const referenceId = `leaderboard:${periodStartStr}`;

    try {
      const result = await awardPoints({
        userId: w.user_id,
        delta: points,
        source: "leaderboard_weekly",
        referenceId,
        metadata: {
          rank: w.rank,
          correct_whacks: w.correct_whacks,
          period_start: periodStartStr,
          period_end: periodEndStr,
          week_slug: weekSlug,
        },
      });

      if (result.wasNew) {
        totalPointsAwarded += points;
        results.push({
          user_id: w.user_id,
          rank: w.rank,
          points,
          status: "awarded",
        });
      } else {
        results.push({
          user_id: w.user_id,
          rank: w.rank,
          status: "already_awarded",
        });
      }
    } catch (err) {
      console.error(`[leaderboard payout] failed for ${w.user_id}`, err);
      results.push({
        user_id: w.user_id,
        rank: w.rank,
        status: "failed",
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  // Record the period so the public stats card can report cumulative totals.
  // Idempotent via a unique (period_start) constraint — see migration.
  const awardedCount = results.filter((r) => r.status === "awarded").length;
  if (awardedCount > 0) {
    const { error: periodErr } = await supabaseAdmin
      .from("leaderboard_periods")
      .upsert(
        {
          period_start: periodStartStr,
          period_end: periodEndStr,
          week_slug: weekSlug,
          winners_count: awardedCount,
          points_awarded: totalPointsAwarded,
        },
        { onConflict: "period_start" },
      );
    if (periodErr) {
      console.error("[leaderboard payout] period record failed", periodErr);
    }
  }

  return NextResponse.json({
    period_start: periodStartStr,
    period_end: periodEndStr,
    week_slug: weekSlug,
    winners_awarded: awardedCount,
    total_points_awarded: totalPointsAwarded,
    results,
  });
}
