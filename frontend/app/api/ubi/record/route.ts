import { NextResponse } from "next/server";
import type { Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { recordUbiClaim } from "@/lib/onchain/claims";

type Body = { amount?: string; txRef?: string };

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.amount || !body?.txRef) {
    return NextResponse.json(
      { error: "Missing amount or txRef" },
      { status: 400 },
    );
  }
  if (!user.wallet_address) {
    return NextResponse.json({ error: "No wallet on file" }, { status: 400 });
  }

  try {
    const txHash = await recordUbiClaim({
      userWallet: user.wallet_address as Address,
      amount: BigInt(body.amount),
      txRef: body.txRef as `0x${string}`,
    });
    return NextResponse.json({ recorded: true, tx_hash: txHash });
  } catch (err) {
    console.error("[ubi/record] recordUbiClaim failed", err);
    return NextResponse.json({ recorded: false });
  }
}
