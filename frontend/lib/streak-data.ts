import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Address } from "viem";
import {
  freezesOwnedOnchain,
  consumeFreezeOnchain,
} from "@/lib/onchain/streak";

function ymd(d: Date): string {
  const c = new Date(d);
  c.setUTCHours(0, 0, 0, 0);
  return c.toISOString().slice(0, 10);
}

async function applyFreezesToGaps(userId: string): Promise<string[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const yesterdayStr = ymd(yesterday);

  const { data: rows } = await supabaseAdmin
    .from("streak_days")
    .select("day")
    .eq("user_id", userId)
    .eq("passed", true)
    .order("day", { ascending: false })
    .limit(400);
  if (!rows || rows.length === 0) return [];

  const passed = new Set(rows.map((r) => r.day as string));

  if (passed.has(yesterdayStr)) return [];

  const missedRun: string[] = [];
  const cursor = new Date(yesterday);

  for (let i = 0; i < 60; i++) {
    const ds = ymd(cursor);
    if (passed.has(ds)) break; // hit the live part of the streak; stop
    missedRun.push(ds);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  if (missedRun.length === 0) return [];

  const oldestMissed = missedRun[missedRun.length - 1];
  const beforeRun = new Date(oldestMissed + "T00:00:00Z");
  beforeRun.setUTCDate(beforeRun.getUTCDate() - 1);
  if (!passed.has(ymd(beforeRun))) return [];

  const { data: u } = await supabaseAdmin
    .from("users")
    .select("wallet_address")
    .eq("id", userId)
    .maybeSingle();
  const wallet = (u?.wallet_address as string | undefined)
    ?.split(":")
    .pop()
    ?.toLowerCase();
  if (!wallet) return [];

  let owned: bigint;
  try {
    owned = await freezesOwnedOnchain(wallet as Address);
  } catch (e) {
    console.error("[freeze] owned read failed", e);
    return [];
  }
  if (owned === 0n) return [];

  if (missedRun.length > Number(owned)) return [];

  const toBridge = [...missedRun].reverse();

  const bridged: string[] = [];
  for (const day of toBridge) {
    let before: bigint;
    try {
      before = await freezesOwnedOnchain(wallet as Address);
    } catch (e) {
      console.error("[freeze] pre-consume read failed", e);
      break;
    }
    if (before === 0n) break;

    try {
      await consumeFreezeOnchain(wallet as Address);
    } catch (e) {
      console.error("[freeze] consume failed", e);
      break;
    }

    let after: bigint;
    try {
      after = await freezesOwnedOnchain(wallet as Address);
    } catch (e) {
      console.error("[freeze] post-consume read failed", e);
      break;
    }
    if (after >= before) {
      console.error("[freeze] consume did not decrement; not bridging", {
        day,
        before: before.toString(),
        after: after.toString(),
      });
      break;
    }

    const { error: bridgeErr } = await supabaseAdmin.from("streak_days").upsert(
      {
        user_id: userId,
        day,
        passed: true,
        rounds_played: 0,
        source: "freeze",
      },
      { onConflict: "user_id,day" },
    );
    if (bridgeErr) {
      console.error("[freeze] bridge upsert failed", {
        day,
        error: bridgeErr.message,
      });
      break;
    }
    bridged.push(day);
  }

  if (bridged.length > 0 && bridged.length < toBridge.length) {
    console.error("[freeze] partial bridge; streak still broken", {
      userId,
      bridged,
      needed: toBridge,
    });
  }

  if (bridged.length > 0) {
    await recomputeUserStreak(userId);
  }
  return bridged;
}

export async function applyFreezesAndReport(userId: string): Promise<string[]> {
  return applyFreezesToGaps(userId);
}

export async function markStreakDay(userId: string): Promise<void> {
  await applyFreezesToGaps(userId);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dayStr = today.toISOString().slice(0, 10);

  const { data: existing } = await supabaseAdmin
    .from("streak_days")
    .select("*")
    .eq("user_id", userId)
    .eq("day", dayStr)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("streak_days")
      .update({
        passed: true,
        rounds_played: (existing.rounds_played ?? 0) + 1,
        source: "played",
      })
      .eq("user_id", userId)
      .eq("day", dayStr);
  } else {
    await supabaseAdmin.from("streak_days").insert({
      user_id: userId,
      day: dayStr,
      passed: true,
      rounds_played: 1,
      source: "played",
    });
  }

  await recomputeUserStreak(userId);
}

export async function recomputeUserStreak(userId: string): Promise<void> {
  const { data: days } = await supabaseAdmin
    .from("streak_days")
    .select("day, passed")
    .eq("user_id", userId)
    .eq("passed", true)
    .order("day", { ascending: false });

  if (!days || days.length === 0) return;

  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const row of days) {
    const expected = new Date(today);
    expected.setUTCDate(today.getUTCDate() - streak);
    if (row.day === expected.toISOString().slice(0, 10)) streak++;
    else break;
  }

  const { data: u } = await supabaseAdmin
    .from("users")
    .select("longest_streak")
    .eq("id", userId)
    .single();

  const longestStreak = Math.max(u?.longest_streak ?? 0, streak);

  await supabaseAdmin
    .from("users")
    .update({ current_streak: streak, longest_streak: longestStreak })
    .eq("id", userId);
}

export async function computeLiveStreak(userId: string): Promise<number> {
  await applyFreezesToGaps(userId);

  const { data: days } = await supabaseAdmin
    .from("streak_days")
    .select("day")
    .eq("user_id", userId)
    .eq("passed", true)
    .order("day", { ascending: false })
    .limit(400);
  if (!days || days.length === 0) return 0;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const ymdLocal = (d: Date) => d.toISOString().slice(0, 10);

  const todayStr = ymdLocal(today);
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const yesterdayStr = ymdLocal(yesterday);

  const mostRecent = days[0].day as string;
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) return 0;

  const set = new Set(days.map((d) => d.day as string));
  let streak = 0;
  const cursor = new Date(mostRecent + "T00:00:00Z");
  while (set.has(ymdLocal(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
