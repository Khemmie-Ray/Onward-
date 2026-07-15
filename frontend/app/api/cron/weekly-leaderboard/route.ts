import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/server/point";
import { PAYOUTS_BY_RANK, TOP_PAID_RANK } from "@/lib/leaderboard";

function isoWeekSlug(d: Date): string {
  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  const weekNumber =
    1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = new Date(firstThursday).getUTCFullYear();
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periodEnd = new Date();
  periodEnd.setUTCHours(0, 0, 0, 0);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);

  const periodStartStr = periodStart.toISOString().slice(0, 10);
  const periodEndStr = periodEnd.toISOString().slice(0, 10);
  const weekSlug = isoWeekSlug(periodStart);

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