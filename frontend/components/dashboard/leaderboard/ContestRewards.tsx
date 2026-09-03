"use client";

import { useEffect, useState } from "react";
import { Loader2, Gift, Trophy, ExternalLink } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type RewardRow = {
  contest_slug: string;
  contest_title: string;
  amount_g: number;
  rank: number | null;
  tx_hash: string | null;
  paid_at: string;
};

type RewardsResponse = {
  rewards: RewardRow[];
  summary: { total_g: number; contests_won: number; best_rank: number | null };
};

export function ContestRewards() {
  const authFetch = useAuthFetch();
  const [data, setData] = useState<RewardsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/contest/my-rewards");
        const json = (await res.json()) as RewardsResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled)
          setData({
            rewards: [],
            summary: { total_g: 0, contests_won: 0, best_rank: null },
          });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  if (isLoading) {
    return (
      <div className="py-10 flex items-center justify-center text-fg-soft">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  const rewards = data?.rewards ?? [];
  const summary = data?.summary;

  if (rewards.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-mustard/15">
          <Gift size={20} strokeWidth={2.5} className="text-mustard" />
        </div>
        <p className="text-sm text-fg-soft max-w-65 mx-auto leading-relaxed">
          No contest rewards yet. Place in a contest and your winnings show up
          here, verifiable on-chain.
        </p>
      </div>
    );
  }

  return (
    <div>
      {summary && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryStat
            label="Total won"
            value={`${summary.total_g.toLocaleString()} G$`}
            highlight
          />
          <SummaryStat label="Contests" value={summary.contests_won} />
          <SummaryStat
            label="Best rank"
            value={summary.best_rank ? `#${summary.best_rank}` : "—"}
          />
        </div>
      )}
      <div className="mt-4 space-y-2">
        {rewards.map((r, i) => (
          <div
            key={`${r.contest_slug}-${i}`}
            className="flex items-center gap-3 rounded-2xl bg-canvas-warm px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mustard/20">
              <Trophy size={15} strokeWidth={2.5} className="text-mustard" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-indigo">
                {r.contest_title}
              </div>
              <div className="text-[11px] text-fg-soft">
                {r.rank ? `Rank #${r.rank} · ` : ""}
                {new Date(r.paid_at).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-bold text-forest tabular-nums">
                +{r.amount_g.toLocaleString()} G$
              </div>
              {r.tx_hash && (
                <a
                  href={`https://celoscan.io/tx/${r.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-fg-soft hover:text-indigo"
                >
                  Proof <ExternalLink size={9} strokeWidth={2.5} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3 text-center ${
        highlight ? "bg-forest/10" : "bg-canvas-warm"
      }`}
    >
      <div
        className={`display text-[17px] font-bold tabular-nums ${
          highlight ? "text-forest" : "text-indigo"
        }`}
      >
        {value}
      </div>
      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft mt-0.5">
        {label}
      </div>
    </div>
  );
}
