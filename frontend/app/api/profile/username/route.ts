import { NextResponse } from "next/server";
import { getAuthedAddress } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isValidAvatarId } from "@/constants/avatars";
import { attributeReferral } from "@/lib/server/referral";

const NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

type Body = {
  display_name?: string;
  avatar_id?: string;
  referral_code?: string | null;
};

export async function POST(request: Request) {
  // Read wallet directly from SIWE session — no DB row required yet.
  // This is the legitimate "first time we see this user" event.
  const walletAddress = await getAuthedAddress();
  if (!walletAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const name = body.display_name?.trim();
  const avatarId = body.avatar_id;
  const referralCode = body.referral_code ?? null;

  // Look up existing row (may not exist for first-time SIWE users)
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id, display_name, avatar_id")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  const isFirstTime = !existingUser?.display_name;

  if (isFirstTime && !name) {
    return NextResponse.json(
      { error: "Display name is required" },
      { status: 400 }
    );
  }
  if (isFirstTime && !avatarId) {
    return NextResponse.json(
      { error: "Avatar is required" },
      { status: 400 }
    );
  }

  if (name !== undefined && name !== null) {
    if (name.length < 2 || name.length > 20) {
      return NextResponse.json(
        { error: "Display name must be 2–20 characters" },
        { status: 400 }
      );
    }
    if (!NAME_REGEX.test(name)) {
      return NextResponse.json(
        { error: "Letters, numbers, _ or - only" },
        { status: 400 }
      );
    }
  }

  if (avatarId && !isValidAvatarId(avatarId)) {
    return NextResponse.json(
      { error: "Invalid avatar selection" },
      { status: 400 }
    );
  }

  // Track the user id so we can attribute the referral after the row exists
  let userId: string | null = existingUser?.id ?? null;

  // Branch: update existing row OR insert new row
  if (existingUser) {
    const update: { display_name?: string; avatar_id?: string } = {};
    if (name) update.display_name = name;
    if (avatarId) update.avatar_id = avatarId;

    const { error } = await supabaseAdmin
      .from("users")
      .update(update)
      .eq("id", existingUser.id);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Name is already taken" },
          { status: 409 }
        );
      }
      console.error("[profile/username] update failed:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
  } else {
    const { data: inserted, error } = await supabaseAdmin
      .from("users")
      .insert({
        wallet_address: walletAddress,
        display_name: name,
        avatar_id: avatarId,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Name is already taken" },
          { status: 409 }
        );
      }
      console.error("[profile/username] insert failed:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    userId = inserted?.id ?? null;
  }

  let referralAttributed = false;
  if (userId && referralCode) {
    try {
      const result = await attributeReferral(userId, referralCode);
      referralAttributed = result.attributed;
    } catch (err) {
      console.error("[profile/username] referral attribution failed:", err);
    }
  }

  return NextResponse.json({ ok: true, referral_attributed: referralAttributed });
}