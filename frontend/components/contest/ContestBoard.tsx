"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Coins,
  Loader2,
  MessageSquare,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { MudclothPattern } from "@/components/home/motifs";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type Entry = {
  rank: number;
  display_name: string;
  lessons: number;
  rounds: number;
  referrals: number;
  total_points: number;
  is_me: boolean;
};

type ContestResponse = {
  period: { start: string; end: string };
  scoring: {
    verified_bonus: number;
    lesson: number;
    lessons_total_cap: number;
    round_played: number;
    claim: number;
    referral: number;
    feedback: number;
  };
  total_ranked: number;
  signed_in: boolean;
  leaderboard: Entry[];
  me: {
    rank: number | null;
    is_verified: boolean;
    lessons: number;
    rounds: number;
    rounds_passed: number;
    claims: number;
    referrals: number;
    verified_points: number;
    lesson_points: number;
    round_points: number;
    claim_points: number;
    referral_points: number;
    bonus_points: number;
    total_points: number;
  };
};

export function ContestBoard() {
  const authFetch = useAuthFetch();

  const [data, setData] = useState<ContestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/contest/leaderboard", {
          method: "GET",
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = (await res.json()) as ContestResponse;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Could not load the leaderboard",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  const msLeft = data
    ? Math.max(0, new Date(data.period.end).getTime() - now)
    : null;

  const countdown =
    msLeft === null
      ? null
      : {
          days: Math.floor(msLeft / 86_400_000),
          hours: Math.floor((msLeft % 86_400_000) / 3_600_000),
          minutes: Math.floor((msLeft % 3_600_000) / 60_000),
          seconds: Math.floor((msLeft % 60_000) / 1000),
          over: msLeft <= 0,
        };

  const PAGE_SIZE = 10;
  const entries = data?.leaderboard ?? [];
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pageEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const myEntry = entries.find((e) => e.is_me) ?? null;
  const myPage = myEntry
    ? Math.floor(entries.indexOf(myEntry) / PAGE_SIZE)
    : null;

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="mb-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-soft mb-2">
            Learn-to-Earn Contest
          </div>
          <h1 className="display text-[30px] md:text-[36px] font-bold leading-[1.05] tracking-tight text-indigo mb-2">
            Show up daily. Climb the board.
          </h1>
          <p className="text-[13.5px] leading-[1.6] text-fg-soft mb-4">
            One week of learning, playing and bringing your people.
          </p>

          {countdown && (
            <div className="inline-flex items-center gap-2">
              {countdown.over ? (
                <span className="rounded-full bg-canvas-warm px-4 py-2 text-[12px] font-bold text-fg-soft">
                  This contest has ended
                </span>
              ) : (
                <>
                  <TimeUnit value={countdown.days} label="days" />
                  <TimeUnit value={countdown.hours} label="hrs" />
                  <TimeUnit value={countdown.minutes} label="min" />
                  <TimeUnit value={countdown.seconds} label="sec" />
                </>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="rounded-[20px] bg-paper p-10 text-center shadow-[0_2px_8px_rgba(31,58,110,0.05)]">
            <Loader2
              size={28}
              strokeWidth={1.8}
              className="mx-auto text-indigo animate-spin mb-3"
            />
            <p className="text-[13px] text-fg-soft">Loading standings…</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-[16px] bg-terracotta-tint p-5 text-center">
            <p className="text-[13px] font-semibold text-terracotta">
              {error}. Refresh to try again.
            </p>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Your standing */}
            {data.signed_in && (
              <div className="relative overflow-hidden rounded-[20px] bg-aubergine p-6 mb-4 shadow-[0_8px_24px_rgba(91,46,92,0.18)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 text-paper opacity-[0.06]"
                >
                  <MudclothPattern />
                </div>
                <div className="relative">
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-mustard mb-3">
                    Your standing
                  </div>

                  <div className="flex items-end justify-between gap-4 mb-5">
                    <div>
                      <div className="display text-[38px] font-bold leading-none text-paper tabular-nums">
                        {data.me.total_points}
                      </div>
                      <div className="text-[11px] text-paper/70 mt-1">
                        points this week
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="display text-[30px] font-bold leading-none text-mustard tabular-nums">
                        {data.me.rank ? `#${data.me.rank}` : "—"}
                      </div>
                      <div className="text-[11px] text-paper/70 mt-1">
                        of {data.total_ranked} ranked
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-paper/15 pt-4">
                    <Stat
                      label="Lessons"
                      value={Math.min(
                        data.me.lessons,
                        data.scoring.lessons_total_cap,
                      )}
                      hint={
                        data.me.lessons > data.scoring.lessons_total_cap
                          ? `${data.me.lessons} done`
                          : undefined
                      }
                    />
                    <Stat label="Rounds" value={data.me.rounds} />
                    <Stat label="Referrals" value={data.me.referrals} />
                  </div>
                </div>
              </div>
            )}
            <div className="mb-4">
              <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-terracotta mb-3">
                How points work
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <PointsCard
                  step="01"
                  title="Get started"
                  items={[
                    {
                      points: data.scoring.verified_bonus,
                      text: "for verifying with GoodDollar, once",
                      icon: BadgeCheck,
                    },
                    {
                      points: data.scoring.lesson,
                      text: `a lesson, for your first ${data.scoring.lessons_total_cap}`,
                      icon: BookOpen,
                    },
                  ]}
                />
                <PointsCard
                  step="02"
                  title="Play daily"
                  items={[
                    {
                      points: data.scoring.round_played,
                      text: "every round you play, free or premium",
                      icon: Target,
                    },
                    {
                      points: data.scoring.claim,
                      text: "the first time you claim your points as G$",
                      icon: Coins,
                    },
                  ]}
                />
                <PointsCard
                  step="03"
                  title="Bring people"
                  items={[
                    {
                      points: data.scoring.referral,
                      text: "for every friend who verifies and plays. Users who referred verified friends before the contest also get a separate reward.",
                      icon: Users,
                    },
                    {
                      points: data.scoring.feedback,
                      text: "for feedback, added by hand after we read it",
                      icon: MessageSquare,
                    },
                  ]}
                />
              </div>
              <p className="text-[11.5px] leading-normal text-fg-soft/80 mt-3">
                Lesson points stop after {data.scoring.lessons_total_cap}, and
                new lessons land this week, so everyone has the same five to
                earn however long they have been here. Referrals are never
                capped.
              </p>
            </div>
            <div className="rounded-[20px] bg-paper p-5 shadow-[0_2px_8px_rgba(31,58,110,0.05)]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy
                    size={14}
                    strokeWidth={2.5}
                    className="text-mustard"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-fg-soft">
                    Standings
                  </span>
                  <span className="text-[11px] text-fg-soft/70">
                    {entries.length} ranked
                  </span>
                </div>
                {myPage !== null && myPage !== page && (
                  <button
                    onClick={() => setPage(myPage)}
                    className="text-[11px] font-bold text-terracotta hover:opacity-80"
                  >
                    Jump to me
                  </button>
                )}
              </div>

              {entries.length === 0 ? (
                <p className="text-[13px] text-fg-soft text-center py-8">
                  No one has scored yet. Play a round and you will be first.
                </p>
              ) : (
                <ol className="space-y-1">
                  {pageEntries.map((entry) => (
                    <li
                      key={`${entry.rank}-${entry.display_name}`}
                      className={`flex items-center gap-3 rounded-[12px] px-3 py-3 ${
                        entry.is_me ? "bg-mustard/15" : ""
                      }`}
                    >
                      <span
                        className={`display w-8 shrink-0 text-[16px] font-bold tabular-nums ${
                          entry.rank <= 3 ? "text-mustard" : "text-fg-soft"
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-bold text-indigo truncate">
                          {entry.display_name}
                          {entry.is_me && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.1em] text-mustard">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-fg-soft">
                          {Math.min(
                            entry.lessons,
                            data.scoring.lessons_total_cap,
                          )}{" "}
                          lessons · {entry.rounds} rounds · {entry.referrals}{" "}
                          referrals
                        </div>
                      </div>
                      <span className="display text-[16px] font-bold text-indigo tabular-nums shrink-0">
                        {entry.total_points}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {pageCount > 1 && (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-fg-soft/10 pt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-[11.5px] font-bold text-indigo transition-colors disabled:cursor-not-allowed disabled:text-fg-faint hover:bg-canvas-warm"
                  >
                    <ChevronLeft size={13} strokeWidth={2.8} />
                    Previous
                  </button>
                  <span className="text-[11.5px] text-fg-soft tabular-nums">
                    Page {page + 1} of {pageCount}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(pageCount - 1, p + 1))
                    }
                    disabled={page >= pageCount - 1}
                    className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-[11.5px] font-bold text-indigo transition-colors disabled:cursor-not-allowed disabled:text-fg-faint hover:bg-canvas-warm"
                  >
                    Next
                    <ChevronRight size={13} strokeWidth={2.8} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[12px] bg-canvas-warm px-3 py-2 text-center min-w-[52px]">
      <div className="display text-[18px] font-bold text-indigo leading-none tabular-nums">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-fg-soft mt-1">
        {label}
      </div>
    </div>
  );
}

function PointsCard({
  step,
  title,
  items,
}: {
  step: string;
  title: string;
  items: { points: number; text: string; icon?: LucideIcon }[];
}) {
  return (
    <div className="flex-1 rounded-[16px] bg-canvas-warm p-5">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="display text-[13px] font-bold text-terracotta tabular-nums">
          {step}
        </span>
        <h3 className="text-[13.5px] font-bold text-indigo">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.text} className="flex items-start gap-2">
              {Icon && (
                <Icon
                  size={13}
                  strokeWidth={2.5}
                  className="text-terracotta shrink-0 mt-[3px]"
                />
              )}
              <span className="text-[12px] leading-[1.5] text-fg-soft">
                <strong className="text-indigo">
                  {item.points.toLocaleString()}
                </strong>{" "}
                {item.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div>
      <div className="display text-[20px] font-bold text-paper tabular-nums">
        {value}
      </div>
      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-paper/60 mt-0.5">
        {label}
      </div>
      {hint && (
        <div className="text-[9px] text-paper/45 mt-0.5 normal-case">
          {hint}
        </div>
      )}
    </div>
  );
}
