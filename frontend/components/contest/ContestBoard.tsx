"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Target } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type Row = {
  rank: number;
  display_name: string;
  premium_rounds: number;
  premium_passed: number;
  points: number;
  is_me: boolean;
};

type Response = {
  window: { start: string; end: string; is_over: boolean };
  frozen: boolean;
  total_entrants: number;
  my_rank: number | null;
  my_points: number;
  leaderboard: Row[];
};

export function ContestBoard() {
  const authFetch = useAuthFetch();

  const { data, isLoading } = useQuery<Response>({
    queryKey: ["contest", "leaderboard"],
    queryFn: async () => {
      const res = await authFetch("/api/contest/leaderboard");
      if (!res.ok) throw new Error("Failed to load leaderboard");
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-[20px] bg-paper p-10 text-[13px] text-fg-soft">
        <Loader2 size={15} className="animate-spin" strokeWidth={2.5} />
        Loading the leaderboard…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[20px] bg-paper p-8 text-center text-[13px] text-fg-soft">
        Couldn&apos;t load the leaderboard. Pull to refresh.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-terracotta">
          {data.window.is_over ? "Contest closed" : "Contest live"}
        </span>
        <h2 className="display mt-1 text-[24px] font-bold text-indigo">
          Whack-a-Scam leaderboard
        </h2>
        <p className="mt-1 text-[12px] text-fg-soft">
          {formatWindow(data.window.start, data.window.end)}
        </p>
      </header>

      {data.my_rank !== null && (
        <div className="flex items-center justify-between rounded-2xl bg-indigo px-4 py-3">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-mustard">
              Your position
            </div>
            <div className="display text-[20px] font-bold text-paper">
              #{data.my_rank}
              <span className="ml-1.5 text-[12px] font-semibold text-paper/60">
                of {data.total_entrants}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-mustard">
              Points
            </div>
            <div className="display text-[20px] font-bold tabular-nums text-paper">
              {data.my_points.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-2xl bg-canvas-warm px-4 py-3">
        <Target
          size={15}
          strokeWidth={2.5}
          className="mt-0.5 shrink-0 text-terracotta"
        />
        <p className="text-[11.5px] leading-relaxed text-fg-soft">
          This week is about Play.{" "}
          <span className="font-bold text-indigo">100 points</span> for every
          premium round you stake and complete, plus{" "}
          <span className="font-bold text-indigo">50</span> more when you pass
          it. Verified players only.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-paper shadow-[0_6px_20px_rgba(31,58,110,0.06)]">
        {data.leaderboard.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-fg-soft">
            No premium rounds played yet this week. Be the first.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-canvas-warm">
                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft">
                  #
                </th>
                <th className="px-2 py-2.5 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft">
                  Player
                </th>
                <th className="px-2 py-2.5 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft">
                  Rounds
                </th>
                <th className="px-3 py-2.5 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.map((row) => {
                const medal =
                  row.rank === 1
                    ? "🥇"
                    : row.rank === 2
                      ? "🥈"
                      : row.rank === 3
                        ? "🥉"
                        : null;
                return (
                  <tr
                    key={`${row.rank}-${row.display_name}`}
                    className={`border-b border-canvas-warm/60 last:border-0 ${
                      row.is_me ? "bg-mustard/10" : ""
                    }`}
                  >
                    <td className="px-3 py-3 text-[13px] font-bold text-indigo">
                      {medal ?? row.rank}
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-[13px] font-bold text-indigo">
                        {row.display_name}
                        {row.is_me && (
                          <span className="ml-1.5 text-[10px] font-semibold text-terracotta">
                            you
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-fg-soft">
                        {row.premium_passed} of {row.premium_rounds} passed
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right text-[13px] font-semibold text-indigo tabular-nums">
                      {row.premium_rounds}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="display text-[15px] font-bold text-terracotta tabular-nums">
                        {row.points.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatWindow(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  };
  const s = new Date(startIso).toLocaleDateString(undefined, opts);
  const e = new Date(endIso).toLocaleDateString(undefined, opts);
  return `${s} to ${e}`;
}
