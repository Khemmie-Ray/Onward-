"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import type {
  LeaderboardEntry,
  LeaderboardResponse,
} from "@/components/dashboard/leaderboard/type";
import { PanelCard, PanelCardHeader } from "./PanelCard";

const TOP_N = 3;

export function LeaderboardCard() {
  const authFetch = useAuthFetch();

  const { data, isLoading, isError } = useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", "current", "top", TOP_N],
    queryFn: async () => {
      const res = await authFetch(
        `/api/leaderboard/current?limit=${TOP_N}&offset=0`,
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const entries = data?.entries ?? [];
  const viewer = data?.viewer ?? null;
  const viewerInTop = viewer !== null && viewer.rank <= TOP_N;

  return (
    <PanelCard variant="aubergine">
      <PanelCardHeader title="Leaderboard" meta="This week" />

      {isLoading ? (
        <div className="flex justify-center py-4 text-fg-soft">
          <Loader2 size={16} className="animate-spin" />
        </div>
      ) : isError ? (
        <p className="py-2 text-[12px] text-fg-soft">
          Couldn&apos;t load the leaderboard.
        </p>
      ) : entries.length === 0 ? (
        <p className="py-2 text-[12px] leading-snug text-fg-soft">
          No passing rounds yet this week. Win one to take the top spot.
        </p>
      ) : (
        <>
          <div className="mb-1 flex justify-end text-[9.5px] font-semibold uppercase tracking-[0.08em] text-fg-dim">
            Correct
          </div>
          <ul className="flex flex-col gap-1">
            {entries.map((e) => (
              <Row key={e.user_id} entry={e} highlight={e.is_viewer} />
            ))}
          </ul>
        </>
      )}

      {!isLoading && !isError && !viewerInTop && (
        <div className="mt-1">
          {viewer ? (
            <ul>
              <Row entry={viewer} highlight />
            </ul>
          ) : (
            <div className="rounded-xl bg-blue px-3 py-2 text-[11.5px] text-paper">
              <span className="font-bold">You</span>
              <span className="text-paper/70">
                {" "}
                · win a round this week to get ranked
              </span>
            </div>
          )}
        </div>
      )}

      <Link
        href="/board"
        className="mt-3 block text-[12px] font-semibold text-blue underline underline-offset-2"
      >
        See the full leaderboard
      </Link>
    </PanelCard>
  );
}

function Row({
  entry,
  highlight,
}: {
  entry: LeaderboardEntry;
  highlight: boolean;
}) {
  const name = highlight ? "You" : displayName(entry);

  if (highlight) {
    return (
      <li className="flex list-none items-center gap-3 rounded-xl bg-blue px-2 py-2 text-[12.5px] text-paper">
        <RankDot rank={entry.rank} viewer />
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <span className="font-bold tabular-nums">
          {entry.correct_whacks.toLocaleString()}
        </span>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-1 py-1.5 text-[12.5px] text-blue">
      <RankDot rank={entry.rank} />
      <span className="min-w-0 flex-1 truncate" title={name}>
        {name}
      </span>
      <span className="font-bold tabular-nums">
        {entry.correct_whacks.toLocaleString()}
      </span>
    </li>
  );
}

function RankDot({ rank, viewer = false }: { rank: number; viewer?: boolean }) {
  const tone = viewer
    ? "bg-forest text-paper"
    : rank === 1
      ? "bg-mustard text-blue"
      : "bg-paper text-blue";
  return (
    <span
      className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-bold tabular-nums ${tone}`}
    >
      {rank}
    </span>
  );
}

function displayName(e: LeaderboardEntry): string {
  if (e.display_name && e.display_name !== "Unknown") return e.display_name;
  if (e.wallet_address) {
    const a = e.wallet_address.split(":").pop() ?? e.wallet_address;
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
  }
  return "Player";
}
