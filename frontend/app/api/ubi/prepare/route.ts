import { NextResponse } from "next/server";
import type { Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { topUpUser } from "@/lib/onchain/faucet";

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  if (!user.wallet_address) {
    return NextResponse.json({ error: "No wallet on file" }, { status: 400 });
  }

  try {
    const result = await topUpUser(user.wallet_address as Address);
    return NextResponse.json({
      ready: true,
      topped_up: result.topped,
      tx_hash: result.txHash,
    });
  } catch (err) {
    console.error("[ubi/prepare] top-up failed", err);
    return NextResponse.json({ ready: true, topped_up: false, tx_hash: null });
  }
}
