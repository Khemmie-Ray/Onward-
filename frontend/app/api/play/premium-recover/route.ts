import { NextResponse } from "next/server";
import { keccak256, toBytes, type Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { whackStakeAbi } from "@/constants/abis";
import { CONTRACT_ADDRESSES } from "@/constants/contracts/address";
import { publicClient, walletClient } from "@/lib/onchain/badges";

type RecoverBody = {
  round_id?: string;
  round_id_hash?: `0x${string}`;
};

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;
  const wallet = user.wallet_address as Address;

  const body = (await request.json().catch(() => null)) as RecoverBody | null;

  try {
    const [activeHash, amount, exists] = (await publicClient.readContract({
      address: CONTRACT_ADDRESSES.whackStake,
      abi: whackStakeAbi,
      functionName: "getActiveStake",
      args: [wallet],
    })) as readonly [`0x${string}`, bigint, boolean];

    if (!exists || amount === 0n) {
      return NextResponse.json(
        { error: "No unresolved stake found for your wallet." },
        { status: 404 },
      );
    }

    const claimed =
      body?.round_id_hash ??
      (body?.round_id ? keccak256(toBytes(body.round_id)) : undefined);

    if (claimed && claimed.toLowerCase() !== activeHash.toLowerCase()) {
      return NextResponse.json(
        { error: "That stake does not match your active stake." },
        { status: 403 },
      );
    }

    const { data: sessions } = await supabaseAdmin
      .from("game_sessions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("mode", "premium")
      .order("started_at", { ascending: false })
      .limit(30);

    const match = (sessions ?? []).find(
      (s) => keccak256(toBytes(s.id)).toLowerCase() === activeHash.toLowerCase(),
    );

    if (match && (match.status === "pending" || match.status === "active")) {
      return NextResponse.json(
        {
          error:
            "This round is still playable. Resume it instead of recovering the stake.",
          resumable: true,
          round_id: match.id,
        },
        { status: 409 },
      );
    }

    const stake = (await publicClient.readContract({
      address: CONTRACT_ADDRESSES.whackStake,
      abi: whackStakeAbi,
      functionName: "stakes",
      args: [activeHash],
    })) as readonly [Address, bigint, boolean];

    if (stake[0].toLowerCase() !== wallet.toLowerCase()) {
      return NextResponse.json(
        { error: "Stake does not belong to your wallet." },
        { status: 403 },
      );
    }
    if (stake[2]) {
      return NextResponse.json(
        { error: "That stake is already resolved." },
        { status: 409 },
      );
    }

    const txHash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.whackStake,
      abi: whackStakeAbi,
      functionName: "resolve",
      args: [activeHash, false],
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (match) {
      await supabaseAdmin
        .from("game_sessions")
        .update({
          status: "expired",
          passed: false,
          completed_at: new Date().toISOString(),
        })
        .eq("id", match.id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      ok: true,
      tx_hash: txHash,
      round_id: match?.id ?? null,
      amount: amount.toString(),
    });
  } catch (err) {
    console.error("[premium-recover] failed", err);
    return NextResponse.json(
      { error: "Could not recover the stake. Please try again." },
      { status: 500 },
    );
  }
}