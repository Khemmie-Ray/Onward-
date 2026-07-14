import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { awardDailyLoginBonus } from "@/lib/server/daily-login";

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const result = await awardDailyLoginBonus(user.id);

  return NextResponse.json(result);
}