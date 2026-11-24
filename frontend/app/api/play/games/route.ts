import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";

type GameStatus = "available" | "coming_soon";

type GameCard = {
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  status: GameStatus;
  seconds_per_round: number | null;
  holes: number | null;
  difficulty: number | null;
};

const GAMES: GameCard[] = [
  {
    slug: "whack-a-scam",
    title: "Whack-a-Scam",
    description: "Scammers pop up next to real messages. Whack only the fakes.",
    icon: "target",
    status: "available",
    seconds_per_round: 60,
    holes: 6,
    difficulty: 3,
  },
  {
    slug: "coming-soon",
    title: "New game",
    description:
      "Another way to practise is on the way. We are keeping it a surprise.",
    icon: null,
    status: "coming_soon",
    seconds_per_round: null,
    holes: null,
    difficulty: null,
  },
];

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;

  return NextResponse.json({ games: GAMES });
}
