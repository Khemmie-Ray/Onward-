import { NextResponse } from "next/server";
import { type Address, keccak256, toBytes, parseUnits } from "viem";
import onwardBadgesAbi from "@/constants/abis/abi.json";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { publicClient, walletClient } from "@/lib/onchain/badges";

const PAYOUTS_BY_RANK: Record<number, number> = {
  1: 80,
  2: 40,
  3: 40,
  4: 20,
  5: 20,
  6: 20,
  7: 20,
  8: 20,
  9: 20,
  10: 20,
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periodEnd = new Date();
  periodEnd.setUTCHours(0, 0, 0, 0);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);

  const periodStartStr = periodStart.toISOString().slice(0, 10);
  const periodEndStr = periodEnd.toISOString().slice(0, 10);

  const { data: sessions } = await supabaseAdmin
    .from("game_sessions")
    .select("user_id, correct_whacks")
    .eq("status", "submitted")
    .eq("passed", true)
    .gte("completed_at", periodStart.toISOString())
    .lt("completed_at", periodEnd.toISOString());

  const stats = new Map<string, number>();
  for (const s of sessions ?? []) {
    stats.set(s.user_id, (stats.get(s.user_id) ?? 0) + (s.correct_whacks ?? 0));
  }

  const top10 = Array.from(stats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([user_id], idx) => ({ user_id, rank: idx + 1 }));

  if (top10.length === 0) {
    return NextResponse.json({
      message: "No players this period",
      period_start: periodStartStr,
      period_end: periodEndStr,
    });
  }

  const userIds = top10.map((p) => p.user_id);
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, wallet_address")
    .in("id", userIds);

  const walletMap = new Map((users ?? []).map((u) => [u.id, u.wallet_address as Address]));

  const results = [];
  for (const player of top10) {
    const amount = PAYOUTS_BY_RANK[player.rank] ?? 0;
    if (amount === 0) continue;

    const wallet = walletMap.get(player.user_id);
    if (!wallet) {
      results.push({ user_id: player.user_id, rank: player.rank, status: "no_wallet" });
      continue;
    }

    const { data: existing } = await supabaseAdmin
      .from("leaderboard_payouts")
      .select("id")
      .eq("user_id", player.user_id)
      .eq("period_start", periodStartStr)
      .maybeSingle();

    if (existing) {
      results.push({ user_id: player.user_id, rank: player.rank, status: "already_paid" });
      continue;
    }

    const claimId = keccak256(
      toBytes(`${wallet.toLowerCase()}:leaderboard:${periodStartStr}`)
    );

    try {
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.onwardBadges,
        abi: onwardBadgesAbi,
        functionName: "distribute",
        args: [wallet, parseUnits(amount.toString(), 18), claimId],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      await supabaseAdmin.from("leaderboard_payouts").insert({
        user_id: player.user_id,
        rank: player.rank,
        period_start: periodStartStr,
        period_end: periodEndStr,
        amount_g: amount,
        tx_hash: txHash,
      });

      results.push({
        user_id: player.user_id,
        rank: player.rank,
        amount,
        tx_hash: txHash,
        status: "paid",
      });
    } catch (err) {
      console.error(`[leaderboard payout failed for ${player.user_id}]`, err);
      results.push({
        user_id: player.user_id,
        rank: player.rank,
        status: "failed",
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    period_start: periodStartStr,
    period_end: periodEndStr,
    results,
  });
}