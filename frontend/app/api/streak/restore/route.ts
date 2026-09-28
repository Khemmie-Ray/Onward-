import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { recomputeUserStreak } from "@/lib/streak-data";
import { publicClient } from "@/lib/onchain/badges";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";
import { parseAbiItem } from "viem";

const CLAIMS_CONTRACT = CONTRACT_ADDRESSES.onwardClaims;

const RESTORE_EVENT = parseAbiItem(
  "event StreakRestorePaid(address indexed user, uint256 price, uint256 restoreNumber)",
);

const FIRST_PRICE = 100;
const SUBSEQUENT_PRICE = 200;
const GD_DECIMALS = 18n;
const RESTORE_WINDOW_DAYS = 2;

function dayStr(d: Date): string {
  const c = new Date(d);
  c.setUTCHours(0, 0, 0, 0);
  return c.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  let body: { txHash?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { txHash } = body;
  if (!txHash) {
    return NextResponse.json({ error: "Missing txHash" }, { status: 400 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const windowStart = new Date(today);
  windowStart.setUTCDate(today.getUTCDate() - (RESTORE_WINDOW_DAYS + 1));

  const { data: recentDays } = await supabaseAdmin
    .from("streak_days")
    .select("day")
    .eq("user_id", user.id)
    .eq("passed", true)
    .gte("day", dayStr(windowStart))
    .order("day", { ascending: false });

  const passedSet = new Set((recentDays ?? []).map((r) => r.day as string));

  const missedDays: string[] = [];
  for (let i = 1; i <= RESTORE_WINDOW_DAYS; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const ds = dayStr(d);
    if (!passedSet.has(ds)) missedDays.push(ds);
  }
  if (missedDays.length === 0) {
    return NextResponse.json(
      { error: "No restorable gap in the last 2 days" },
      { status: 400 },
    );
  }

  const { count: priorRestores } = await supabaseAdmin
    .from("spend_events")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", user.id)
    .eq("category", "streak_repair");
  const price = (priorRestores ?? 0) === 0 ? FIRST_PRICE : SUBSEQUENT_PRICE;
  const expectedAmount = BigInt(price) * 10n ** GD_DECIMALS;

  let verified = false;
  try {
    const { decodeEventLog } = await import("viem");
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });
    const payer = user.wallet_address.split(":").pop()!.toLowerCase();
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== CLAIMS_CONTRACT.toLowerCase()) continue;
      try {
        const ev = decodeEventLog({
          abi: [RESTORE_EVENT],
          data: log.data,
          topics: log.topics,
        });
        const args = ev.args as unknown as {
          user: string;
          price: bigint;
          restoreNumber: bigint;
        };
        if (args.user.toLowerCase() === payer && args.price >= expectedAmount) {
          verified = true;
          break;
        }
      } catch {
        /* not the event we want */
      }
    }
  } catch (err) {
    console.error("[restore-streak] receipt check failed", err);
    return NextResponse.json(
      { error: "Could not verify payment" },
      { status: 502 },
    );
  }

  if (!verified) {
    return NextResponse.json(
      { error: "Payment not verified for this restore" },
      { status: 402 },
    );
  }

  const { data: used } = await supabaseAdmin
    .from("spend_events")
    .select("id")
    .eq("tx_hash", txHash)
    .maybeSingle();
  if (used) {
    return NextResponse.json(
      { error: "This payment was already used" },
      { status: 409 },
    );
  }

  for (const ds of missedDays) {
    await supabaseAdmin
      .from("streak_days")
      .upsert(
        { user_id: user.id, day: ds, passed: true, rounds_played: 0 },
        { onConflict: "user_id,day" },
      );
  }

  await supabaseAdmin.from("spend_events").insert({
    user_id: user.id,
    g_amount: price,
    category: "streak_repair",
    tx_hash: txHash,
    metadata: { bridged_days: missedDays },
  });

  await recomputeUserStreak(user.id);

  return NextResponse.json({ restored: true, bridged_days: missedDays, price });
}
