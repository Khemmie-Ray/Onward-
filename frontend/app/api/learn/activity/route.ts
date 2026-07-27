import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { loadUserModuleActivity } from "@/lib/data/activity";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const activity = await loadUserModuleActivity(auth.user.id);
  return NextResponse.json({ activity });
}