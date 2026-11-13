import { Sparkle } from "lucide-react";

export function ChampionsHero({
  title = "Join the champions.",
  subtitle = "Participate in daily tasks or quests to earn a spot.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-[22px] bg-linear-to-br from-[#6FCB97] to-[#4FA87A] px-6 py-7 sm:px-8 flex items-center justify-between">
      <div className="lg:w-[48%] md:w-[48%] w-full">
        <h2 className="font-display lg:text-[42px] font-bold leading-[1.05] tracking-[-0.015em] text-indigo text-[24px]">
          {title}
        </h2>
        <p className="mt-2 text-[13px] font-medium text-indigo/75">
          {subtitle}
        </p>
      </div>
      <div className="lg:w-[38%] md:w-[38%] w-full">
        <PodiumArt />
      </div>
    </div>
  );
}

function PodiumArt() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/hero-champions.svg"
      alt="hero image for leaderboard champions"
      aria-hidden
      className="drop-shadow-[0_8px_12px_rgba(0,0,0,0.22)]"
    />
  );
}
