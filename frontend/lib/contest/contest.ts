import { supabaseAdmin } from "@/lib/supabase/admin";

export const CONTEST_START = new Date("2026-08-03T00:00:00Z");
export const CONTEST_END = new Date("2026-08-09T23:59:59Z");

export const SCORE = {
  verifiedBonus: 1000,
  lesson: 200,
  lessonsTotalCap: 5,
  roundPlayed: 100,
  claim: 500,
  claimsTotalCap: 1,
  referral: 500,
  feedback: 1000,
} as const;

export type ContestRow = {
  user_id: string;
  display_name: string;
  wallet_address: string;
  is_verified: boolean;
  lessons: number;
  rounds: number;
  rounds_passed: number;
  claims: number;
  referrals: number;
  verified_points: number;
  lesson_points: number;
  round_points: number;
  claim_points: number;
  referral_points: number;
  bonus_points: number;
  total_points: number;
};

type DayBucket = {
  lessons: number;
  rounds: number;
  passed: number;
  claims: number;
};

function dayKey(iso: string): string {
  return iso.slice(0, 10); 
}

function emptyDay(): DayBucket {
  return { lessons: 0, rounds: 0, passed: 0, claims: 0 };
}

export async function getContestStandings(): Promise<ContestRow[]> {
  const startIso = CONTEST_START.toISOString();
  const endIso = CONTEST_END.toISOString();

  const [lessons, sessions, claims, referrals, users, bonuses] =
    await Promise.all([
      supabaseAdmin
        .from("learn_completions")
        .select("user_id, completed_at")
        .gte("completed_at", startIso)
        .lte("completed_at", endIso),

      supabaseAdmin
        .from("game_sessions")
        .select("user_id, completed_at, passed")
        .eq("status", "submitted")
        .gte("completed_at", startIso)
        .lte("completed_at", endIso),

      supabaseAdmin
        .from("point_claims")
        .select("user_id, created_at")
        .eq("status", "confirmed")
        .gte("created_at", startIso)
        .lte("created_at", endIso),

      supabaseAdmin
        .from("point_transactions")
        .select("user_id, created_at")
        .eq("source", "referral")
        .gte("created_at", startIso)
        .lte("created_at", endIso),

      supabaseAdmin
        .from("users")
        .select("id, display_name, wallet_address, is_verified"),

      supabaseAdmin
        .from("point_transactions")
        .select("user_id, delta, reference_id")
        .eq("source", "manual_adjustment")
        .gte("created_at", startIso)
        .lte("created_at", endIso),
    ]);

  const userMap = new Map((users.data ?? []).map((u) => [u.id as string, u]));

  const perUserDay = new Map<string, Map<string, DayBucket>>();
  const totals = new Map<
    string,
    {
      lessons: number;
      rounds: number;
      passed: number;
      claims: number;
      referrals: number;
    }
  >();

  const bump = (userId: string, iso: string | null, field: keyof DayBucket) => {
    if (!iso) return;
    const days = perUserDay.get(userId) ?? new Map<string, DayBucket>();
    const key = dayKey(iso);
    const bucket = days.get(key) ?? emptyDay();
    bucket[field] += 1;
    days.set(key, bucket);
    perUserDay.set(userId, days);

    const t = totals.get(userId) ?? {
      lessons: 0,
      rounds: 0,
      passed: 0,
      claims: 0,
      referrals: 0,
    };
    if (field === "lessons") t.lessons += 1;
    if (field === "rounds") t.rounds += 1;
    if (field === "passed") t.passed += 1;
    if (field === "claims") t.claims += 1;
    totals.set(userId, t);
  };

  for (const row of lessons.data ?? []) {
    bump(row.user_id as string, row.completed_at as string | null, "lessons");
  }

  for (const row of sessions.data ?? []) {
    const uid = row.user_id as string;
    const iso = row.completed_at as string | null;
    bump(uid, iso, "rounds");
    if (row.passed) bump(uid, iso, "passed");
  }

  for (const row of claims.data ?? []) {
    bump(row.user_id as string, row.created_at as string | null, "claims");
  }

  for (const row of referrals.data ?? []) {
    const uid = row.user_id as string;
    const t = totals.get(uid) ?? {
      lessons: 0,
      rounds: 0,
      passed: 0,
      claims: 0,
      referrals: 0,
    };
    t.referrals += 1;
    totals.set(uid, t);
  }

  const bonusByUser = new Map<string, number>();
  for (const row of bonuses.data ?? []) {
    const ref = String(row.reference_id ?? "");
    if (!ref.toLowerCase().startsWith("contest")) continue;
    const uid = row.user_id as string;
    bonusByUser.set(uid, (bonusByUser.get(uid) ?? 0) + Number(row.delta ?? 0));
  }

  for (const u of users.data ?? []) {
    if (u.is_verified && !totals.has(u.id as string)) {
      totals.set(u.id as string, {
        lessons: 0,
        rounds: 0,
        passed: 0,
        claims: 0,
        referrals: 0,
      });
    }
  }

  const rows: ContestRow[] = [];

  for (const [userId, t] of totals) {
    const user = userMap.get(userId);
    if (!user) continue;

    if (!user.is_verified) continue;

    const lessonPoints =
      Math.min(t.lessons, SCORE.lessonsTotalCap) * SCORE.lesson;

    const roundPoints = t.rounds * SCORE.roundPlayed;

    const claimPoints = Math.min(t.claims, SCORE.claimsTotalCap) * SCORE.claim;

    const referralPoints = t.referrals * SCORE.referral;
    const verifiedPoints = SCORE.verifiedBonus;
    const bonusPoints = bonusByUser.get(userId) ?? 0;

    rows.push({
      user_id: userId,
      display_name: (user.display_name as string) ?? "Unknown",
      wallet_address: (user.wallet_address as string) ?? "",
      is_verified: true,
      lessons: t.lessons,
      rounds: t.rounds,
      rounds_passed: t.passed,
      claims: t.claims,
      referrals: t.referrals,
      verified_points: verifiedPoints,
      lesson_points: lessonPoints,
      round_points: roundPoints,
      claim_points: claimPoints,
      referral_points: referralPoints,
      bonus_points: bonusPoints,
      total_points:
        verifiedPoints +
        lessonPoints +
        roundPoints +
        claimPoints +
        referralPoints +
        bonusPoints,
    });
  }

  return rows.sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points;
    }
    if (b.referrals !== a.referrals) return b.referrals - a.referrals;
    return b.rounds - a.rounds;
  });
}

export function findContestRank(
  rows: ContestRow[],
  userId: string,
): number | null {
  const idx = rows.findIndex((r) => r.user_id === userId);
  return idx >= 0 ? idx + 1 : null;
}
