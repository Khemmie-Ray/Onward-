import { Avatar } from "./Avatar";

export type RankEntry = {
  rank: number;
  name: string;
  score: number;
  isViewer?: boolean;
};

export function RankList({
  entries,
  scoreLabel = "score",
}: {
  entries: RankEntry[];
  scoreLabel?: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-[20px] bg-paper p-8 text-center text-[13px] text-fg-soft shadow-[0_6px_24px_rgba(31,58,110,0.06)]">
        No more players to show.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] bg-paper shadow-[0_6px_24px_rgba(31,58,110,0.06)]">
      <ul>
        {entries.map((e, i) => (
          <li
            key={e.rank}
            className={`flex items-center gap-3 px-4 py-3.5 ${
              i > 0 ? "border-t border-canvas-warm" : ""
            } ${e.isViewer ? "bg-mustard/10" : ""}`}
          >
            <span className="w-5 shrink-0 text-[14px] font-bold text-indigo/50 tabular-nums">
              {e.rank}
            </span>
            <Avatar name={e.name} size={34} />
            <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-indigo">
              {e.name}
            </span>
            <span className="shrink-0 text-right leading-tight">
              <span className="block text-[14px] font-bold text-indigo tabular-nums">
                {e.score.toLocaleString()}
              </span>
              <span className="block text-[10px] font-semibold text-indigo/40">
                {scoreLabel}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
