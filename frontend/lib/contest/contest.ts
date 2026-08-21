import { supabaseAdmin } from "@/lib/supabase/admin";

export const CONTEST_SLUG = "2026-08-17";
export const CONTEST_START = new Date("2026-08-17T00:00:00Z");
export const CONTEST_END = new Date("2026-08-23T23:59:59Z");

export const BOARDS = ["play"] as const;
export type Board = (typeof BOARDS)[number];

export const PLAY_SCORE = {
  premiumRound: 100, // per premium round submitted
  premiumPassed: 50, // extra when the round was passed
} as const;

const startIso = () => CONTEST_START.toISOString();
const endIso = () => CONTEST_END.toISOString();

export type PlayRow = {
  user_id: string;
  display_name: string;
  wallet_address: string;
  premium_rounds: number;
  premium_passed: number;
  free_rounds: number;
  points: number;
};

type UserRow = {
  id: string;
  display_name: string | null;
  wallet_address: string | null;
  is_verified: boolean | null;
};

type SessionRow = {
  user_id: string;
  mode: string | null;
  passed: boolean | null;
};

async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown }>,
): Promise<T[]> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const res = await build(from, from + PAGE - 1);
    const rows = (res?.data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
    if (out.length > 500_000) break;
  }
  return out;
}

// ─────────────────────────── THE BOARD ───────────────────────────

export async function getPlayStandings(): Promise<PlayRow[]> {
  const [users, sessions] = await Promise.all([
    fetchAll<UserRow>((from, to) =>
      supabaseAdmin
        .from("users")
        .select("id, display_name, wallet_address, is_verified")
        .range(from, to),
    ),
    fetchAll<SessionRow>((from, to) =>
      supabaseAdmin
        .from("game_sessions")
        .select("user_id, mode, passed")
        .eq("status", "submitted")
        .gte("completed_at", startIso())
        .lte("completed_at", endIso())
        .range(from, to),
    ),
  ]);

  const userMap = new Map<string, UserRow>(users.map((u) => [u.id, u]));

  type Tally = { premium: number; premiumPassed: number; free: number };
  const tally = new Map<string, Tally>();
  const get = (id: string): Tally => {
    const existing = tally.get(id);
    if (existing) return existing;
    const t: Tally = { premium: 0, premiumPassed: 0, free: 0 };
    tally.set(id, t);
    return t;
  };

  for (const s of sessions) {
    const t = get(s.user_id);
    if (s.mode === "premium") {
      t.premium += 1;
      if (s.passed) t.premiumPassed += 1;
    } else {
      t.free += 1;
    }
  }

  const rows: PlayRow[] = [];

  for (const [userId, t] of tally) {
    const user = userMap.get(userId);
    if (!user) continue;

    if (user.is_verified !== true) continue;

    if (t.premium < 1) continue;

    const points =
      t.premium * PLAY_SCORE.premiumRound +
      t.premiumPassed * PLAY_SCORE.premiumPassed;

    rows.push({
      user_id: userId,
      display_name: user.display_name ?? "Unknown",
      wallet_address: user.wallet_address ?? "",
      premium_rounds: t.premium,
      premium_passed: t.premiumPassed,
      free_rounds: t.free,
      points,
    });
  }

  return rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.premium_passed !== a.premium_passed) {
      return b.premium_passed - a.premium_passed;
    }
    return b.premium_rounds - a.premium_rounds;
  });
}

// ─────────────────────────── HELPERS ───────────────────────────

export function findRank<T extends { user_id: string }>(
  rows: T[],
  userId: string,
): number | null {
  const idx = rows.findIndex((r) => r.user_id === userId);
  return idx >= 0 ? idx + 1 : null;
}

export function contestIsOver(): boolean {
  return Date.now() >= CONTEST_END.getTime();
}

// ─────────────────────────── FREEZING ───────────────────────────

export async function freezeContest(): Promise<{ play: number }> {
  const play = await getPlayStandings();

  const rows = play.map((r, i) => ({
    contest_slug: CONTEST_SLUG,
    board: "play",
    rank: i + 1,
    user_id: r.user_id,
    display_name: r.display_name,
    wallet_address: r.wallet_address,
    rounds: r.premium_rounds,
    rounds_passed: r.premium_passed,
    total_points: r.points,
  }));

  // Clears only this contest's rows: earlier contests are untouched.
  await supabaseAdmin
    .from("contest_snapshot")
    .delete()
    .eq("contest_slug", CONTEST_SLUG);

  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from("contest_snapshot").insert(rows);
    if (error) throw new Error(`freeze failed: ${error.message}`);
  }

  return { play: rows.length };
}

export async function getFrozenBoard(board: Board = "play") {
  const { data } = await supabaseAdmin
    .from("contest_snapshot")
    .select("*")
    .eq("contest_slug", CONTEST_SLUG)
    .eq("board", board)
    .order("rank", { ascending: true });
  return data ?? [];
}

export async function alreadyPaid(board: Board = "play"): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from("contest_payouts")
    .select("id", { count: "exact", head: true })
    .eq("contest_slug", CONTEST_SLUG)
    .eq("board", board);
  return (count ?? 0) > 0;
}
