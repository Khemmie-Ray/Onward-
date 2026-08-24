import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getPlayStandings,
  findRank,
  contestIsOver,
  CONTEST_SLUG,
  CONTEST_START,
  CONTEST_END,
  PLAY_SCORE,
  type PlayRow,
} from "@/lib/contest/contest";

export const revalidate = 60;

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  const user = "error" in auth ? null : auth.user;

  let rows: PlayRow[];
  let frozen = false;

  try {
    if (contestIsOver()) {
      const { data } = await supabaseAdmin
        .from("contest_snapshot")
        .select("*")
        .eq("contest_slug", CONTEST_SLUG)
        .eq("board", "play")
        .order("rank", { ascending: true });

      if (data && data.length > 0) {
        frozen = true;
        rows = data.map((r) => ({
          user_id: r.user_id as string,
          display_name: r.display_name as string,
          wallet_address: r.wallet_address as string,
          premium_rounds: (r.rounds as number) ?? 0,
          premium_passed: (r.rounds_passed as number) ?? 0,
          free_rounds: 0,
          points: (r.total_points as number) ?? 0,
        }));
      } else {
        rows = await getPlayStandings();
      }
    } else {
      rows = await getPlayStandings();
    }
  } catch (err) {
    console.error("[contest leaderboard]", err);
    return NextResponse.json(
      { error: "Failed to load contest leaderboard" },
      { status: 500 },
    );
  }

  type PayoutRow = {
    user_id: string | null;
    wallet_address: string;
    amount_g: number | string;
    tx_hash: string | null;
  };
  let payoutRows: PayoutRow[] = [];
  try {
    const { data } = await supabaseAdmin
      .from("contest_payouts")
      .select("user_id, wallet_address, amount_g, tx_hash")
      .eq("contest_slug", CONTEST_SLUG)
      .eq("board", "play");
    payoutRows = (data ?? []) as PayoutRow[];
  } catch (err) {
    console.error("[contest leaderboard] payouts read", err);
  }

  const payoutByUser = new Map<string, PayoutRow>();
  const payoutByWallet = new Map<string, PayoutRow>();
  for (const p of payoutRows) {
    if (p.user_id) payoutByUser.set(p.user_id, p);
    if (p.wallet_address) {
      payoutByWallet.set(p.wallet_address.toLowerCase(), p);
    }
  }
  const findPayout = (r: PlayRow): PayoutRow | undefined =>
    payoutByUser.get(r.user_id) ??
    (r.wallet_address
      ? payoutByWallet.get(r.wallet_address.toLowerCase())
      : undefined);

  const published = payoutRows.length > 0;
  const firstTx = payoutRows.find((p) => p.tx_hash)?.tx_hash ?? null;
  const totalPaid = payoutRows.reduce((s, p) => s + Number(p.amount_g), 0);

  return NextResponse.json({
    contest_slug: CONTEST_SLUG,
    board: "play",
    window: {
      start: CONTEST_START.toISOString(),
      end: CONTEST_END.toISOString(),
      is_over: contestIsOver(),
    },
    frozen,
    scoring: PLAY_SCORE,
    signed_in: Boolean(user),
    total_entrants: rows.length,
    my_rank: user ? findRank(rows, user.id) : null,
    my_points: user
      ? (rows.find((r) => r.user_id === user.id)?.points ?? 0)
      : 0,
    payout: {
      published,
      recipients: payoutRows.length,
      total_g: totalPaid,
      tx_hash: firstTx,
    },
    leaderboard: rows.slice(0, 50).map((r, i) => {
      const p = findPayout(r);
      return {
        rank: i + 1,
        display_name: r.display_name,
        premium_rounds: r.premium_rounds,
        premium_passed: r.premium_passed,
        points: r.points,
        is_me: user ? r.user_id === user.id : false,
        wallet_address: published ? (r.wallet_address || null) : null,
        payout_g: p ? Number(p.amount_g) : null,
        tx_hash: p?.tx_hash ?? null,
      };
    }),
  });
}