import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(_request: Request) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: sessions, error } = await supabaseAdmin
    .from("game_sessions")
    .select("user_id, correct_whacks, mode")
    .eq("status", "submitted")
    .eq("passed", true)
    .gte("completed_at", sevenDaysAgo.toISOString());

  if (error) {
    console.error("[leaderboard sessions]", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 },
    );
  }

  const stats = new Map<
    string,
    {
      user_id: string;
      correct_whacks: number;
      rounds: number;
      premium_rounds: number;
    }
  >();

  for (const s of sessions ?? []) {
    const existing = stats.get(s.user_id) ?? {
      user_id: s.user_id,
      correct_whacks: 0,
      rounds: 0,
      premium_rounds: 0,
    };
    existing.correct_whacks += s.correct_whacks ?? 0;
    existing.rounds += 1;
    if (s.mode === "premium") existing.premium_rounds += 1;
    stats.set(s.user_id, existing);
  }

  const top10 = Array.from(stats.values())
    .sort((a, b) => b.correct_whacks - a.correct_whacks)
    .slice(0, 10);

  if (top10.length === 0) {
    return NextResponse.json({
      leaderboard: [],
      period: { start: sevenDaysAgo.toISOString() },
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
      primary_mode: s.premium_rounds > s.rounds / 2 ? "premium" : "free",
    };
  });

  return NextResponse.json({
    leaderboard,
    period: {
      start: sevenDaysAgo.toISOString(),
      end: new Date().toISOString(),
    },
  });
}
