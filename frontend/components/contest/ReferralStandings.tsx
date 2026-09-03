"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, CheckCircle2 } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type Standing = {
  referrer_id: string;
  name: string;
  wallet: string;
  invited: number;
  qualified: number;
};

export function ReferralStandings({ maxRefs = 5 }: { maxRefs?: number }) {
  const authFetch = useAuthFetch();

  const { data, isLoading } = useQuery<{ standings: Standing[] }>({
    queryKey: ["contest", "referral-standings"],
    queryFn: async () => {
      const res = await authFetch("/api/contest/referral-standings");
      if (!res.ok) throw new Error("Failed to load standings");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-paper p-8 text-[12px] text-fg-soft">
        <Loader2 size={14} className="animate-spin" strokeWidth={2.5} />
        Loading participants…
      </div>
    );
  }

  const standings = data?.standings ?? [];

  if (standings.length === 0) {
    return (
      <div className="rounded-2xl bg-paper p-6 text-center text-[12px] text-fg-soft">
        The board is open. No qualified referrals yet this week, bring a friend
        who verifies and stays active, and you&apos;ll be the first here.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-soft">
          Who&apos;s leading
        </div>
        <div className="text-[10px] text-fg-soft/60">
          {standings.length} taking part
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft/50">
        <span className="w-5 shrink-0">#</span>
        <span className="flex-1">Referrer</span>
        <span className="w-14 text-right">Invited</span>
        <span className="w-16 text-right">Qualified</span>
      </div>

      <div className="space-y-1.5">
        {standings.map((s, i) => {
          const done = s.qualified >= maxRefs;
          return (
            <div
              key={s.referrer_id}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 ${
                done
                  ? "bg-forest/10 shadow-[0_2px_8px_rgba(58,90,64,0.08)]"
                  : "bg-paper shadow-[0_2px_8px_rgba(31,58,110,0.04)]"
              }`}
            >
              <span className="w-5 shrink-0 text-[13px] font-bold text-fg-soft/50 tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-indigo">
                  {s.name}
                  {done && (
                    <CheckCircle2
                      size={13}
                      strokeWidth={2.5}
                      className="ml-1 inline text-forest"
                    />
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
                <span className="text-fg-soft/40">/{maxRefs}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-2.5 px-1 text-[10px] leading-relaxed text-fg-soft/60">
        Qualified counts friends who were newly verified through Onward and kept
        a 2-day activity streak. New signups appear here once their on-chain
        verification is confirmed, so a fresh referral may take a short while to
        show as qualified.
      </p>
    </div>
  );
}
