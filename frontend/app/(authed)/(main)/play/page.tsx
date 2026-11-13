"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  GameCardView,
  type GameCard,
} from "@/components/dashboard/play/GameCardView";
import { PlayHero } from "@/components/dashboard/play/PlayHero";

export default function PlayPage() {
  const authFetch = useAuthFetch();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["play", "games"],
    queryFn: async () => {
      const res = await authFetch("/api/play/games");
      if (!res.ok) throw new Error("Failed to load games");
      return res.json() as Promise<{ games: GameCard[] }>;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-fg-soft" />
      </div>
    );
  }

  const openGame = (game: GameCard) => {
    if (game.status === "coming_soon") return;
    router.push(`/play/${game.slug}`);
  };

  const liveCount = data.games.filter((g) => g.status === "available").length;

  return (
    <div className="">
     
      <PlayHero />

      <div className="mb-4 mt-8">
        <h2 className="display text-[22px] font-semibold text-indigo">
          All games
        </h2>
        <span className="text-[12px] text-fg-soft">
          {liveCount} live · more on the way
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.games.map((game, i) => (
          <GameCardView
            key={game.slug}
            game={game}
            index={i}
            onOpen={() => openGame(game)}
          />
        ))}
      </div>
    </div>
  );
}
