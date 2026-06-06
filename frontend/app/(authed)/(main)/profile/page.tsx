"use client";

import { useEffect, useState } from "react";
import { Award, Coins, Flame, Trophy } from "lucide-react";
import { LoopSigil } from "@/components/home/motifs";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { BadgeCard } from "@/components/dashboard/profile/BadgeCard";
import ProfileHeader from "@/components/dashboard/profile/ProfileHeader";
import type { ProfileData } from "@/lib/data/profile";
import LifetimeStat from "@/components/dashboard/profile/LifetimeStat";
import EmptyBadgeState from "@/components/dashboard/profile/EmptyBadgeState";
import { AccountSection } from "@/components/dashboard/profile/AccountSection";

const Profile = () => {
  const authFetch = useAuthFetch();
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/profile");
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = (await res.json()) as ProfileData;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-terracotta mb-2">
            Couldn't load profile
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
            Loading your collection
          </div>
        </div>
      </div>
    );
  }

  const earnedBadges = data.badges.filter((b) => b.earned);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[8%] h-[500px] w-[500px] rounded-full opacity-50 blur-[80px] bg-[radial-gradient(circle,rgba(199,93,63,0.30)_0%,transparent_70%)]"
      />
      <ProfileHeader 
        displayName={data.displayName} 
        walletAddress={data.walletAddress} 
        daysOnOnward={data.daysOnOnward} 
      />
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10 animate-[fade-up_0.8s_0.18s_ease_both]">
        <LifetimeStat
          label="g$ earned"
          value={data.totalGEarned.toLocaleString()}
          tone="mustard"
          icon={<Coins size={28} strokeWidth={2} />}
        />
        <LifetimeStat
          label="Badges"
          value={`${data.modulesCompleted}/${data.modulesTotal}`}
          tone="forest"
          icon={<Award size={28} strokeWidth={2} />}
        />
        <LifetimeStat
          label="Level"
          value={String(data.currentLevel)}
          tone="aubergine"
          icon={<Trophy size={28} strokeWidth={2} />}
        />
        <LifetimeStat
          label="Longest streak"
          value={`${data.longestStreak}d`}
          tone="terracotta"
          icon={<Flame size={28} strokeWidth={2} />}
        />
      </section>
      <section className="mb-10 animate-[fade-up_0.8s_0.32s_ease_both]">
        <div className="flex items-end justify-between mb-1">
          <h2 className="display text-[22px] font-semibold tracking-[-0.015em] text-indigo">
            Badge collection
          </h2>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-soft">
            {earnedBadges.length} of {data.modulesTotal}
          </div>
        </div>
        <p className="text-[12.5px] text-fg-soft mb-5">
          Each badge is a soulbound NFT on Celo. Yours forever.
        </p>

        {earnedBadges.length === 0 && <EmptyBadgeState />}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {data.badges.map((badge) => (
            <BadgeCard key={badge.moduleSlug} badge={badge} />
          ))}
        </div>
      </section>
      <section className="mb-10 max-w-[480px] animate-[fade-up_0.8s_0.46s_ease_both]">
        <AccountSection walletAddress={data.walletAddress} />
      </section>
    </>
  );
}

export default Profile;