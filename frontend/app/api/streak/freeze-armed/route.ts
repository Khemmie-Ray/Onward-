import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { freezesOwnedOnchain } from "@/lib/onchain/streak";
import type { Address } from "viem";

function dayStr(d: Date): string {
  const c = new Date(d);
  c.setUTCHours(0, 0, 0, 0);
  return c.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const wallet = (user.wallet_address as string | undefined)
    ?.split(":")
    .pop()
    ?.toLowerCase();
  if (!wallet)
    return NextResponse.json({ error: "No wallet on file" }, { status: 400 });

  let owned: bigint;
  try {
    owned = await freezesOwnedOnchain(wallet as Address);
  } catch (e) {
    console.error("[freeze-armed] owned read failed", e);
    return NextResponse.json(
      { error: "Couldn't confirm your freeze, try again." },
      { status: 502 },
    );
  }
  if (owned === 0n)
    return NextResponse.json({ error: "No freeze to arm." }, { status: 400 });

  const today = dayStr(new Date());
  const { error } = await supabaseAdmin
    .from("users")
    .update({ freeze_armed_on: today })
    .eq("id", user.id);
  if (error) {
    console.error("[freeze-armed] update failed", error);
    return NextResponse.json(
      { error: "Couldn't arm the freeze." },
      { status: 500 },
    );
  }

  return NextResponse.json({ armed: true, freeze_armed_on: today });
}
