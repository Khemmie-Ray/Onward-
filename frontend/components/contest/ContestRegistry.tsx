"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { ContestBoard } from "@/components/contest/ContestBoard";
import { ReferralContest } from "@/components/contest/ReferralContest";

export type ActiveContest = {
  slug: string;
  seq: number;
  type: string;
  title: string;
  subtitle: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  phase: "live" | "upcoming" | "closed";
  settings: Record<string, unknown>;
};

const REGISTRY: Record<
  string,
  (contest: ActiveContest) => React.ReactNode
> = {
  play: () => <ContestBoard />,
  referral: (contest) => <ReferralContest contest={contest} />,
};

export function ActiveContest() {
  const authFetch = useAuthFetch();

  const { data, isLoading } = useQuery<{ contest: ActiveContest | null }>({
    queryKey: ["contest", "active"],
    queryFn: async () => {
      const res = await authFetch("/api/contest/active");
      if (!res.ok) throw new Error("Failed to load contest");
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-[20px] bg-paper p-10 text-[13px] text-fg-soft">
        <Loader2 size={15} className="animate-spin" strokeWidth={2.5} />
        Loading the contest…
      </div>
    );
  }

  const contest = data?.contest;
  if (!contest) {
    return (
      <div className="rounded-[20px] bg-paper p-8 text-center text-[13px] text-fg-soft">
        No contest is running right now. Check back soon.
      </div>
    );
  }

  const render = REGISTRY[contest.type];
  if (!render) {
    return (
      <div className="rounded-[20px] bg-paper p-8 text-center text-[13px] text-fg-soft">
        This contest isn&apos;t available to view yet.
      </div>
    );
  }

  return <>{render(contest)}</>;
}