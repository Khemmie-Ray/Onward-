import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const WIN_START = "2026-08-17T00:00:00Z";
const WIN_END = "2026-08-23T23:59:59Z";
const STREAK_REQUIRED = 2;

export async function GET() {
  try {
    const { data: friends, error } = await supabaseAdmin
      .from("users")
      .select("id, referred_by_user_id, is_verified, onward_verified_at")
      .not("referred_by_user_id", "is", null);
    if (error) throw error;
    if (!friends || friends.length === 0) {
      return NextResponse.json({
        standings: [],
        window: { start: WIN_START, end: WIN_END },
      });
    }

    const inWindowVerified = friends.filter(
      (u) =>
        u.is_verified === true &&
        typeof u.onward_verified_at === "string" &&
        u.onward_verified_at >= WIN_START &&
        u.onward_verified_at <= WIN_END,
    );
    if (inWindowVerified.length === 0) {
      return NextResponse.json({
        standings: [],
        window: { start: WIN_START, end: WIN_END },
      });
    }

    const friendIds = inWindowVerified.map((u) => u.id as string);

    const { data: streak, error: sErr } = await supabaseAdmin
      .from("streak_days")
      .select("user_id, day")
      .eq("passed", true)
      .gte("day", WIN_START.slice(0, 10))
      .lte("day", WIN_END.slice(0, 10))
      .in("user_id", friendIds);
    if (sErr) throw sErr;

    const daysByUser = new Map<string, Set<string>>();
    for (const r of streak ?? []) {
      const uid = r.user_id as string;
      const set = daysByUser.get(uid) ?? new Set<string>();
      set.add(r.day as string);
      daysByUser.set(uid, set);
    }

    const agg = new Map<string, number>();
    for (const u of inWindowVerified) {
      const days = daysByUser.get(u.id as string)?.size ?? 0;
      if (days < STREAK_REQUIRED) continue;
      const ref = u.referred_by_user_id as string;
      agg.set(ref, (agg.get(ref) ?? 0) + 1);
    }
    const referrerIds = Array.from(agg.keys());
    if (referrerIds.length === 0) {
      return NextResponse.json({
        standings: [],
        window: { start: WIN_START, end: WIN_END },
      });
    }

    const { data: referrers } = await supabaseAdmin
      .from("users")
      .select("id, display_name, wallet_address")
      .in("id", referrerIds);
    const info = new Map(
      (referrers ?? []).map((r) => [
        r.id as string,
        {
          name: (r.display_name as string) ?? "Anonymous",
          wallet: (r.wallet_address as string) ?? "",
        },
      ]),
    );

    const standings = referrerIds
      .map((id) => {
        const i = info.get(id);
        return {
          referrer_id: id,
          name: i?.name ?? "Anonymous",
          wallet: shortWallet(i?.wallet ?? ""),
          qualified: agg.get(id) ?? 0,
        };
      })
      .sort((a, b) => b.qualified - a.qualified)
      .slice(0, 50);

    return NextResponse.json({
      standings,
      window: { start: WIN_START, end: WIN_END },
    });
  } catch (err) {
    console.error("[past referral standings]", err);
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
