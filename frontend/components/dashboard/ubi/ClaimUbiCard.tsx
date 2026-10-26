"use client";

import { ArrowRight, Clock, Coins, Loader2, Sparkles } from "lucide-react";
import { formatUnits } from "viem";
import { useGoodDollarClaim } from "@/hooks/useGoodDollarClaim";
import { PanelCard } from "@/components/shell/PanelCard";
import { UbiCheckingCard, UbiErrorCard } from "./UbiStatusCard";


export function formatNextClaim(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "a moment";
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours === 0) return `${minutes}m`;
  if (hours < 24) return `${hours}h ${minutes}m`;
  return date.toLocaleString();
}

export function ClaimUbiCard() {
  const {
    state,
    entitlement,
    nextClaimTime,
    error,
    claim,
    refetch,
    isClaiming,
    isPreparing,
  } = useGoodDollarClaim();

 
  if (state === "idle" || state === "checking" || state === "not_verified") {
    return <UbiCheckingCard label="Checking today's UBI…" />;
  }

  if (state === "error") {
    return (
      <UbiErrorCard
        title="Couldn't load your UBI"
        message={error ?? "Something went wrong."}
        onRetry={() => void refetch()}
      />
    );
  }

  if (state === "claimed_today") {
    return (
      <PanelCard>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-tint text-forest">
            <Sparkles size={17} strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest">
              UBI claimed
            </div>
            <div className="display text-[15px] font-bold leading-tight text-blue">
              You&apos;re done for today
            </div>
            {nextClaimTime && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-fg-soft">
                <Clock size={10} strokeWidth={2.5} />
                Next claim in {formatNextClaim(nextClaimTime)}
              </p>
            )}
          </div>
        </div>
      </PanelCard>
    );
  }

  const amount = parseFloat(formatUnits(entitlement, 18)).toLocaleString(
    undefined,
    { maximumFractionDigits: 2 },
  );

  return (
    <PanelCard variant="white">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue text-mustard">
          <Coins size={17} strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em]">
            Today&apos;s UBI
          </div>
          <div className="display text-[26px] font-bold leading-none tabular-nums">
            {amount}
            <span className="ml-1 text-[13px]">G$</span>
          </div>
        </div>
      </div>
      <p className="mb-3 mt-2 text-[11.5px] leading-snug text-blue/75">
        Your daily basic income from GoodDollar. We cover the network fee.
      </p>
      <button
        type="button"
        onClick={claim}
        disabled={isClaiming}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-blue py-2.5 text-[12.5px] font-bold text-paper transition hover:bg-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isClaiming ? (
          <>
            <Loader2 size={12} strokeWidth={2.5} className="animate-spin" />
            {isPreparing ? "Preparing…" : "Claiming…"}
          </>
        ) : (
          <>
            Claim {amount} G$
            <ArrowRight size={12} strokeWidth={2.8} />
          </>
        )}
      </button>
    </PanelCard>
  );
}
