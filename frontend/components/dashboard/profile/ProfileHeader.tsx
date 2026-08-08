"use client";

import React from "react";
import { Award, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuthFetch } from "@/hooks/useAuthFetch";

interface ProfileHeaderProps {
  displayName: string;
  avatarId: string | null;
  walletAddress: string;
  daysOnOnward: number;
}

type PlayStats = {
  current_streak: number;
  lifetime_points_from_play: number;
  scams_whacked_today: number;
  weekly_rank: number | null;
};

const ProfileHeader = ({
  displayName,
  avatarId,
  walletAddress,
  daysOnOnward,
}: ProfileHeaderProps) => {
  const authFetch = useAuthFetch();
  const truncatedAddress = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

  const { data } = useQuery({
    queryKey: ["play", "stats"],
    queryFn: async () => {
      const res = await authFetch("/api/play/stats");
      if (!res.ok) return { stats: null };
      return res.json() as Promise<{ stats: PlayStats }>;
    },
    staleTime: 30_000,
  });

  const rank = data?.stats?.weekly_rank ?? null;

  return (
    <section className="mb-10 animate-[fade-up_0.8s_0.05s_ease_both]">
      <div className="flex flex-col items-start gap-5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative shadow-[0_8px_20px_rgba(199,93,63,0.30)] rounded-full">
            <UserAvatar
              avatarId={avatarId}
              size={80}
              priority
              className="border-2 border-paper"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta mb-2">
              <Award size={13} strokeWidth={2.5} />
              Your profile
            </div>
            <h1 className="display text-[26px] sm:text-[32px] md:text-[44px] font-semibold leading-[1.1] tracking-tight text-indigo break-words">
              {displayName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] md:text-[12px] text-fg-soft">
              <span className="font-mono">{truncatedAddress}</span>
              <span className="text-fg-faint">·</span>
              <span>
                Joined {daysOnOnward} day{daysOnOnward === 1 ? "" : "s"} ago
              </span>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center gap-3 rounded-2xl bg-mustard/15 px-4 py-3 md:w-auto">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mustard/25">
            <Trophy size={16} strokeWidth={2.5} className="text-mustard" />
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft leading-none mb-1">
              Weekly rank
            </div>
            <div className="display text-[20px] font-bold text-indigo leading-none tabular-nums">
              {rank ? `#${rank}` : "Unranked"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;
