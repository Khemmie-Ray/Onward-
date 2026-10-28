"use client";

import { motion } from "framer-motion";
import { Pencil, Bell, Lock } from "lucide-react";

export type GameCard = {
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  status: "available" | "coming_soon";
  seconds_per_round: number | null;
  holes: number | null;
  difficulty: number | null;
};


const COMING_SOON_ART = "/images/play-coming-soon.svg";
const GAME_ART: Record<string, string> = {
  "whack-a-scam": "/images/play-whack.svg",
};

const EASE = [0.22, 1, 0.36, 1] as const;

export const GameCardView = ({
  game,
  onOpen,
  index = 0,
}: {
  game: GameCard;
  onOpen: () => void;
  index?: number;
}) => {
  const isComingSoon = game.status === "coming_soon";
  const art = isComingSoon ? COMING_SOON_ART : GAME_ART[game.slug];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: EASE }}
      whileHover={isComingSoon ? undefined : { y: -4 }}
      className={`group flex flex-col overflow-hidden rounded-[20px] ${
        isComingSoon
          ? "border-2 border-dashed border-indigo/20 bg-white/50"
          : "bg-white shadow-[0_6px_24px_rgba(31,58,110,0.10)] transition-shadow hover:shadow-[0_14px_38px_rgba(31,58,110,0.16)]"
      }`}
    >
      <div className="relative aspect-16/10 overflow-hidden bg-[#2A1F52]">
        {art && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={art}
            alt={game.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}

        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isComingSoon ? "bg-indigo/85 text-paper" : "bg-forest text-paper"
          }`}
        >
          {isComingSoon ? (
            <>
              <Lock size={11} strokeWidth={2.6} />
              Coming soon
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-paper" />
              Live
            </>
          )}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="display text-[18px] font-bold leading-tight text-indigo">
          {game.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-snug text-fg-soft">
          {game.description}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat
            value={isComingSoon ? "??" : `${game.seconds_per_round}s`}
            label="per round"
          />
          <Stat
            value={isComingSoon ? "??" : String(game.holes)}
            label={isComingSoon ? "players" : "holes"}
          />
          <DifficultyStat
            difficulty={game.difficulty}
            comingSoon={isComingSoon}
          />
        </div>

        <div className="mt-4">
          {isComingSoon ? (
            <button
              type="button"
              onClick={onOpen}
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-indigo/20 py-2.5 text-[13px] font-bold text-indigo transition hover:border-indigo/40 hover:bg-canvas-warm"
            >
              <Bell size={14} strokeWidth={2.6} />
              Notify me
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-terracotta py-2.5 text-[13.5px] font-bold text-paper shadow-[0_4px_0_0_#7d3420] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_2px_0_0_#7d3420]"
            >
              <Pencil size={14} strokeWidth={2.8} />
              Play now
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-canvas-warm/70 px-2 py-2 text-center">
      <div className="text-[15px] font-bold tabular-nums text-indigo">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-semibold text-fg-soft">
        {label}
      </div>
    </div>
  );
}

function DifficultyStat({
  difficulty,
  comingSoon,
}: {
  difficulty: number | null;
  comingSoon: boolean;
}) {
  return (
    <div className="rounded-xl bg-canvas-warm/70 px-2 py-2 text-center">
      <div className="flex h-[18px] items-center justify-center gap-1">
        {comingSoon ? (
          <span className="text-[15px] font-bold text-indigo">??</span>
        ) : (
          [1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i <= (difficulty ?? 0) ? "bg-terracotta" : "bg-indigo/15"
              }`}
            />
          ))
        )}
      </div>
      <div className="mt-0.5 text-[10px] font-semibold text-fg-soft">
        {comingSoon ? "difficulty" : `difficulty ${difficulty}`}
      </div>
    </div>
  );
}
