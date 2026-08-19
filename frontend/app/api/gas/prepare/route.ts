import { NextResponse } from "next/server";
import type { Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { ensureGas } from "@/lib/onchain/faucet";

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  if (!user.wallet_address) {
    return NextResponse.json({ error: "No wallet on file" }, { status: 400 });
  }

  try {
    const result = await ensureGas(user.wallet_address as Address);

    return NextResponse.json({
      ready: result.ready,
      topped: result.topped,
      reason: result.reason,
      tx_hash: result.txHash,
      balance: result.balance.toString(),
    });
  } catch (err) {
    console.error("[gas/prepare] failed", err);
    // Honest failure: not ready. Caller must not proceed.
    return NextResponse.json(
      {
        ready: false,
        topped: false,
        reason: "faucet_failed",
        tx_hash: null,
        balance: "0",
      },
      { status: 200 },
    );
  }
}
