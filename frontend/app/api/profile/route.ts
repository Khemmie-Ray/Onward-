import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { loadProfileData } from "@/lib/data/profile";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const data = await loadProfileData(auth.user);
  return NextResponse.json(data);
}