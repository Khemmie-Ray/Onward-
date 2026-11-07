import { Avatar } from "./Avatar";

export function YouRankCard({
  name,
  rank,
  points,
  gapToTop10,
  progress,
  metricLabel = "points",
}: {
  name: string;
  rank: number;
  points: number;
  gapToTop10: number;
  progress: number;
  metricLabel?: string;
}) {
  const unranked = rank <= 0;
  const inTop10 = !unranked && rank <= 10;

  return (
    <div className="rounded-[22px] bg-[#1C133D] p-5">
      <div className="flex items-center gap-3">
        <Avatar name={name || "You"} size={40} tone="bg-mustard text-indigo" />
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#5EC48A]">
            You
          </div>
          <div className="truncate text-[14px] font-bold text-paper">
            {name}
          </div>
        </div>
      </div>

      <div className="mt-4 display text-[40px] font-bold leading-none text-[#5EC48A]">
        {unranked ? "Unranked" : `#${rank}`}
      </div>
      <div className="mt-2 text-[13px] font-semibold text-paper/80 tabular-nums">
        {points.toLocaleString()} {metricLabel} this week
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper/15">
        <div
          className="h-full rounded-full bg-[#5EC48A] transition-all"
          style={{
            width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`,
          }}
        />
      </div>

      <div className="mt-2 text-[12px] font-medium text-paper/60">
        {unranked
          ? "Play a round this week to get ranked."
          : inTop10
            ? "You're in the top 10. Keep it up!"
            : `${gapToTop10.toLocaleString()} ${metricLabel} to the top 10`}
      </div>
    </div>
  );
}
