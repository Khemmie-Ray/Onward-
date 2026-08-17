"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useIdentityContext } from "@/contexts/IdentityContext";

export function VerificationBanner() {
  const {
    isVerified,
    isLoading,
    fvLink,
    startVerifying,
    stopVerifying,
    isVerifying,
    status,
    errorMessage,
    retry,
  } = useIdentityContext();

  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isVerified || isLoading || dismissed) return null;
  if (status === "error" && !isVerifying && !expanded) return null;

  if (!expanded) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-mustard-tint border border-mustard/30 p-4 animate-[fade-up_0.5s_ease_both]">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-mustard">
          <ShieldCheck size={16} strokeWidth={2.5} className="text-indigo" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-indigo leading-tight">
            Verify with GoodID to unlock direct G$ payouts
          </p>
          <p className="text-[11.5px] text-fg-soft mt-0.5">
            Your earnings are accruing safely until you verify.
          </p>
        </div>
        <button
          onClick={() => {
            setExpanded(true);
            startVerifying();
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo px-3.5 py-2 text-[11.5px] font-bold text-paper hover:bg-indigo/90 transition-all flex-shrink-0"
        >
          Verify
          <ArrowRight size={11} strokeWidth={2.8} />
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-fg-soft hover:bg-paper hover:text-indigo transition-colors"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl bg-paper border border-mustard/40 p-5 animate-[fade-up_0.5s_ease_both] shadow-[0_8px_24px_rgba(31,58,110,0.06)]">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-mustard">
          <ShieldCheck size={18} strokeWidth={2.5} className="text-indigo" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="display text-[16px] font-bold text-indigo leading-tight">
            Verify with GoodID
          </h3>
          <p className="text-[12.5px] text-fg-soft mt-1 leading-relaxed">
            GoodDollar uses face verification to prove you're a unique human.
            One-time process. After verifying, your accrued G$ becomes claimable
            and you can claim daily UBI too.
          </p>
        </div>
        <button
          onClick={() => {
            setExpanded(false);
            stopVerifying();
          }}
          aria-label="Close"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-fg-soft hover:bg-canvas-warm hover:text-indigo transition-colors"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      {status === "error" ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 rounded-xl bg-terracotta/10 border border-terracotta/30 p-3">
            <AlertTriangle
              size={16}
              strokeWidth={2.5}
              className="text-terracotta flex-shrink-0 mt-0.5"
            />
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold text-indigo leading-tight">
                Couldn&apos;t start verification
              </p>
              <p className="text-[11.5px] text-fg-soft mt-0.5 leading-snug break-words">
                {errorMessage ?? "Something went wrong. Please try again."}
              </p>
            </div>
          </div>
          <button
            onClick={retry}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo px-4 py-3 text-[13px] font-bold text-paper hover:bg-indigo/90 transition-all"
          >
            <RefreshCw size={13} strokeWidth={2.8} />
            Try again
          </button>
        </div>
      ) : !fvLink ? (
        <div className="flex items-center justify-center gap-2 py-3 text-[12px] text-fg-soft">
          <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
          Preparing verification link…
        </div>
      ) : (
        <div className="space-y-3">
          <a
            href={fvLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo px-4 py-3 text-[13px] font-bold text-paper hover:bg-indigo/90 transition-all"
          >
            Open GoodID verification
            <ArrowRight size={13} strokeWidth={2.8} />
          </a>
          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-fg-soft">
              <Loader2 size={11} strokeWidth={2.5} className="animate-spin" />
              Checking for verification… this page will update automatically.
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-canvas-warm space-y-2">
        <BulletPoint text="One-time setup, takes about 2 minutes" />
        <BulletPoint text="Unlocks direct G$ payouts and daily UBI" />
        <BulletPoint text="Privacy-preserved — face becomes a hash" />
      </div>
    </div>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Check
        size={12}
        strokeWidth={3}
        className="text-forest mt-0.5 flex-shrink-0"
      />
      <span className="text-[11.5px] text-fg-soft leading-tight">{text}</span>
    </div>
  );
}
