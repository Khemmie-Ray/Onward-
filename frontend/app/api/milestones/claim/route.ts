import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { claimMilestone } from "@/lib/server/milestone-rewards";

type Body = { milestone_id?: string };

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as Body | null;
  const milestoneId = body?.milestone_id?.trim();
  if (!milestoneId) {
    return NextResponse.json(
      { error: "Missing milestone_id" },
      { status: 400 },
    );
  }

  try {
    const result = await claimMilestone(user.id as string, milestoneId);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }
    return NextResponse.json({ ok: true, points: result.points });
  } catch (err) {
    console.error("[milestones/claim] failed", err);
    return NextResponse.json(
      { error: "We couldn't claim this milestone. Please try again." },
      { status: 500 },
    );
  }
}
