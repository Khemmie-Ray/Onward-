import { NextResponse } from "next/server";
import { getAuthedAddress } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const walletAddress = await getAuthedAddress();
  if (!walletAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("display_name, avatar_id")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({
      hasUsername: false,
      hasName: false,
      hasAvatar: false,
      avatarId: null,
    });
  }

  const hasName = Boolean(user.display_name?.trim());
  const hasAvatar = Boolean(user.avatar_id);

  return NextResponse.json({
    hasUsername: hasName && hasAvatar,
    hasName,
    hasAvatar,
    avatarId: user.avatar_id ?? null,
  });
}