import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/server/point";
import { PAYOUTS_BY_RANK, TOP_PAID_RANK } from "@/lib/leaderboard";
import {
  getPreviousPeriodStart,
  getPeriodStart,
  getWeekSlug,
} from "@/lib/leaderboard-period";
import {
  getWeeklyQuestStandings,
  QUEST_PAYOUTS_BY_RANK,
  QUEST_TOP_PAID_RANK,
} from "@/lib/quest-leaderboard";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periodStart = getPreviousPeriodStart();
  const periodEnd = getPeriodStart(); 

  const periodStartStr = periodStart.toISOString().slice(0, 10);
  const periodEndStr = periodEnd.toISOString().slice(0, 10);
  const weekSlug = getWeekSlug(periodStart);

  const questBoard = await payQuestBoard(
    periodStart,
    periodStartStr,
    periodEndStr,
    weekSlug,
  );

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
      quest_board: questBoard,
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
    quest_board: questBoard,
  });
}

type PayoutResult = {
  user_id: string;
  rank: number;
  points?: number;
  status: "awarded" | "already_awarded" | "failed";
  error?: string;
};

async function payQuestBoard(
  periodStart: Date,
  periodStartStr: string,
  periodEndStr: string,
  weekSlug: string,
): Promise<{ results: PayoutResult[]; error?: string }> {
  let standings;
  try {
    // Any date inside the closed week resolves to that week's standings.
    standings = await getWeeklyQuestStandings(periodStart);
  } catch (err) {
    console.error("[quest board payout] standings failed", err);
    return {
      results: [],
      error: err instanceof Error ? err.message : "unknown",
    };
  }

  const results: PayoutResult[] = [];
  const winners = standings.slice(0, QUEST_TOP_PAID_RANK);

  for (const [index, w] of winners.entries()) {
    const rank = index + 1;
    const points = QUEST_PAYOUTS_BY_RANK[rank] ?? 0;
    if (points === 0) continue;

    try {
      const result = await awardPoints({
        userId: w.user_id,
        delta: points,
        source: "leaderboard_quests",
        referenceId: `leaderboard_quests:${periodStartStr}`,
        metadata: {
          rank,
          quest_points: w.quest_points,
          period_start: periodStartStr,
          period_end: periodEndStr,
          week_slug: weekSlug,
        },
      });
      results.push(
        result.wasNew
          ? { user_id: w.user_id, rank, points, status: "awarded" }
          : { user_id: w.user_id, rank, status: "already_awarded" },
      );
    } catch (err) {
      console.error(`[quest board payout] failed for ${w.user_id}`, err);
      results.push({
        user_id: w.user_id,
        rank,
        status: "failed",
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return { results };
}
