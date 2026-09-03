import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";


type GameStatus = "available" | "coming_soon";

type GameCard = {
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  status: GameStatus;
};

const GAMES: GameCard[] = [
  {
    slug: "whack-a-scam",
    title: "Whack-a-Scam",
    description:
      "Spot the scam before the timer runs out. A new pattern every day, real rewards for a sharp eye.",
    icon: "target",
    status: "available",
  },
  {
    slug: "coming-soon",
    title: "More games",
    description: null,
    icon: null,
    status: "coming_soon",
  },
];

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;

  return NextResponse.json({ games: GAMES });
}