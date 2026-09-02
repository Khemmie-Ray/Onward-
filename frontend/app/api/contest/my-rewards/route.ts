import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RewardRow = {
  contest_slug: string;
  contest_title: string;
  amount_g: number;
  rank: number | null;
  tx_hash: string | null;
  paid_at: string;
};

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const { data: payouts, error } = await supabaseAdmin
      .from("contest_payouts")
      .select("contest_slug, amount_g, rank, tx_hash, paid_at")
      .eq("user_id", user.id)
      .order("paid_at", { ascending: false });
    if (error) throw error;

    if (!payouts || payouts.length === 0) {
      return NextResponse.json({
        rewards: [],
        summary: { total_g: 0, contests_won: 0, best_rank: null },
      });
    }

    const slugs = Array.from(
      new Set(payouts.map((p) => p.contest_slug as string)),
    );
    const { data: configs } = await supabaseAdmin
      .from("contest_config")
      .select("slug, title")
      .in("slug", slugs);
    const titleBySlug = new Map(
      (configs ?? []).map((c) => [c.slug as string, c.title as string]),
    );

    const rewards: RewardRow[] = payouts.map((p) => ({
      contest_slug: p.contest_slug as string,
      contest_title:
        titleBySlug.get(p.contest_slug as string) ?? (p.contest_slug as string),
      amount_g: Number(p.amount_g),
      rank: (p.rank as number | null) ?? null,
      tx_hash: (p.tx_hash as string | null) ?? null,
      paid_at: p.paid_at as string,
    }));

    const total_g = rewards.reduce((s, r) => s + (r.amount_g || 0), 0);
    const ranks = rewards
      .map((r) => r.rank)
      .filter((r): r is number => typeof r === "number");
    const best_rank = ranks.length ? Math.min(...ranks) : null;

    return NextResponse.json({
      rewards,
      summary: {
        total_g,
        contests_won: rewards.length,
        best_rank,
      },
    });
  } catch (err) {
    console.error("[my-rewards]", err);
    return NextResponse.json(
      {
        rewards: [],
        summary: { total_g: 0, contests_won: 0, best_rank: null },
        error: "Failed to load rewards",
      },
      { status: 500 },
    );
  }
}
