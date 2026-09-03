"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { GameCardView, type GameCard } from "@/components/dashboard/play/GameCardView";

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
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-fg-soft" />
      </div>
    );
  }

  const openGame = (game: GameCard) => {
    if (game.status === "coming_soon") return;
    router.push(`/play/${game.slug}`);
  };

  return (
    <div className="my-4">
      <div className="mb-8 animate-[fade-up_0.6s_ease_both]">
        <h1 className="display text-[28px] font-semibold tracking-[-0.015em] text-indigo mb-1.5">
          Play and earn
        </h1>
        <p className="text-[13.5px] text-fg-soft max-w-[520px]">
          Sharpen your instincts with quick games. Spot scams, keep your streak,
          and earn real rewards for playing well.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-[fade-up_0.7s_0.1s_ease_both]">
        {data.games.map((game) => (
          <GameCardView
            key={game.slug}
            game={game}
            onOpen={() => openGame(game)}
          />
        ))}
      </div>
    </div>
  );
}