"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, History } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type Row = {
  referrer_id: string;
  name: string;
  wallet: string;
  qualified: number;
};

export function PastReferralStandings() {
  const authFetch = useAuthFetch();

  const { data, isLoading } = useQuery<{ standings: Row[] }>({
    queryKey: ["contest", "past-referral-standings"],
    queryFn: async () => {
      const res = await authFetch("/api/contest/past-referral-standings");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-paper p-6 text-[12px] text-fg-soft">
        <Loader2 size={14} className="animate-spin" strokeWidth={2.5} />
        Loading…
      </div>
    );
  }

  const standings = data?.standings ?? [];
  if (standings.length === 0) return null; // nothing to show, hide the section

  return (
    <div className="mt-6">
      <div className="mb-2.5 flex items-center gap-2">
        <History size={14} strokeWidth={2.5} className="text-fg-soft/60" />
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-soft">
          Earlier contest · Aug 17–23 referrals
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft/50">
        <span className="w-5 shrink-0">#</span>
        <span className="flex-1">Referrer</span>
        <span className="w-16 text-right">Qualified</span>
      </div>

      <div className="space-y-1.5">
        {standings.map((s, i) => (
          <div
            key={s.referrer_id}
            className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-2.5 shadow-[0_2px_8px_rgba(31,58,110,0.04)]"
          >
            <span className="w-5 shrink-0 text-[13px] font-bold text-fg-soft/50 tabular-nums">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-indigo">
                {s.name}
              </div>
              <div className="text-[10px] text-fg-soft/60">{s.wallet}</div>
            </div>
            <div className="w-16 text-right text-[14px] font-bold tabular-nums text-indigo">
              {s.qualified}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2.5 px-1 text-[10px] leading-relaxed text-fg-soft/60">
        This earlier contest ran as play-only after heavy bot activity. This
        table shows who genuinely referred during that week, judged by the
        current qualification bar. Reverifications since then may cause slight
        undercounting.
      </p>
    </div>
  );
}
