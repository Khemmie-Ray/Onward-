import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getWeeklyStandings,
  getPeriodStart,
  primaryMode,
} from "@/lib/leaderboard";

export async function GET(_request: Request) {
  let standings;
  try {
    standings = await getWeeklyStandings();
  } catch {
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 },
    );
  }

  const periodStart = getPeriodStart();
  const top10 = standings.slice(0, 10);

  if (top10.length === 0) {
    return NextResponse.json({
      leaderboard: [],
      period: { start: periodStart.toISOString() },
    });
  }

  const userIds = top10.map((s) => s.user_id);
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, display_name, current_level, current_streak")
    .in("id", userIds);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  const leaderboard = top10.map((s, idx) => {
    const user = userMap.get(s.user_id);
    return {
      rank: idx + 1,
      user_id: s.user_id,
      display_name: user?.display_name ?? "Unknown",
      level: user?.current_level ?? 1,
      streak: user?.current_streak ?? 0,
      correct_whacks: s.correct_whacks,
      rounds_played: s.rounds,
      primary_mode: primaryMode(s),
    };
  });

  return NextResponse.json({
    leaderboard,
    period: {
      start: periodStart.toISOString(),
      end: new Date().toISOString(),
    },
  });
}
