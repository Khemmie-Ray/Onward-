"use client";

import { useState } from "react";
import { Trophy, Gift } from "lucide-react";
import { LeaderboardWidget } from "@/components/dashboard/leaderboard/LeaderboardWidget";
import { ContestRewards } from "@/components/dashboard/leaderboard/ContestRewards";
import { ReferralBoard } from "@/components/contest/ReferralBoard";

type Tab = "play" | "contest";

export default function BoardPage() {
  const [tab, setTab] = useState<Tab>("play");

  return (
    <div className="mx-auto w-full py-4">
      <div className="mb-5">
        <h1 className="display text-[26px] font-bold text-indigo">
          Your board
        </h1>
        <p className="mt-1 text-[13px] text-fg-soft">
          Where you stand this week, and everything you&apos;ve won.
        </p>
      </div>
      <div className="mb-5 inline-flex w-full rounded-2xl bg-canvas-warm p-2 sm:w-auto">
        <TabButton
          active={tab === "play"}
          onClick={() => setTab("play")}
          icon={<Trophy size={15} strokeWidth={2.5} />}
          label="Weekly play"
        />
        <TabButton
          active={tab === "contest"}
          onClick={() => setTab("contest")}
          icon={<Gift size={15} strokeWidth={2.5} />}
          label="Contest rewards"
        />
      </div>

      {tab === "play" ? (
        <LeaderboardWidget />
      ) : (
        <div className="space-y-4 w-full lg:w-[70%] mx-auto md:w-[80%]">
          <div className="w-full rounded-3xl bg-paper p-5 sm:p-6 shadow-[0_8px_28px_rgba(31,58,110,0.06)]">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="display text-[20px] font-bold text-indigo">
                  Current contest
                </h2>
                <p className="text-[11px] text-fg-soft mt-0.5">
                  Referrers ranked by qualified friends this week.
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mustard/15">
                <Trophy size={16} strokeWidth={2.5} className="text-mustard" />
              </div>
            </div>
            <ReferralBoard />
          </div>
          <div className="w-full rounded-3xl bg-paper p-5 sm:p-6 shadow-[0_8px_28px_rgba(31,58,110,0.06)]">
            <div className="mb-1">
              <h2 className="display text-[20px] font-bold text-indigo">
                Your rewards
              </h2>
              <p className="text-[11px] text-fg-soft mt-0.5">
                Everything you&apos;ve won across contests, paid on-chain.
              </p>
            </div>
            <ContestRewards />
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold transition-all sm:flex-none ${
        active
          ? "bg-indigo text-cream shadow-[0_2px_8px_rgba(31,58,110,0.2)]"
          : "text-fg-soft hover:text-indigo"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
