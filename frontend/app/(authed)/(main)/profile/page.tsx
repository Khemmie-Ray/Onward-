"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { LoopSigil } from "@/components/home/motifs";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useProfile } from "@/hooks/useProfile";
import ProfileHeader from "@/components/dashboard/profile/ProfileHeader";
import { ProfileStat } from "@/components/dashboard/profile/ProfileStat";
import { Milestones } from "@/components/dashboard/profile/Milestones";
import { MILESTONE_TRACKS, resolveMilestone } from "@/lib/milestones";

type PointsData = {
  balance: number;
  lifetime_earned: number;
  lifetime_claimed: number;
  leaderboard_points: number;
};

type ContestRewardsSummary = {
  summary: { total_g: number; contests_won: number; best_rank: number | null };
};

const Profile = () => {
  const authFetch = useAuthFetch();
  const { address } = useConnection();

  const { profile: data, error } = useProfile();

  const { data: points } = useQuery({
    queryKey: ["points", "balance", address ?? "anon"],
    queryFn: async (): Promise<PointsData> => {
      const res = await authFetch("/api/points/balance");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return (await res.json()) as PointsData;
    },
    enabled: Boolean(address),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: contest } = useQuery({
    queryKey: ["contest", "my-rewards", address ?? "anon"],
    queryFn: async (): Promise<ContestRewardsSummary> => {
      const res = await authFetch("/api/contest/my-rewards");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return (await res.json()) as ContestRewardsSummary;
    },
    enabled: Boolean(address),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

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
            Loading your profile
          </div>
        </div>
      </div>
    );
  }

  const pointsBalance = points?.balance ?? 0;
  const leaderboardPoints = points?.leaderboard_points ?? 0;
  const contestRewardsG = contest?.summary?.total_g ?? 0;

  const metrics: Record<string, number> = {
    streak: data.currentStreak,
    modules: data.modulesCompleted,
    referrals: data.referralsQualified,
  };
  const milestones = MILESTONE_TRACKS.map((t) =>
    resolveMilestone(t, metrics[t.metric] ?? 0),
  );

  const flagship = [...milestones].sort(
    (a, b) => b.tierLevel - a.tierLevel || b.value - a.value,
  )[0];
  const flagshipLabel = flagship?.tierName ?? "Newcomer";

  return (
    <>
      <ProfileHeader
        displayName={data.displayName}
        avatarId={data.avatarId}
        walletAddress={data.walletAddress}
        daysOnOnward={data.daysOnOnward}
        level={data.currentLevel}
        flagshipLabel={flagshipLabel}
      />

      <section className="mb-9 flex flex-wrap gap-3 animate-[fade-up_0.8s_0.14s_ease_both]">
        <ProfileStat
          value={String(data.modulesCompleted)}
          unit={`/${data.modulesTotal}`}
          label="modules done"
          tone="forest"
        />
        <ProfileStat
          value={String(data.currentStreak)}
          label="day streak"
          tone="mustard"
        />
        <ProfileStat
          value={String(data.roundsPlayed)}
          label="rounds played"
          tone="aubergine"
        />
        <ProfileStat
          value={pointsBalance.toLocaleString()}
          label="points balance"
          tone="neutral"
        />
        <ProfileStat
          value={leaderboardPoints.toLocaleString()}
          label="leaderboard points"
          tone="aubergine"
        />
        <ProfileStat
          value={contestRewardsG.toLocaleString()}
          unit="G$"
          label="contest rewards"
          tone="forest"
        />
      </section>

      <Milestones items={milestones} />
    </>
  );
};

export default Profile;
