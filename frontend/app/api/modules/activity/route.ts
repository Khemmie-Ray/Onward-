import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { loadUserModuleActivity } from "@/lib/data/activity";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const activity = await loadUserModuleActivity(user.id);
  return NextResponse.json({ activity });
}