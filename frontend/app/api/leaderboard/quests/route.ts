import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { getQuestLeaderboard } from "@/lib/quest-leaderboard";

/** This week's quest leaderboard (top 50) plus the viewer's own rank. */
export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const board = await getQuestLeaderboard(user.id as string, 50);
    return NextResponse.json(board);
  } catch (err) {
    console.error("[leaderboard/quests] load failed", err);
    return NextResponse.json(
      { error: "We couldn't load the quest board. Please try again." },
      { status: 500 },
    );
  }
}
