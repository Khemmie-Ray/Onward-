import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { getQuestsView } from "@/lib/server/quest";

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const view = await getQuestsView(user.id as string);
    return NextResponse.json(view);
  } catch (err) {
    console.error("[quests] load failed", err);
    return NextResponse.json(
      { error: "We couldn't load your quests. Please try again." },
      { status: 500 },
    );
  }
}
