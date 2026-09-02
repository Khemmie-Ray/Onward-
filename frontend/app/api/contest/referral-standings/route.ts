import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data: contest } = await supabaseAdmin
      .from("contest_config")
      .select("starts_at, ends_at, type, status")
      .eq("type", "referral")
      .neq("status", "draft")
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!contest) return NextResponse.json({ standings: [] });

    const startIso = contest.starts_at as string;
    const endIso = contest.ends_at as string;
    if (new Date().toISOString() < startIso) {
      return NextResponse.json({ standings: [] });
    }

    const { data: referred, error } = await supabaseAdmin
      .from("users")
      .select("id, referred_by_user_id, contest_qualified, created_at")
      .not("referred_by_user_id", "is", null);
    if (error) throw error;
    if (!referred || referred.length === 0) {
      return NextResponse.json({ standings: [] });
    }

    const agg = new Map<string, { invited: number; qualified: number }>();
    for (const u of referred) {
      const ref = u.referred_by_user_id as string;
      const e = agg.get(ref) ?? { invited: 0, qualified: 0 };
      const createdAt = u.created_at as string;
      const signedUpInWindow = createdAt >= startIso && createdAt <= endIso;
      if (signedUpInWindow) e.invited += 1;
      if (u.contest_qualified === true) e.qualified += 1;
      agg.set(ref, e);
    }

    const qualifiedReferrerIds = Array.from(agg.entries())
      .filter(([, c]) => c.qualified > 0)
      .map(([id]) => id);
    if (qualifiedReferrerIds.length === 0) {
      return NextResponse.json({ standings: [] });
    }

    const { data: referrers } = await supabaseAdmin
      .from("users")
      .select("id, display_name, wallet_address")
      .in("id", qualifiedReferrerIds);
    const info = new Map(
      (referrers ?? []).map((r) => [
        r.id as string,
        {
          name: (r.display_name as string) ?? "Anonymous",
          wallet: (r.wallet_address as string) ?? "",
        },
      ]),
    );

    const standings = qualifiedReferrerIds
      .map((id) => {
        const c = agg.get(id)!;
        const i = info.get(id);
        return {
          referrer_id: id,
          name: i?.name ?? "Anonymous",
          wallet: shortWallet(i?.wallet ?? ""),
          invited: c.invited,
          qualified: c.qualified,
        };
      })
      .sort((a, b) => b.qualified - a.qualified || b.invited - a.invited)
      .slice(0, 50);

    return NextResponse.json({ standings });
  } catch (err) {
    console.error("[referral standings]", err);
    return NextResponse.json(
      { standings: [], error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}

function shortWallet(w: string): string {
  const addr = w.split(":").pop() ?? w;
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
