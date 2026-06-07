"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Flame, Globe, Target } from "lucide-react";
import { useAppKitAccount } from "@reown/appkit/react";
import { formatUnits, type Address } from "viem";

import { LoopSigil, SunMotif, MudclothPattern } from "@/components/home/motifs";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useGDollarBalance } from "@/hooks/useWhackState";
import type { DashboardData } from "@/lib/data/dashboard";
import StatCardHero from "@/components/dashboard/StatCardHero";
import NextActionCard from "@/components/dashboard/NextActionCard";
import EmptyStateCard from "@/components/dashboard/EmptyStateCard";
import KeepGoingCard from "@/components/dashboard/KeepGoingCard";
import WorkspaceCard from "@/components/dashboard/WorkspaceCard";
import RecentBadge from "@/components/dashboard/RecentBadge";

const Overview = () => {
  const authFetch = useAuthFetch();
  const { address } = useAppKitAccount();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { balance: walletBalance, refetch: refetchBalance } = useGDollarBalance(
    address as Address | undefined,
    true,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/dashboard");
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = (await res.json()) as DashboardData;
        if (!cancelled) {
          setData(json);
          // Trigger a fresh wallet balance read whenever dashboard reloads
          refetchBalance();
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch, refetchBalance]);

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-terracotta mb-2">
            Couldn't load dashboard
          </div>
          <p className="text-[13px] text-fg-soft">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-[fade-up_0.5s_ease_both]">
          <div className="animate-[spin_2s_linear_infinite]">
            <LoopSigil size={32} color="var(--color-indigo)" />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-soft">
            Loading your loop
          </div>
        </div>
      </div>
    );
  }

  const walletBalanceDisplay = parseFloat(
    formatUnits(walletBalance, 18),
  ).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute right-[10%] top-[8%] h-[400px] w-[400px] rounded-full opacity-60 blur-[80px] bg-[radial-gradient(circle,rgba(230,180,72,0.45)_0%,transparent_70%)]"
      />
      <section className="flex flex-wrap items-end justify-between gap-4 mb-8 animate-[fade-up_0.8s_0.05s_ease_both]">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta mb-2">
            <SunMotif size={14} className="text-mustard" />
            Day {data.currentStreak} of your loop
          </div>
          <h1 className="display text-[40px] md:text-[48px] font-semibold leading-[1.1] tracking-[-0.025em] text-indigo">
            Welcome back,{" "}
            <span className="text-terracotta">{data.displayName}</span>.
          </h1>
          <p className="mt-1 text-[14px] text-fg-soft">
            {data.currentModule
              ? "Pick up where you left off, or explore something new."
              : data.modulesCompleted > 0
                ? "Nice work. Pick your next module."
                : "Pick where to spend the next five minutes."}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-paper px-4 py-2.5 shadow-[0_4px_12px_rgba(31,58,110,0.06)]">
          <Flame size={16} strokeWidth={2.5} className="text-terracotta" />
          <span className="text-[13px] text-fg-soft">
            <span className="font-semibold text-indigo">
              {data.hoursUntilMidnightUTC}h {data.minutesUntilMidnightUTC}m
            </span>{" "}
            until midnight UTC
          </span>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4 mb-4 animate-[fade-up_0.8s_0.18s_ease_both]">
        <StatCardHero
          label="Streak"
          value={String(data.currentStreak)}
          unit="days"
          sub={`Longest yet: ${data.longestStreak}`}
          tone="terracotta"
        />
        <StatCardHero
          label="G$ in wallet"
          value={walletBalanceDisplay}
          unit="g$"
          sub={
            data.totalGEarned > 0
              ? `Lifetime earned: ${data.totalGEarned.toLocaleString()}`
              : "No earnings yet"
          }
          tone="mustard"
        />
        <StatCardHero
          label="Modules"
          value={String(data.modulesCompleted)}
          unit={`of ${data.modulesTotal}`}
          sub={
            data.currentModule
              ? `${data.currentModule.title} in progress`
              : data.modulesCompleted > 0
                ? `${data.modulesTotal - data.modulesCompleted} remaining`
                : "Pick your next module"
          }
          tone="forest"
        />
      </section>
      <section className="mb-4 animate-[fade-up_0.8s_0.32s_ease_both]">
        {data.currentModule ? (
          <NextActionCard module={data.currentModule} />
        ) : data.modulesCompleted > 0 ? (
          <KeepGoingCard
            modulesCompleted={data.modulesCompleted}
            modulesTotal={data.modulesTotal}
          />
        ) : (
          <EmptyStateCard />
        )}
      </section>

      <section className="mb-12 animate-[fade-up_0.8s_0.46s_ease_both]">
        <h2 className="display text-[20px] font-semibold tracking-[-0.015em] text-indigo mb-1">
          Or explore
        </h2>
        <p className="text-[12.5px] text-fg-soft mb-4">
          Three workspaces. Use what calls you.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <WorkspaceCard
            href="/modules"
            icon={BookOpen}
            title="Modules"
            copy="Five-minute lessons that pay you in g$ as you learn the ecosystem."
            count={`${data.modulesCompleted} of ${data.modulesTotal} complete`}
            tint="mustard"
          />
          <WorkspaceCard
            href="/play"
            icon={Target}
            title="Whack-a-scam"
            copy="Train the muscle that spots fraud. Sixty seconds a day."
            count={`Level ${data.currentLevel} · Tier 1`}
            tint="terracotta"
          />
          <WorkspaceCard
            href="/ecosystem"
            icon={Globe}
            title="Ecosystem"
            copy="Learn to use real apps built on GoodDollar."
            count={`${data.ecosystemAppsExplored} of ${data.ecosystemAppsTotal} explored`}
            tint="aubergine"
          />
        </div>
      </section>

      {data.recentBadges.length > 0 && (
        <section className="mb-12 animate-[fade-up_0.8s_0.6s_ease_both]">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="display text-[20px] font-semibold tracking-[-0.015em] text-indigo">
                Recently earned
              </h2>
              <p className="text-[12.5px] text-fg-soft">
                Your last {data.recentBadges.length} badge
                {data.recentBadges.length === 1 ? "" : "s"}.
              </p>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-terracotta hover:opacity-80"
            >
              View all <ArrowRight size={12} strokeWidth={2.8} />
            </Link>
          </div>
          <div className="flex justify-between items-center lg:flex-row md:flex-row flex-wrap flex-col mb-10">
            {data.recentBadges.map((badge) => (
              <div className="lg:w-[32%] md:w-[32%] w-full mb-3">
                <RecentBadge key={badge.moduleSlug} badge={badge} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export default Overview;
