"use client";

import { ArrowRight, Clock, Coins, Loader2, Lock, Sparkles } from "lucide-react";
import { formatUnits } from "viem";
import { MudclothPattern, SunMotif } from "@/components/home/motifs";
import { useGoodDollarClaim } from "@/hooks/useGoodDollarClaim";
import { useIdentityContext } from "@/contexts/IdentityContext";

export function UBIClaimCard() {
  const { state, entitlement, nextClaimTime, claim, isClaiming } =
    useGoodDollarClaim();
  const { isVerified, startVerifying } = useIdentityContext();

  if (state === "idle" || state === "checking") {
    return (
      <div className="rounded-[20px] bg-paper p-5 mb-4 shadow-[0_6px_20px_rgba(31,58,110,0.06)]">
        <div className="flex items-center gap-3">
          <Loader2 size={16} strokeWidth={2.5} className="text-indigo animate-spin" />
          <span className="text-[12px] text-fg-soft">
            Checking your UBI entitlement…
          </span>
        </div>
      </div>
    );
  }

  if (state === "not_verified" || !isVerified) {
    return (
      <div className="relative overflow-hidden rounded-[20px] bg-canvas-warm p-5 mb-4 animate-[fade-up_0.6s_ease_both]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-canvas-warm border-2 border-paper">
            <Lock size={18} strokeWidth={2.5} className="text-fg-soft" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-soft mb-1">
              Daily UBI
            </div>
            <div className="display text-[20px] font-bold text-indigo leading-tight">
              Locked
            </div>
            <p className="text-[11.5px] text-fg-soft mt-1 leading-tight">
              Verify with GoodID to claim a daily basic income in G$.
            </p>
          </div>
          <button
            onClick={startVerifying}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo px-3.5 py-2 text-[11.5px] font-bold text-paper hover:bg-indigo/90 transition-all flex-shrink-0"
          >
            Verify
            <ArrowRight size={11} strokeWidth={2.8} />
          </button>
        </div>
      </div>
    );
  }

  if (state === "claimed_today") {
    return (
      <div className="relative overflow-hidden rounded-[20px] bg-paper p-5 mb-4 animate-[fade-up_0.6s_ease_both] shadow-[0_6px_20px_rgba(31,58,110,0.06)]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-forest-tint">
            <Sparkles size={18} strokeWidth={2.5} className="text-forest" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest mb-1">
              UBI Claimed
            </div>
            <div className="display text-[18px] font-bold text-indigo leading-tight">
              You're done for today
            </div>
            {nextClaimTime && (
              <p className="text-[11.5px] text-fg-soft mt-1 flex items-center gap-1.5">
                <Clock size={11} strokeWidth={2.5} />
                Next claim: {formatNextClaim(nextClaimTime)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const entitlementDisplay = parseFloat(
    formatUnits(entitlement, 18)
  ).toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-aubergine p-5 mb-4 animate-[fade-up_0.6s_ease_both] shadow-[0_8px_24px_rgba(91,46,92,0.20)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-paper opacity-[0.05]"
      >
        <MudclothPattern />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 text-mustard opacity-30"
      >
        <SunMotif size={120} />
      </div>
      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-mustard">
          <Coins size={20} strokeWidth={2.5} className="text-indigo" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-mustard mb-1">
            Today's UBI
          </div>
          <div className="display text-[26px] font-bold tabular-nums text-paper leading-none">
            {entitlementDisplay}
            <span className="text-[14px] text-mustard ml-1">g$</span>
          </div>
          <p className="text-[11.5px] text-paper/70 mt-1.5 leading-tight">
            Daily basic income from GoodDollar. You pay gas; UBI lands in your wallet.
          </p>
        </div>
        <button
          onClick={claim}
          disabled={isClaiming}
          className="inline-flex items-center gap-1.5 rounded-full bg-mustard px-4 py-2.5 text-[12px] font-bold text-indigo hover:bg-mustard/90 disabled:bg-mustard/50 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          {isClaiming ? (
            <>
              <Loader2 size={12} strokeWidth={2.5} className="animate-spin" />
              Claiming…
            </>
          ) : (
            <>
              Claim
              <ArrowRight size={11} strokeWidth={2.8} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function formatNextClaim(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  if (diff <= 0) return "any moment";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes}m`;
  if (hours < 24) return `${hours}h ${minutes}m`;
  return date.toLocaleString();
}
