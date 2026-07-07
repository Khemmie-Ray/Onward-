"use client";

import { useEffect, useState } from "react";
import { Coins, Lock, ArrowRight, Info, ShieldCheck } from "lucide-react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useIdentityContext } from "@/contexts/IdentityContext";

type PointsData = {
  balance: number;
  lifetime_earned: number;
  lifetime_claimed: number;
  claimed_this_week: number;
  weekly_cap: number;
  thresholds: {
    min_claim: number;
    max_single_claim: number;
    weekly_cap: number;
  };
};

const TIERS = [100, 250, 500];

export function ClaimCard() {
  const authFetch = useAuthFetch();
  const { isVerified, startVerifying } = useIdentityContext();
  const [data, setData] = useState<PointsData | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/points/balance");
        if (!res.ok) return;
        const json = (await res.json()) as PointsData;
        if (!cancelled) setData(json);
      } catch {
        // silent
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  const balance = data?.balance ?? 0;
  const weeklyRemaining = data
    ? Math.max(0, data.weekly_cap - data.claimed_this_week)
    : 0;

  return (
    <div className="rounded-[18px] bg-paper p-6 shadow-[0_2px_8px_rgba(31,58,110,0.05)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Coins size={15} strokeWidth={2.5} className="text-mustard" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-soft">
              Convert points to G$
            </span>
          </div>
          <div className="display text-[32px] font-bold text-indigo tabular-nums leading-none">
            {balance.toLocaleString()}
            <span className="text-[16px] text-fg-soft ml-1.5">points</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft mb-0.5">
            Claimed so far
          </div>
          <div className="display text-[20px] font-bold text-forest tabular-nums">
            {(data?.lifetime_claimed ?? 0).toLocaleString()} G$
          </div>
        </div>
      </div>
      {!isVerified ? (
        <>
          <div className="flex items-start gap-2 rounded-xl bg-mustard/10 border border-mustard/30 p-3 mb-5">
            <ShieldCheck
              size={14}
              strokeWidth={2.5}
              className="text-mustard mt-0.5 shrink-0"
            />
            <div>
              <p className="text-[12px] font-bold text-indigo leading-snug">
                Verify to convert points
              </p>
              <p className="text-[11px] text-fg-soft leading-snug mt-0.5">
                Converting points to G$ needs a verified GoodID, so the reward
                reaches one real person. Verification takes about a minute.
              </p>
            </div>
          </div>

          <button
            onClick={startVerifying}
            className="w-full py-3.5 rounded-xl bg-indigo text-cream font-bold text-sm hover:bg-indigo/90 transition flex items-center justify-center gap-2 lg:w-[50%] md:w-[50%] mx-auto"
          >
            Verify first
            <ArrowRight size={15} strokeWidth={2.8} />
          </button>
        </>
      ) : (
        <>
          <div className="flex items-start gap-2 rounded-xl bg-forest/10 border border-forest/30 p-3 mb-5">
            <Lock
              size={14}
              strokeWidth={2.5}
              className="text-forest mt-0.5 shrink-0"
            />
            <div>
              <p className="text-[12px] font-bold text-indigo leading-snug">
                You&apos;re verified. Claims opening soon.
              </p>
              <p className="text-[11px] text-fg-soft leading-snug mt-0.5">
                Point conversion goes live shortly. Pick an amount below to see
                what you&apos;ll receive at 1 point = 1 G$.
              </p>
            </div>
          </div>
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft mb-2">
              Pick an amount
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TIERS.map((tier) => {
                const affordable = balance >= tier;
                const isSelected = selectedTier === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => affordable && setSelectedTier(tier)}
                    disabled={!affordable}
                    className={`rounded-xl p-3 text-center transition ${
                      isSelected
                        ? "bg-indigo text-cream"
                        : affordable
                          ? "bg-canvas-warm text-indigo hover:bg-canvas-warm/70"
                          : "bg-canvas-warm/40 text-fg-soft/40 cursor-not-allowed"
                    }`}
                  >
                    <div className="display text-[18px] font-bold tabular-nums leading-none">
                      {tier}
                    </div>
                    <div className="text-[9px] font-semibold mt-1 opacity-70">
                      = {tier} G$
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            disabled
            className="w-full py-3.5 rounded-xl bg-indigo/40 text-cream font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2 mb-4 lg:w-[50%] md:w-[50%] mx-auto"
          >
            {selectedTier
              ? `Convert ${selectedTier} points to ${selectedTier} G$`
              : "Select an amount"}
            <ArrowRight size={15} strokeWidth={2.8} />
          </button>
        </>
      )}
      <div className="border-t border-indigo/8 mt-4 py-3">
        <div className="flex items-center gap-1.5 mb-3">
          <Info size={14} strokeWidth={2.5} className="text-fg-soft" />
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft">
            Claim rules
          </span>
        </div>
        <div className="flex justify-between text-[11px] flex-wrap">
          <p className="text-fg-soft">
            Minimum:{" "}
            <span className="font-semibold text-indigo tabular-nums ml-2">
              100 pts
            </span>
          </p>
          <p className="text-fg-soft">
            Max per claim:{" "}
            <span className="font-semibold text-indigo tabular-nums ml-2">
              {" "}
              500 pts
            </span>
          </p>
          <p className="text-fg-soft">
            Weekly cap:{" "}
            <span className="font-semibold text-indigo tabular-nums ml-2">
              1,000 pts
            </span>
          </p>
          <p className="text-fg-soft">
            This week:{" "}
            <span className="font-semibold text-indigo tabular-nums ml-2">
              {" "}
              {weeklyRemaining.toLocaleString()} left
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
