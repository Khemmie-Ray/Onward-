"use client";

import { PlayerHole } from "./PlayerHole";
import type { LeaderboardEntry } from "./type";

const DESKTOP_POSITIONS: Record<
  number,
  { top: string; left: string; size: "large" | "medium" | "small" | "xs" }
> = {
  1: { top: "50%", left: "50%", size: "large" },
  2: { top: "48%", left: "22%", size: "medium" },
  3: { top: "48%", left: "78%", size: "medium" },
  4: { top: "18%", left: "35%", size: "small" },
  5: { top: "18%", left: "65%", size: "small" },
  6: { top: "82%", left: "32%", size: "small" },
  7: { top: "82%", left: "68%", size: "small" },
  8: { top: "20%", left: "10%", size: "xs" },
  9: { top: "20%", left: "90%", size: "xs" },
  10: { top: "85%", left: "50%", size: "xs" },
};

export function PlayerGrid({ entries }: { entries: LeaderboardEntry[] }) {
  const top10 = entries.filter((e) => e.rank <= 10);

  if (top10.length === 0) {
    return (
      <div className="py-16 text-center text-fg-soft text-sm">
        No passing rounds yet this week. Be the first onto the board.
      </div>
    );
  }

  return (
    <>
      <div
        className="hidden lg:block md:block relative w-full"
        style={{ height: "560px" }}
      >
        {top10.map((entry) => {
          const pos = DESKTOP_POSITIONS[entry.rank];
          if (!pos) return null;
          return (
            <div
              key={entry.user_id}
              className="absolute"
              style={{
                top: pos.top,
                left: pos.left,
                transform: "translate(-50%, -50%)",
              }}
            >
              <PlayerHole
                entry={entry}
                size={pos.size}
                isCenter={entry.rank === 1}
              />
            </div>
          );
        })}
      </div>
      <div className="md:hidden lg:hidden flex flex-col items-center gap-8 py-4">
        {top10[0] && <PlayerHole entry={top10[0]} size="large" isCenter />}
        {(top10[1] || top10[2]) && (
          <div className="flex items-start gap-8">
            {top10[1] && <PlayerHole entry={top10[1]} size="medium" />}
            {top10[2] && <PlayerHole entry={top10[2]} size="medium" />}
          </div>
        )}

        {top10.length > 3 && (
          <div className="grid grid-cols-3 gap-5 w-full place-items-center">
            {top10.slice(3).map((entry) => (
              <PlayerHole
                key={entry.user_id}
                entry={entry}
                size={entry.rank <= 7 ? "small" : "xs"}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
