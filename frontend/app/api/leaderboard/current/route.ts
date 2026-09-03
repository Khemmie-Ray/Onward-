import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-option";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  PAYOUTS_BY_RANK,
  TOP_PAID_RANK,
  TOTAL_WEEKLY_PRIZE_POOL,
  getWeeklyStandings,
  primaryMode,
} from "@/lib/leaderboard";
import { getPeriodStart, getPeriodEnd } from "@/lib/leaderboard-period";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

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
  const address = (session as { address?: string })?.address;
  if (!address) return null;

  const normalized = address.toLowerCase();
  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id, wallet_address, display_name, current_level, current_streak")
    .eq("wallet_address", normalized)
    .maybeSingle();

  return dbUser ?? null;
}

export async function GET(request: Request) {
  const currentUser = await getOptionalUser();

  const url = new URL(request.url);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? `${DEFAULT_LIMIT}`)),
  );
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0"));

  const periodStart = getPeriodStart();
  const periodEnd = getPeriodEnd();

  let sortedStats;
  try {
    sortedStats = await getWeeklyStandings();
  } catch {
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 },
    );
  }

  const totalPlayers = sortedStats.length;

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
      primary_mode: primaryMode(s),
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
      primary_mode: primaryMode(viewerStats),
      prize_g: PAYOUTS_BY_RANK[viewerRank] ?? 0,
      is_viewer: true,
    };
  }

  let viewerTotalWon = 0;
  if (currentUser) {
    const { data: won } = await supabaseAdmin
      .from("point_transactions")
      .select("delta")
      .eq("user_id", currentUser.id)
      .eq("source", "leaderboard_weekly");
    viewerTotalWon = (won ?? []).reduce(
      (sum, r) => sum + (Number(r.delta) || 0),
      0,
    );
  }

  return NextResponse.json({
    entries,
    viewer,
    viewer_total_won: viewerTotalWon,
    pagination: {
      limit,
      offset,
      total_players: totalPlayers,
      has_more: offset + limit < totalPlayers,
    },
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    prizes: {
      by_rank: PAYOUTS_BY_RANK,
      top_paid_rank: TOP_PAID_RANK,
      total_pool_points: TOTAL_WEEKLY_PRIZE_POOL,
    },
  });
}
