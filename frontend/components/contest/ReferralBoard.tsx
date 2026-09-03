"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, Trophy, UserPlus } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type Row = {
  rank: number;
  referrer_id: string;
  name: string;
  wallet: string;
  invited: number;
  qualified: number;
  is_viewer: boolean;
};

type ViewerStanding = {
  rank: number | null;
  referrer_id: string;
  name: string;
  invited: number;
  qualified: number;
  total_ranked: number;
} | null;

type Resp = { standings: Row[]; viewer: ViewerStanding };

export function ReferralBoard() {
  const authFetch = useAuthFetch();

  const { data, isLoading } = useQuery<Resp>({
    queryKey: ["contest", "board"],
    queryFn: async () => {
      const res = await authFetch("/api/contest/referral-standings");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center text-fg-soft">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  const standings = data?.standings ?? [];
  const viewer = data?.viewer ?? null;

  return (
    <div>
      {viewer && (
        <div className="mb-4 overflow-hidden rounded-2xl bg-indigo text-cream shadow-[0_6px_20px_rgba(31,58,110,0.16)]">
          <div className="flex items-stretch">
            <div className="flex flex-col items-center justify-center bg-cream/10 px-5 py-4 min-w-22">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-mustard">
                You
              </div>
              {viewer.rank ? (
                <>
                  <div className="display text-[30px] font-bold leading-none">
                    #{viewer.rank}
                  </div>
                  <div className="text-[10px] text-cream/60 mt-0.5">
                    of {viewer.total_ranked}
                  </div>
                </>
              ) : (
                <div className="text-[13px] font-bold text-center leading-tight mt-1">
                  Not ranked yet
                </div>
              )}
            </div>
            <div className="flex flex-1 items-center justify-around gap-4 px-5 py-4">
              <div className="text-center">
                <div className="display text-[22px] font-bold tabular-nums">
                  {viewer.qualified}
                </div>
                <div className="text-[10px] font-medium text-cream/60">
                  Qualified
                </div>
              </div>
              <div className="text-center">
                <div className="display text-[22px] font-bold tabular-nums">
                  {viewer.invited}
                </div>
                <div className="text-[10px] font-medium text-cream/60">
                  Invited
                </div>
              </div>
            </div>
          </div>
          {viewer.rank === null && (
            <div className="bg-cream/10 px-5 py-2.5 text-center text-[11px] text-cream/80">
              Get a friend to verify and stay active to land on the board.
            </div>
          )}
        </div>
      )}
      {standings.length === 0 ? (
        <div className="rounded-2xl bg-canvas-warm p-6 text-center text-[12px] text-fg-soft">
          No qualified referrals yet this week. Be the first on the board.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-4 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft/50">
            <span className="w-5 shrink-0">#</span>
            <span className="flex-1">Referrer</span>
            <span className="w-14 text-right">Invited</span>
            <span className="w-16 text-right">Qualified</span>
          </div>
          <div className="space-y-1.5">
            {standings.map((s) => (
              <div
                key={s.referrer_id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 ${
                  s.is_viewer
                    ? "bg-mustard/15 ring-1 ring-mustard/40"
                    : "bg-paper shadow-[0_2px_8px_rgba(31,58,110,0.04)]"
                }`}
              >
                <span className="w-5 shrink-0 text-[13px] font-bold text-fg-soft/50 tabular-nums">
                  {s.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-indigo">
                    {s.name}
                    {s.is_viewer && (
                      <span className="ml-1.5 text-[10px] font-bold text-terracotta">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-fg-soft/60">{s.wallet}</div>
                </div>
                <div className="flex w-14 items-center justify-end gap-1 text-[13px] font-bold text-fg-soft tabular-nums">
                  <Users
                    size={11}
                    strokeWidth={2.5}
                    className="text-fg-soft/40"
                  />
                  {s.invited}
                </div>
                <div className="w-16 text-right text-[13px] font-bold tabular-nums text-indigo">
                  {s.qualified}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
