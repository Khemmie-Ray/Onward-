import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { evaluateMilestones } from "@/lib/server/milestone-rewards";

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const milestones = await evaluateMilestones(user.id as string);
    return NextResponse.json({ milestones });
  } catch (err) {
    console.error("[milestones] load failed", err);
    return NextResponse.json(
      { error: "We couldn't load your milestones. Please try again." },
      { status: 500 },
    );
  }
}
