import { NextResponse } from "next/server";
import { getAuthedAddress } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function GET(request: Request) {
  // Read from session — first-time users have no DB row yet.
  const walletAddress = await getAuthedAddress();
  if (!walletAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();

  if (!name) {
    return NextResponse.json(
      { available: false, reason: "Name is required" },
      { status: 400 }
    );
  }

  if (name.length < 2 || name.length > 20) {
    return NextResponse.json({
      available: false,
      reason: "Display name must be 2–20 characters",
    });
  }

  if (!NAME_REGEX.test(name)) {
    return NextResponse.json({
      available: false,
      reason: "Letters, numbers, _ or - only",
    });
  }

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("wallet_address")
    .eq("display_name", name)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ available: true });
  }

  if (existing.wallet_address === walletAddress) {
    return NextResponse.json({ available: true, current: true });
  }

  return NextResponse.json({
    available: false,
    reason: "Name is already taken",
  });
}