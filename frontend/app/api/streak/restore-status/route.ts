import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { freezesOwnedOnchain } from "@/lib/onchain/streak";
import type { Address } from "viem";

const FIRST_PRICE = 100;
const SUBSEQUENT_PRICE = 200;

const RESTORE_WINDOW_DAYS = 1;

function dayStr(d: Date): string {
  const c = new Date(d);
  c.setUTCHours(0, 0, 0, 0);
  return c.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const windowStart = new Date(today);
  windowStart.setUTCDate(today.getUTCDate() - (RESTORE_WINDOW_DAYS + 2));

  const { data: recentDays } = await supabaseAdmin
    .from("streak_days")
    .select("day")
    .eq("user_id", user.id)
    .eq("passed", true)
    .gte("day", dayStr(windowStart))
    .order("day", { ascending: false });

  const passed = new Set((recentDays ?? []).map((r) => r.day as string));

  const missedDays: string[] = [];
  for (let i = 1; i <= RESTORE_WINDOW_DAYS; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const ds = dayStr(d);
    if (!passed.has(ds)) missedDays.push(ds);
  }

  const earliestMissed = missedDays[missedDays.length - 1];
  let restorable = false;
  if (earliestMissed) {
    const before = new Date(earliestMissed + "T00:00:00Z");
    before.setUTCDate(before.getUTCDate() - 1);
    restorable = passed.has(dayStr(before));
  }

  if (!restorable) {
    return NextResponse.json({ restorable: false });
  }

  const wallet = (user.wallet_address as string | undefined)
    ?.split(":")
    .pop()
    ?.toLowerCase();
  if (wallet) {
    try {
      const owned = await freezesOwnedOnchain(wallet as Address);
      if (owned > 0n) {
        return NextResponse.json({
          restorable: false,
          covered_by_freeze: true,
        });
      }
    } catch (e) {
      console.error("[restore-status] freeze read failed", e);
    }
  }

  const { count: prior } = await supabaseAdmin
    .from("spend_events")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", user.id)
    .eq("category", "streak_repair");
  const price = (prior ?? 0) === 0 ? FIRST_PRICE : SUBSEQUENT_PRICE;

  return NextResponse.json({
    restorable: true,
    missed_days: missedDays,
    price,
    current_streak: user.current_streak ?? 0,
  });
}
