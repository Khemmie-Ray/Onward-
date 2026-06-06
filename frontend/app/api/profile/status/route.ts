import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const hasName = Boolean(user.display_name && user.display_name.trim().length > 0);
  const hasAvatar = Boolean(user.avatar_id);

  return NextResponse.json({
    hasUsername: hasName && hasAvatar,
    hasName,
    hasAvatar,
  });
}