"use client";

import { ArrowRight, Loader2, Lock, Sparkles } from "lucide-react";
import { formatUnits } from "viem";
import { MudclothPattern } from "@/components/home/motifs";
import { usePendingClaim } from "@/hooks/usePendingClaim";
import { useIdentityContext } from "@/contexts/IdentityContext";


export function PendingClaimCard() {
  const { pendingBalance, claim, isClaiming, canClaim, isLoading } =
    usePendingClaim();
  const { isVerified, startVerifying } = useIdentityContext();

  if (isLoading) return null;
  if (pendingBalance === 0n) return null;

  const formatted = parseFloat(formatUnits(pendingBalance, 18)).toLocaleString(
    undefined,
    { maximumFractionDigits: 2 }
  );

  if (!isVerified) {
    return (
      <div className="relative overflow-hidden rounded-[20px] bg-mustard-tint p-5 mb-4 animate-[fade-up_0.6s_ease_both]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-indigo opacity-[0.04]"
        >
          <MudclothPattern />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-mustard">
            <Lock size={18} strokeWidth={2.5} className="text-indigo" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-soft mb-1">
              Pending G$
            </div>
            <div className="display text-[26px] font-bold tabular-nums text-indigo leading-none">
              {formatted}
              <span className="text-[14px] text-fg-soft ml-1">g$</span>
            </div>
            <p className="text-[11.5px] text-fg-soft mt-1.5 leading-tight">
              Earned but locked. Verify with GoodID to claim.
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

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-forest-tint p-5 mb-4 animate-[fade-up_0.6s_ease_both]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-indigo opacity-[0.04]"
      >
        <MudclothPattern />
      </div>
      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-forest">
          <Sparkles size={18} strokeWidth={2.5} className="text-paper" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest mb-1">
            Ready to claim
          </div>
          <div className="display text-[26px] font-bold tabular-nums text-indigo leading-none">
            {formatted}
            <span className="text-[14px] text-fg-soft ml-1">g$</span>
          </div>
          <p className="text-[11.5px] text-fg-soft mt-1.5 leading-tight">
            Earned across your modules. Pull it to your wallet — we pay the gas.
          </p>
        </div>
        <button
          onClick={claim}
          disabled={!canClaim || isClaiming}
          className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2.5 text-[12px] font-bold text-paper hover:bg-forest/90 disabled:bg-forest/40 disabled:cursor-not-allowed transition-all flex-shrink-0"
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
