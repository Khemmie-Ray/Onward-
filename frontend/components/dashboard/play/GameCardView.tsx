import Image from "next/image";
import { Lock, Hammer } from "lucide-react";

export type GameCard = {
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  status: "available" | "coming_soon";
};

const HERO_IMAGES: Record<string, string> = {
  "whack-a-scam":
    "https://res.cloudinary.com/dy7el0ucd/image/upload/v1788317802/onward/play-whack_pvbowu.png",
};

export const GameCardView = ({
  game,
  onOpen,
}: {
  game: GameCard;
  onOpen: () => void;
}) => {
  const isComingSoon = game.status === "coming_soon";
  const heroUrl = HERO_IMAGES[game.slug];

  if (isComingSoon) {
    return (
      <div className="rounded-[18px] bg-paper/70 p-5 flex justify-center items-center flex-col">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-canvas-warm/50">
          <Lock size={16} strokeWidth={2.5} className="text-fg-soft/50" />
        </div>
        <div className="display text-[17px] font-semibold text-indigo leading-tight mb-1.5">
          {game.title}
        </div>
        <p className="text-[12px] text-fg-soft leading-snug mb-4">
          Coming soon.
        </p>
        <div className="text-[11px] font-bold uppercase tracking-widest text-fg-soft/40">
          Locked
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-[18px] bg-paper shadow-[0_2px_8px_rgba(31,58,110,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(31,58,110,0.1)]">
      <div className="mb-6 p-3">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt={game.title}
            width={200}
            height={200}
            className="w-[90%] mx-auto transition-transform duration-300 group-hover:scale-[1.04]"
            priority
          />
        )}
        <div className="mt-3">
        <button
          onClick={onOpen}
          className="mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-b from-terracotta to-[#a84730] px-4 py-2.5 text-[16px] font-bold text-cream shadow-[0_4px_0_0_#7d3420] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-[0_2px_0_0_#7d3420] w-full"
        >
          <Hammer
            size={14}
            strokeWidth={2.8}
            className="transition-transform group-hover:-rotate-12"
          />
          Play Now
        </button>
        </div>
      </div>
    </div>
  );
};
