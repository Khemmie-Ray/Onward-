"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { UBIClaimCard } from "@/components/dashboard/UBIClaimCard";
import { StreakRestorePrompt } from "@/components/dashboard/streak/StreakRestorePrompt";
import { StreakFreezeCard } from "@/components/dashboard/streak/StreakFreezeCard";

export function WalletRightPanel() {
  const authFetch = useAuthFetch();

  const { data } = useQuery<{ current_streak: number }>({
    queryKey: ["streak", "rewards"],
    queryFn: async () => {
      const res = await authFetch("/api/streak/status");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const streak = data?.current_streak ?? 0;

  return (
    <>
      <UBIClaimCard />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracotta-tint text-terracotta">
            <Flame size={17} strokeWidth={2.5} />
          </div>
          <div>
            <div className="display text-[16px] font-bold leading-tight text-indigo">
              Streak shop
            </div>
            <div className="text-[11.5px] text-fg-soft">
              Current streak: {streak} day{streak === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <StreakRestorePrompt />
        <StreakFreezeCard />
      </div>
    </>
  );
}
