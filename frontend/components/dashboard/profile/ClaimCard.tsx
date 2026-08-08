"use client";

import { useEffect, useRef, useState } from "react";
import {
  Coins,
  Lock,
  ArrowRight,
  Info,
  ShieldCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useIdentityContext } from "@/contexts/IdentityContext";
import { useClaim, CLAIM_TIERS, type ClaimTier } from "@/hooks/useClaim";
import { EXPLORER_BASE } from "@/constants/contracts/address";

export function ClaimCard({ onClaimed }: { onClaimed?: () => void } = {}) {
  const { isVerified, startVerifying } = useIdentityContext();
  const { status, loadingStatus, claiming, lastTx, canClaimTier, claim } =
    useClaim();

  const notifiedTxRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastTx && notifiedTxRef.current !== lastTx) {
      notifiedTxRef.current = lastTx;
      onClaimed?.();
    }
  }, [lastTx, onClaimed]);

  const [selectedTier, setSelectedTier] = useState<ClaimTier | null>(null);

  const balance = status?.points_balance ?? 0;
  const claimableG = status?.claimable_g ?? 0;

  const handleClaim = async () => {
    if (!selectedTier) return;
    const ok = await claim(selectedTier);
    if (ok) setSelectedTier(null);
  };

  console.log(selectedTier);

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
            Claimable now
          </div>
          <div className="display text-[20px] font-bold text-forest tabular-nums">
            {claimableG.toLocaleString()} G$
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
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft mb-2">
              Pick an amount
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CLAIM_TIERS.map((tier) => {
                const claimable = canClaimTier(tier);
                const isSelected = selectedTier === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => claimable && setSelectedTier(tier)}
                    disabled={!claimable || claiming}
                    className={`rounded-xl p-3 text-center transition ${
                      isSelected
                        ? "bg-indigo text-cream"
                        : claimable
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
            onClick={handleClaim}
            disabled={!selectedTier || claiming}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 mb-4 lg:w-[50%] md:w-[50%] mx-auto ${
              !selectedTier || claiming
                ? "bg-indigo/40 text-cream cursor-not-allowed"
                : "bg-indigo text-cream hover:bg-indigo/90"
            }`}
          >
            {claiming ? (
              <>
                <Loader2 size={15} strokeWidth={2.8} className="animate-spin" />
                Converting...
              </>
            ) : selectedTier ? (
              <>
                Convert {selectedTier} points to {selectedTier} G$
                <ArrowRight size={15} strokeWidth={2.8} />
              </>
            ) : (
              "Select an amount"
            )}
          </button>

          {lastTx && (
            <a
              href={`${EXPLORER_BASE}tx/${lastTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-forest hover:text-forest/80 transition mb-4"
            >
              View your last claim
              <ExternalLink size={12} strokeWidth={2.5} />
            </a>
          )}

          {claimableG === 0 && balance >= 100 && !loadingStatus && (
            <p className="text-[11px] text-fg-soft text-center mb-4 leading-snug">
              You&apos;ve hit your claim limit for now. Check back after your
              daily or weekly window resets.
            </p>
          )}
        </>
      )}

      <div className="border-t border-indigo/8 mt-4 py-3">
        <div className="flex items-center gap-1.5 mb-3">
          <Info size={14} strokeWidth={2.5} className="text-fg-soft" />
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft">
            Claim rules
          </span>
        </div>
        <div className="flex justify-between text-[11px] flex-wrap gap-y-1.5">
          <p className="text-fg-soft">
            Minimum:{" "}
            <span className="font-semibold text-indigo tabular-nums ml-2">
              100 pts
            </span>
          </p>
          <p className="text-fg-soft">
            Daily cap:{" "}
            <span className="font-semibold text-indigo tabular-nums ml-2">
              500 G$
            </span>
          </p>
          <p className="text-fg-soft">
            Weekly cap:{" "}
            <span className="font-semibold text-indigo tabular-nums ml-2">
              1,000 G$
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
