"use client";

import { useEffect, useState } from "react";
import { Gift, UserPlus, ShieldCheck, Flame, Trophy } from "lucide-react";
import type { ActiveContest } from "@/components/contest/ContestRegistry";
import { ReferralStandings } from "@/components/contest/ReferralStandings";
import { PastReferralStandings } from "@/components/contest/PastReferralStandings";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} | null;

function diff(target: Date): Remaining {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
  };
}

function num(settings: Record<string, unknown>, key: string, fallback: number) {
  const v = settings?.[key];
  return typeof v === "number" ? v : fallback;
}

export function ReferralContest({ contest }: { contest: ActiveContest }) {
  const start = new Date(contest.starts_at);
  const end = new Date(contest.ends_at);
  const rewardPer = num(contest.settings, "reward_per_referral", 5000);
  const maxRefs = num(contest.settings, "max_referrals", 5);
  const streakDays = num(contest.settings, "streak_days_required", 2);
  const maxReward = rewardPer * maxRefs;

  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const started = now >= start.getTime();
  const ended = now > end.getTime();
  const target = started ? end : start;
  const remaining = diff(target);

  return (
    <div className="space-y-5">
      <header className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-terracotta">
          {ended ? "Contest closed" : started ? "Contest live" : "Starts soon"}
        </span>
        <h2 className="display mt-1 text-[26px] font-bold text-indigo">
          {contest.title}
        </h2>
        <p className="mx-auto mt-1.5 lg:w-[30%] md:w-[30%] w-full text-[12.5px] leading-relaxed text-fg-soft">
          Invite people who are brand new to GoodDollar. For every one who
          verifies on Onward and stays, you earn{" "}
          <span className="font-bold text-indigo">
            {rewardPer.toLocaleString()} G$
          </span>
          . Up to {maxRefs} friends, so up to{" "}
          <span className="font-bold text-indigo">
            {maxReward.toLocaleString()} G$
          </span>
          .
        </p>
      </header>

      <div className="rounded-2xl bg-indigo px-5 py-4 w-full lg:w-[40%] md:w-[50%] mx-auto">
        <div className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-mustard">
          {ended
            ? "This contest has ended"
            : started
              ? "Time left to earn"
              : "Kicks off in"}
        </div>
        {remaining ? (
          <div className="mt-2 flex items-center justify-center gap-3">
            {[
              ["Days", remaining.days],
              ["Hrs", remaining.hours],
              ["Min", remaining.minutes],
              ["Sec", remaining.seconds],
            ].map(([label, value]) => (
              <div key={label} className="text-center">
                <div className="display text-[28px] font-bold tabular-nums text-paper">
                  {String(value).padStart(2, "0")}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-paper/50">
                  {label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-center text-[15px] font-bold text-paper">
            {ended ? "Rewards are being tallied." : "Starting now."}
          </div>
        )}
        <div className="mt-3 text-center text-[11px] text-paper/60">
          {formatRange(start, end)}
        </div>
      </div>

      <div>
        <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-fg-soft">
          How to earn
        </div>
        <div className="gap-3 flex flex-col lg:flex-row md:flex-row">
          <Step
            icon={<UserPlus size={16} strokeWidth={2.5} />}
            title="Share your referral link"
            body="Find your link on your profile. Send it to friends who have never used GoodDollar before."
            tint="mustard"
          />
          <Step
            icon={<ShieldCheck size={16} strokeWidth={2.5} />}
            title="They verify on Onward"
            body="Your friend signs up and completes face verification here, on Onward. They must be new to GoodDollar, not already verified elsewhere."
            tint="terracotta"
          />
          <Step
            icon={<Flame size={16} strokeWidth={2.5} />}
            title={`They stay ${streakDays} days`}
            body={`They keep a ${streakDays}-day streak by learning or playing. This proves they are a real, engaged user, not a one-time signup.`}
            tint="forest"
          />
          <Step
            icon={<Gift size={16} strokeWidth={2.5} />}
            title={`You earn ${rewardPer.toLocaleString()} G$`}
            body={`Every qualified friend pays you ${rewardPer.toLocaleString()} G$. Your first ${maxRefs} qualified friends count; extras beyond ${maxRefs} do not.`}
            tint="indigo"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-canvas-warm px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <Trophy
            size={15}
            strokeWidth={2.5}
            className="mt-0.5 shrink-0 text-terracotta"
          />
          <div className="text-[11.5px] leading-relaxed text-fg-soft">
            <span className="font-bold text-indigo">The fine print.</span> A
            referral only counts if your friend was new to GoodDollar, verified
            on Onward, and kept a {streakDays}-day streak, all within the
            contest week. Only your first {maxRefs} qualified friends earn.
            Rewards are paid after the contest closes and every one is
            verifiable on-chain.
          </div>
        </div>
      </div>

      <ReferralStandings maxRefs={maxRefs} />
      <PastReferralStandings />
    </div>
  );
}

function Step({
  icon,
  title,
  body,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tint: "mustard" | "terracotta" | "forest" | "indigo";
}) {
  const tintBg = {
    mustard: "bg-mustard/15 text-mustard",
    terracotta: "bg-terracotta/15 text-terracotta",
    forest: "bg-forest/15 text-forest",
    indigo: "bg-indigo/10 text-indigo",
  }[tint];

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-paper px-4 py-3 shadow-[0_2px_8px_rgba(31,58,110,0.04)]">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tintBg}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-[13.5px] font-bold text-indigo">{title}</div>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-fg-soft">
          {body}
        </p>
      </div>
    </div>
  );
}

function formatRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  };
  const s = start.toLocaleDateString(undefined, opts);
  const e = end.toLocaleDateString(undefined, opts);
  return `${s} to ${e} · UTC`;
}
