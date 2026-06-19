import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-option";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  PAYOUTS_BY_RANK,
  TOP_PAID_RANK,
  TOTAL_WEEKLY_PRIZE_POOL,
  PERIOD_DAYS,
} from "@/lib/leaderboard";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

type AggregatedStats = {
  user_id: string;
  correct_whacks: number;
  rounds: number;
  premium_rounds: number;
};

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  display_name: string;
  wallet_address: string | null;
  level: number;
  streak: number;
  correct_whacks: number;
  rounds_played: number;
  primary_mode: "free" | "premium";
  prize_g: number;
  is_viewer: boolean;
};

async function getOptionalUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const sub = (session as { sub?: string }).sub;
  if (!sub) return null;
  const parts = sub.split(":");
  if (parts.length !== 3) return null;
  const address = parts[2]?.toLowerCase();
  if (!address) return null;

  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id, wallet_address, display_name, current_level, current_streak")
    .ilike("wallet_address", address)
    .maybeSingle();

  return dbUser ?? null;
}

export async function GET(request: Request) {
  // Optional auth — public page visits without session work fine.
  const currentUser = await getOptionalUser();

  const url = new URL(request.url);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? `${DEFAULT_LIMIT}`))
  );
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0"));

  // Period: rolling 7 days (matches the cron's window)
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - PERIOD_DAYS);

  const { data: sessions, error } = await supabaseAdmin
    .from("game_sessions")
    .select("user_id, correct_whacks, mode")
    .eq("status", "submitted")
    .eq("passed", true)
    .gte("completed_at", periodStart.toISOString());

  if (error) {
    console.error("[leaderboard sessions]", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 }
    );
  }

  // Aggregate per user
  const statsMap = new Map<string, AggregatedStats>();
  for (const s of sessions ?? []) {
    const existing = statsMap.get(s.user_id) ?? {
      user_id: s.user_id,
      correct_whacks: 0,
      rounds: 0,
      premium_rounds: 0,
    };
    existing.correct_whacks += s.correct_whacks ?? 0;
    existing.rounds += 1;
    if (s.mode === "premium") existing.premium_rounds += 1;
    statsMap.set(s.user_id, existing);
  }

  const sortedStats = Array.from(statsMap.values()).sort(
    (a, b) => b.correct_whacks - a.correct_whacks
  );
  const totalPlayers = sortedStats.length;

  // Find viewer's rank in the full sorted list (if signed in)
  const viewerIdx = currentUser
    ? sortedStats.findIndex((s) => s.user_id === currentUser.id)
    : -1;
  const viewerStats = viewerIdx >= 0 ? sortedStats[viewerIdx] : null;
  const viewerRank = viewerIdx >= 0 ? viewerIdx + 1 : null;

  const pageSlice = sortedStats.slice(offset, offset + limit);

  const userIdsToFetch = new Set(pageSlice.map((s) => s.user_id));
  if (viewerStats) userIdsToFetch.add(viewerStats.user_id);

  let userMap = new Map<
    string,
    {
      id: string;
      display_name: string | null;
      wallet_address: string | null;
      current_level: number | null;
      current_streak: number | null;
    }
  >();

  if (userIdsToFetch.size > 0) {
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, display_name, wallet_address, current_level, current_streak")
      .in("id", [...userIdsToFetch]);
    userMap = new Map((users ?? []).map((u) => [u.id, u]));
  }

  const entries: LeaderboardEntry[] = pageSlice.map((s, i) => {
    const u = userMap.get(s.user_id);
    const rank = offset + i + 1;
    return {
      rank,
      user_id: s.user_id,
      display_name: u?.display_name ?? "Player",
      wallet_address: u?.wallet_address ?? null,
      level: u?.current_level ?? 1,
      streak: u?.current_streak ?? 0,
      correct_whacks: s.correct_whacks,
      rounds_played: s.rounds,
      primary_mode: s.premium_rounds > s.rounds / 2 ? "premium" : "free",
      prize_g: PAYOUTS_BY_RANK[rank] ?? 0,
      is_viewer: currentUser ? s.user_id === currentUser.id : false,
    };
  });

  let viewer: LeaderboardEntry | null = null;
  if (viewerStats && viewerRank !== null) {
    const u = userMap.get(viewerStats.user_id);
    viewer = {
      rank: viewerRank,
      user_id: viewerStats.user_id,
      display_name: u?.display_name ?? "You",
      wallet_address: u?.wallet_address ?? null,
      level: u?.current_level ?? 1,
      streak: u?.current_streak ?? 0,
      correct_whacks: viewerStats.correct_whacks,
      rounds_played: viewerStats.rounds,
      primary_mode:
        viewerStats.premium_rounds > viewerStats.rounds / 2
          ? "premium"
          : "free",
      prize_g: PAYOUTS_BY_RANK[viewerRank] ?? 0,
      is_viewer: true,
    };
  }

  return NextResponse.json({
    entries,
    viewer,
    pagination: {
      limit,
      offset,
      total_players: totalPlayers,
      has_more: offset + limit < totalPlayers,
    },
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
      days: PERIOD_DAYS,
    },
    prizes: {
      by_rank: PAYOUTS_BY_RANK,
      top_paid_rank: TOP_PAID_RANK,
      total_pool_g: TOTAL_WEEKLY_PRIZE_POOL,
    },
  });
}