"use client";

import { useEffect, useState } from "react";
import { Coins, Flame, Trophy, Sparkles } from "lucide-react";
import { formatUnits } from "viem";
import { LoopSigil } from "@/components/home/motifs";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import ProfileHeader from "@/components/dashboard/profile/ProfileHeader";
import type { ProfileData } from "@/lib/data/profile";
import LifetimeStat from "@/components/dashboard/profile/LifetimeStat";
import { usePendingClaim } from "@/hooks/usePendingClaim";
import { ReferralCard } from "@/components/dashboard/profile/ReferralCard";
import { ClaimCard } from "@/components/dashboard/profile/ClaimCard";
import { OnchainBadgeCollection } from "@/components/dashboard/profile/OnchainBadgeCollection";

type PointsData = {
  balance: number;
  lifetime_earned: number;
  lifetime_claimed: number;
};

const Profile = () => {
  const authFetch = useAuthFetch();
  const [data, setData] = useState<ProfileData | null>(null);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { pendingBalance } = usePendingClaim();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileRes, pointsRes] = await Promise.all([
          authFetch("/api/profile"),
          authFetch("/api/points/balance"),
        ]);

        if (!profileRes.ok) throw new Error(`Status ${profileRes.status}`);
        const profileJson = (await profileRes.json()) as ProfileData;
        if (!cancelled) setData(profileJson);

        if (pointsRes.ok) {
          const pointsJson = (await pointsRes.json()) as PointsData;
          if (!cancelled) setPoints(pointsJson);
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
  }, [authFetch]);

  if (error) {
    return (
      <div className="min-h-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-terracotta mb-2">
            Couldn&apos;t load profile
          </div>
          <p className="text-[13px] text-fg-soft">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-100 flex items-center justify-center">
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

  const pointsBalance = points?.balance ?? 0;

  const pendingG =
    pendingBalance > 0n ? parseFloat(formatUnits(pendingBalance, 18)) : 0;
  const gEarnedTotal = data.totalGEarned + pendingG;

  const gClaimed = points?.lifetime_claimed ?? 0;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute right-[10%] top-[8%] h-100 w-100 rounded-full opacity-50 blur-[80px] bg-[radial-gradient(circle,rgba(199,93,63,0.30)_0%,transparent_70%)]"
      />
      <ProfileHeader
        displayName={data.displayName}
        avatarId={data.avatarId}
        walletAddress={data.walletAddress}
        daysOnOnward={data.daysOnOnward}
      />
      <section className="flex justify-between lg:flex-row md:flex-row flex-col gap-3 mb-10 animate-[fade-up_0.8s_0.18s_ease_both]">
        <div className="flex flex-wrap gap-5 lg:w-[52%] md:w-[52%] w-full">
          <LifetimeStat
            label="Points balance"
            value={pointsBalance.toLocaleString()}
            tone="mustard"
            icon={<Sparkles size={28} strokeWidth={2} />}
            sub="unclaimed"
          />
          <LifetimeStat
            label="g$ claimed"
            value={gClaimed.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            }) + "g"}
            tone="forest"
            icon={<Coins size={28} strokeWidth={2} />}
            sub="from point conversion"
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
        </div>
        <div className="w-full lg:w-[45%] md:w-[45%]">
          <ReferralCard />
        </div>
      </section>
      <section className="mb-6 animate-[fade-up_0.8s_0.24s_ease_both]">
        <ClaimCard />
      </section>
      <section className="mb-10 animate-[fade-up_0.8s_0.32s_ease_both]">
        <div className="mb-1">
          <h2 className="display text-[22px] font-semibold tracking-[-0.015em] text-indigo">
            Badge collection
          </h2>
        </div>
        <p className="text-[12.5px] text-fg-soft mb-5">
          Each badge is a soulbound NFT on Celo, pulled live from your wallet.
          Yours forever.
        </p>
        <OnchainBadgeCollection />
      </section>
    </>
  );
};

export default Profile;
