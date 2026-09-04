import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-option";

async function getOptionalUser() {
  const session = await getServerSession(authOptions);
  const address = (session as { address?: string })?.address;
  if (!address) return null;
  const { data } = await supabaseAdmin
    .from("users")
    .select("id, display_name, wallet_address")
    .eq("wallet_address", address.toLowerCase())
    .maybeSingle();
  return data ?? null;
}

export async function GET(request: Request) {
  try {
    const { data: contest } = await supabaseAdmin
      .from("contest_config")
      .select("starts_at, ends_at, type, status")
      .eq("type", "referral")
      .neq("status", "draft")
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const viewer = await getOptionalUser();
    if (!contest) return NextResponse.json({ standings: [], viewer: null });

    const startIso = contest.starts_at as string;
    const endIso = contest.ends_at as string;
    if (new Date().toISOString() < startIso) {
      return NextResponse.json({ standings: [], viewer: null });
    }

    const { data: referred, error } = await supabaseAdmin
      .from("users")
      .select("id, referred_by_user_id, contest_qualified")
      .not("referred_by_user_id", "is", null);
    if (error) throw error;
    if (!referred || referred.length === 0) {
      return NextResponse.json({ standings: [] });
    }

    const agg = new Map<string, { invited: number; qualified: number }>();
    for (const u of referred) {
      const ref = u.referred_by_user_id as string;
      const e = agg.get(ref) ?? { invited: 0, qualified: 0 };
      e.invited += 1;
      if (u.contest_qualified === true) e.qualified += 1;
      agg.set(ref, e);
    }

    const rankedIds = Array.from(agg.entries())
      .filter(([, c]) => c.qualified > 0)
      .sort(
        (a, b) =>
          b[1].qualified - a[1].qualified || b[1].invited - a[1].invited,
      )
      .map(([id]) => id);

    const idsToName = new Set(rankedIds.slice(0, 50));
    if (viewer && agg.has(viewer.id as string))
      idsToName.add(viewer.id as string);
    const { data: referrers } = await supabaseAdmin
      .from("users")
      .select("id, display_name, wallet_address")
      .in("id", Array.from(idsToName));
    const info = new Map(
      (referrers ?? []).map((r) => [
        r.id as string,
        {
          name: (r.display_name as string) ?? "Anonymous",
          wallet: (r.wallet_address as string) ?? "",
        },
      ]),
    );

    const standings = rankedIds.slice(0, 50).map((id, idx) => {
      const c = agg.get(id)!;
      const i = info.get(id);
      return {
        rank: idx + 1,
        referrer_id: id,
        name: i?.name ?? "Anonymous",
        wallet: shortWallet(i?.wallet ?? ""),
        invited: c.invited,
        qualified: c.qualified,
        is_viewer: viewer ? id === viewer.id : false,
      };
    });

    let viewerStanding = null;
    if (viewer) {
      const vAgg = agg.get(viewer.id as string) ?? { invited: 0, qualified: 0 };
      const vRankIdx = rankedIds.indexOf(viewer.id as string);
      viewerStanding = {
        rank: vRankIdx >= 0 ? vRankIdx + 1 : null,
        referrer_id: viewer.id as string,
        name: (viewer.display_name as string) ?? "You",
        invited: vAgg.invited,
        qualified: vAgg.qualified,
        total_ranked: rankedIds.length,
      };
    }

    return NextResponse.json({ standings, viewer: viewerStanding });
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
