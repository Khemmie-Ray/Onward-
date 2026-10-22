"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { Gem, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useTokenBalances, formatBalance } from "@/hooks/useTokenBalances";

export function StatBar() {
  const authFetch = useAuthFetch();
  const { address } = useConnection();

  const { data: streakData, isLoading: streakLoading } = useQuery<{
    current_streak: number;
  }>({
    queryKey: ["streak", "rewards"],
    queryFn: async () => {
      const res = await authFetch("/api/streak/status");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const { data: pointsData, isLoading: pointsLoading } = useQuery<{
    balance: number;
  }>({
    queryKey: ["points", "balance"],
    queryFn: async () => {
      const res = await authFetch("/api/points/balance");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const { balances, isLoading: gLoading } = useTokenBalances(
    address as Address | undefined,
  );
  const gDollar = balances.find((b) => b.symbol === "G$");

  const streak = streakData?.current_streak ?? 0;
  const points = pointsData?.balance ?? 0;
  const gValue = gDollar ? formatBalance(gDollar.formatted, 0) : "0";

  return (
    <div className="flex items-stretch rounded-2xl bg-paper p-1 shadow-[0_4px_14px_rgba(31,58,110,0.06)]">
      <Segment
        href="/play"
        label="day streak"
        value={streak.toLocaleString()}
        loading={streakLoading}
        title={`${streak}-day streak`}
        icon={
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              streak > 0
                ? "bg-mustard text-indigo"
                : "bg-canvas-warm text-fg-faint"
            }`}
          >
            <Zap size={14} strokeWidth={2.6} fill="currentColor" />
          </span>
        }
      />
      <Divider />
      <Segment
        href="/profile"
        label="points"
        value={points.toLocaleString()}
        loading={pointsLoading}
        title={`${points.toLocaleString()} points`}
        icon={
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-aubergine-tint text-aubergine">
            <Gem size={14} strokeWidth={2.4} />
          </span>
        }
      />
      <Divider />
      <Segment
        href="/wallet"
        label="G$"
        value={gValue}
        loading={gLoading}
        title={`${gValue} G$ in your wallet`}
        icon={
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo text-[12px] font-extrabold text-mustard">
            G$
          </span>
        }
      />
    </div>
  );
}

function Segment({
  href,
  icon,
  value,
  label,
  loading,
  title,
}: {
  href: string;
  icon: ReactNode;
  value: string;
  label: string;
  loading: boolean;
  title: string;
}) {
  return (
    <Link
      href={href}
      title={title}
      className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-canvas-warm"
    >
      {icon}
      <span className="min-w-0 leading-none">
        {loading ? (
          <span className="block h-[15px] w-6 animate-pulse rounded bg-canvas-warm" />
        ) : (
          <span className="display block truncate text-[15px] font-bold tabular-nums text-indigo">
            {value}
          </span>
        )}
        <span className="mt-0.5 block truncate text-[9.5px] font-semibold uppercase tracking-[0.08em] text-fg-dim">
          {label}
        </span>
      </span>
    </Link>
  );
}

function Divider() {
  return <span aria-hidden className="my-2 w-px shrink-0 bg-canvas-warm" />;
}
