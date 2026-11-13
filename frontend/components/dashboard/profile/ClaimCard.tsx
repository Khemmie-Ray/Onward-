"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Info,
  ShieldCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useIdentityContext } from "@/contexts/IdentityContext";
import { useClaim, CLAIM_TIERS, type ClaimTier } from "@/hooks/useClaim";
import { EXPLORER_BASE } from "@/constants/contracts/address";

function GCoin({ size = 22 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-mustard font-bold text-indigo"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      G$
    </span>
  );
}

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

  return (
    <div className="rounded-[20px] bg-indigo p-5 text-cream sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <GCoin />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-cream/60">
              Convert points to G$
            </span>
          </div>
          <div className="display text-[34px] font-bold leading-none tabular-nums">
            {balance.toLocaleString()}
            <span className="ml-1.5 font-bold text-cream/50">
              points
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-cream/50">
            Claimable now
          </div>
          <div className="display text-[22px] font-bold tabular-nums text-[#9BE3B4]">
            {claimableG.toLocaleString()} G$
          </div>
        </div>
      </div>

      {!isVerified ? (
        <>
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-mustard/10 p-3">
            <ShieldCheck
              size={14}
              strokeWidth={2.5}
              className="mt-0.5 shrink-0 text-mustard"
            />
            <div>
              <p className="text-[12px] font-bold leading-snug text-cream">
                Verify to convert points
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-cream/60">
                Converting points to G$ needs a verified GoodID, so the reward
                reaches one real person. Verification takes about a minute.
              </p>
            </div>
          </div>

          <button
            onClick={startVerifying}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-mustard py-3.5 text-sm font-bold text-indigo transition hover:brightness-105"
          >
            Verify first
            <ArrowRight size={15} strokeWidth={2.8} />
          </button>
        </>
      ) : (
        <>
          <div className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-cream/50">
            Pick an amount
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {CLAIM_TIERS.map((tier) => {
              const claimable = canClaimTier(tier);
              const isSelected = selectedTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => claimable && setSelectedTier(tier)}
                  disabled={!claimable || claiming}
                  className={`rounded-2xl py-4 text-center transition ${
                    isSelected
                      ? "bg-mustard text-indigo"
                      : claimable
                        ? "bg-cream/5 text-cream hover:bg-cream/10"
                        : "cursor-not-allowed bg-cream/5 text-cream/30"
                  }`}
                >
                  <div className="display text-[24px] font-bold leading-none tabular-nums">
                    {tier}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold opacity-70">
                    = {tier} G$
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleClaim}
            disabled={!selectedTier || claiming}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-mustard py-3.5 text-sm font-bold text-indigo transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {claiming ? (
              <>
                <Loader2 size={15} strokeWidth={2.8} className="animate-spin" />
                Converting…
              </>
            ) : selectedTier ? (
              <>
                Convert {selectedTier} points → {selectedTier} G$
              </>
            ) : (
              "Pick an amount"
            )}
          </button>

          {lastTx && (
            <a
              href={`${EXPLORER_BASE}tx/${lastTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#9BE3B4] transition hover:opacity-80"
            >
              View your last claim
              <ExternalLink size={12} strokeWidth={2.5} />
            </a>
          )}

          {claimableG === 0 && balance >= 100 && !loadingStatus && (
            <p className="mt-3 text-center text-[11.5px] leading-snug text-cream/60">
              You&apos;ve hit your claim limit for now. Check back after your
              daily or weekly window resets.
            </p>
          )}
        </>
      )}

      <div className="mt-5 border-t border-cream/10 pt-4">
        <div className="mb-3 flex items-center gap-1.5">
          <Info size={13} strokeWidth={2.5} className="text-cream/50" />
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-cream/50">
            Claim rules
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <RuleChip label="Minimum" value="100 pts" />
          <RuleChip label="Daily cap" value="500 G$" />
          <RuleChip label="Weekly cap" value="1,000 G$" />
        </div>
      </div>
    </div>
  );
}

function RuleChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-cream/5 px-3 py-1.5 text-[11px] text-cream/70">
      {label} <span className="font-bold text-cream">{value}</span>
    </span>
  );
}
