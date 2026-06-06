import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isValidAvatarId } from "@/constants/avatars";

const NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

type Body = {
  display_name?: string;
  avatar_id?: string;
};

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.display_name?.trim();
  const avatarId = body.avatar_id;

  const isFirstTime = !user.display_name;
  if (isFirstTime && !name) {
    return NextResponse.json({ error: "Display name is required" }, { status: 400 });
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

  if (isFirstTime && !avatarId) {
    return NextResponse.json({ error: "Avatar is required" }, { status: 400 });
  }
  if (avatarId && !isValidAvatarId(avatarId)) {
    return NextResponse.json({ error: "Invalid avatar selection" }, { status: 400 });
  }

  const update: { display_name?: string; avatar_id?: string } = {};
  if (name) update.display_name = name;
  if (avatarId) update.avatar_id = avatarId;

  const { error } = await supabaseAdmin
    .from("users")
    .update(update)
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Name is already taken" }, { status: 409 });
    }
    console.error("[profile/username] update failed:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}