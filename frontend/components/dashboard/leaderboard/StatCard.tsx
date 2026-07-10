"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Trophy, Users } from "lucide-react";
import type { LeaderboardStats } from "./type";
import { LoginModal } from "@/components/auth/LoginModal";

export function StatsCard({ stats }: { stats: LeaderboardStats | null }) {
  const { status } = useSession();
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  const handlePlayClick = () => {
    if (status === "authenticated") {
      router.push("/play");
      return;
    }
    setLoginOpen(true);
  };

  const weeksPaid = stats?.lifetime.weeks_paid ?? 0;
  const gPaid = stats?.lifetime.g_paid_out ?? 0;
  const activePlayers = stats?.this_week.active_players ?? 0;
  const roundsPlayed = stats?.this_week.rounds_played ?? 0;

  return (
    <div className="bg-paper border border-fg-soft/15 rounded-2xl overflow-hidden mb-10">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.3fr] divide-y md:divide-y-0 md:divide-x divide-fg-soft/15">
        <Partition>
          <Label>G$ Paid Out</Label>
          <div className="flex items-center gap-3">
            <IconCircle bg="bg-mustard/20" color="text-mustard">
              <Trophy size={16} strokeWidth={2.5} />
            </IconCircle>
            <BigNumber>{gPaid.toLocaleString()}</BigNumber>
          </div>
          <Subtitle>
            Distributed across {weeksPaid} {weeksPaid === 1 ? "week" : "weeks"}{" "}
            to top players
          </Subtitle>
        </Partition>
        <Partition>
          <Label>Active This Week</Label>
          <div className="flex items-center gap-3">
            <IconCircle bg="bg-indigo/10" color="text-indigo">
              <Users size={16} strokeWidth={2.5} />
            </IconCircle>
            <BigNumber>{activePlayers.toLocaleString()}</BigNumber>
          </div>
          <Subtitle>
            {roundsPlayed.toLocaleString()} rounds played in the last 7 days
          </Subtitle>
        </Partition>
        <Partition>
          <Label>How to Climb</Label>
          <ul className="space-y-2 text-[13px] text-indigo flex flex-wrap justify-between">
            <BulletItem>Pass rounds, climb the board</BulletItem>
            <BulletItem>
              Rank 1 wins <strong className="text-mustard">80 G$</strong>
            </BulletItem>
            <BulletItem>
              Ranks 2–3 win <strong className="text-mustard">40 G$</strong>
            </BulletItem>
            <BulletItem>
              Ranks 4–10 win <strong className="text-mustard">20 G$</strong>{" "}
              each
            </BulletItem>
          </ul>
          <button
            onClick={handlePlayClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo text-cream font-bold text-[12px] hover:bg-indigo/90 transition w-fit"
          >
            Play a round
            <ArrowRight size={12} strokeWidth={2.8} />
          </button>
        </Partition>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────

function Partition({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-5 md:p-6 transition hover:bg-canvas-warm flex flex-col gap-3">
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-soft">
      {children}
    </div>
  );
}

function BigNumber({ children }: { children: React.ReactNode }) {
  return (
    <p className="display text-[40px] font-bold tabular-nums text-indigo leading-none">
      {children}
    </p>
  );
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] text-fg-soft leading-relaxed mt-auto">
      {children}
    </div>
  );
}

function IconCircle({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full ${bg} ${color}`}
    >
      {children}
    </div>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-mustard shrink-0" />
      <span>{children}</span>
    </li>
  );
}
