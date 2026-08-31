"use client";

import Header from "@/components/shared/Header";
import { PublicGuard } from "@/components/auth/PublicGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import MainLeaderboard from "@/components/dashboard/leaderboard/MainLeaderboard";
import { ActiveContest } from "@/components/contest/ContestRegistry";

export default function Leaderboard() {
  return (
    <PublicGuard>
      <div className="flex flex-col bg-canvas mx-auto w-[90%] mt-10">
        <Header />

        <Tabs defaultValue="main" className="w-full">
          <div className="flex justify-end mb-6">
            <TabsList className="h-auto w-full max-w-[320px] items-center gap-1.5 rounded-full bg-canvas-warm p-1.5">
              <BoardTabTrigger value="contest" label="Contest" />
              <BoardTabTrigger value="main" label="All time" />
            </TabsList>
          </div>

          <div className="pb-12">
            <TabsContent value="contest" className="mt-0">
              <ActiveContest />
            </TabsContent>
            <TabsContent value="main" className="mt-0">
              <MainLeaderboard />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PublicGuard>
  );
}

function BoardTabTrigger({ value, label }: { value: string; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="flex h-auto flex-1 items-center justify-center rounded-full border-0 px-4 py-2 text-[13px] font-bold text-fg-soft shadow-none transition-colors data-[state=active]:bg-indigo data-[state=active]:text-paper hover:text-indigo data-[state=active]:hover:text-paper"
    >
      {label}
    </TabsTrigger>
  );
}
