import { Crown } from "lucide-react";
import { Avatar } from "./Avatar";

export type PodiumEntry = {
  rank: number;
  name: string;
  score: number;
  isViewer?: boolean;
};

export function Podium({
  entries,
  scoreLabel = "score",
}: {
  entries: PodiumEntry[];
  scoreLabel?: string;
}) {
  const byRank = (r: number) => entries.find((e) => e.rank === r);
  return (
    <div className="grid grid-cols-3 items-end gap-2.5 pt-20 sm:gap-3 sm:pt-24">
      <Slot entry={byRank(2)} scoreLabel={scoreLabel} />
      <Slot entry={byRank(1)} scoreLabel={scoreLabel} featured />
      <Slot entry={byRank(3)} scoreLabel={scoreLabel} />
    </div>
  );
}

function Slot({
  entry,
  scoreLabel,
  featured = false,
}: {
  entry?: PodiumEntry;
  scoreLabel: string;
  featured?: boolean;
}) {
  if (!entry) {
    return (
      <div className="h-28 rounded-[22px] border-2 border-dashed border-indigo/10 opacity-60" />
    );
  }

  const isThird = entry.rank === 3;

  const bg = featured
    ? "bg-mustard"
    : entry.rank === 2
      ? "bg-aubergine-tint"
      : "bg-forest-tint";
  const avatarTone =
    entry.rank === 3 ? "bg-forest text-cream" : "bg-indigo text-cream";
  const avatarSize = featured ? 80 : entry.rank === 2 ? 72 : 68;

  const sizing = featured
    ? "pb-6 pt-10 sm:-mt-4 sm:pt-11"
    : isThird
      ? "pb-3 pt-8"
      : "pb-5 pt-9";

  return (
    <div
      className={`relative rounded-[22px] px-3 shadow-[0_6px_24px_rgba(31,58,110,0.08)] sm:px-4 ${bg} ${sizing}`}
    >
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
        {featured && (
          <Crown
            size={22}
            strokeWidth={2.5}
            className="absolute -top-5 left-1/2 -translate-x-1/2 fill-mustard text-mustard"
          />
        )}
        <Avatar
          name={entry.name}
          size={avatarSize}
          tone={avatarTone}
          className="ring-4 ring-canvas"
        />
      </div>

      <div className="flex justify-end">
        <span className="display text-[30px] font-bold leading-none text-indigo/80 sm:text-[38px]">
          {entry.rank}
        </span>
      </div>

      <div className="mt-6 text-center">
        <div className="truncate text-[13px] font-bold text-indigo sm:text-[14px]">
          {entry.name}
        </div>
        <div className="mt-0.5 text-[13px] font-bold text-indigo tabular-nums">
          {entry.score.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
