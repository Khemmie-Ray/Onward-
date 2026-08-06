import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getContestStandings,
  findContestRank,
  CONTEST_START,
  CONTEST_END,
  SCORE,
} from "@/lib/contest/contest";

export const revalidate = 60;

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  const user = "error" in auth ? null : auth.user;

  let standings;
  try {
    standings = await getContestStandings();
  } catch (err) {
    console.error("[contest leaderboard]", err);
    return NextResponse.json(
      { error: "Failed to load contest leaderboard" },
      { status: 500 },
    );
  }

  const top = standings.map((r, idx) => ({
    rank: idx + 1,
    display_name: r.display_name,
    lessons: r.lessons,
    rounds: r.rounds,
    referrals: r.referrals,
    total_points: r.total_points,
    is_me: user ? r.user_id === user.id : false,
  }));

  const myRank = user ? findContestRank(standings, user.id) : null;
  const mine = user
    ? (standings.find((r) => r.user_id === user.id) ?? null)
    : null;

  let meIsVerified = false;
  if (user) {
    const { data: me } = await supabaseAdmin
      .from("users")
      .select("is_verified")
      .eq("id", user.id)
      .maybeSingle();
    meIsVerified = me?.is_verified === true;
  }

  return NextResponse.json({
    period: {
      start: CONTEST_START.toISOString(),
      end: CONTEST_END.toISOString(),
    },
    scoring: {
      verified_bonus: SCORE.verifiedBonus,
      lesson: SCORE.lesson,
      lessons_total_cap: SCORE.lessonsTotalCap,
      round_played: SCORE.roundPlayed,
      claim: SCORE.claim,
      referral: SCORE.referral,
      feedback: SCORE.feedback,
    },
    total_ranked: standings.length,
    leaderboard: top,
    signed_in: Boolean(user),
    me: {
      rank: myRank,
      is_verified: meIsVerified,
      lessons: mine?.lessons ?? 0,
      rounds: mine?.rounds ?? 0,
      rounds_passed: mine?.rounds_passed ?? 0,
      claims: mine?.claims ?? 0,
      referrals: mine?.referrals ?? 0,
      verified_points: mine?.verified_points ?? 0,
      lesson_points: mine?.lesson_points ?? 0,
      round_points: mine?.round_points ?? 0,
      claim_points: mine?.claim_points ?? 0,
      referral_points: mine?.referral_points ?? 0,
      bonus_points: mine?.bonus_points ?? 0,
      total_points: mine?.total_points ?? 0,
    },
  });
}
