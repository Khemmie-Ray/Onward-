"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useIdentityContext } from "@/contexts/IdentityContext";
import { PanelCard } from "@/components/shell/PanelCard";

export function VerifyUbiCard() {
  const {
    fvLink,
    startVerifying,
    stopVerifying,
    isVerifying,
    status,
    errorMessage,
    retry,
  } = useIdentityContext();

  return (
    <PanelCard variant="outline">
      <div className="mb-2.5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-tint text-forest">
          <ShieldCheck size={20} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="display text-[17px] font-bold leading-tight text-indigo">
            Verify to claim UBI and earn more benefits
          </h3>
        </div>
        {isVerifying && (
          <button
            type="button"
            onClick={stopVerifying}
            aria-label="Cancel"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-fg-soft hover:bg-canvas-warm hover:text-indigo"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        )}
      </div>
      <p className="mb-4 text-[12.5px] leading-snug text-fg-soft">
        Daily G$ UBI, staked rounds and G$ payouts open after one GoodID check.
      </p>

      {!isVerifying && (
        <button
          type="button"
          onClick={startVerifying}
          className="flex w-full items-center justify-between rounded-full bg-indigo py-2.5 pl-5 pr-2 text-[13px] font-semibold text-paper transition hover:bg-indigo/90"
        >
          Verify with GoodID
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-paper">
            <ArrowUpRight size={14} strokeWidth={2.6} />
          </span>
        </button>
      )}
      {isVerifying && (
        <>
          {status === "error" ? (
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 rounded-xl border border-terracotta/30 bg-terracotta/10 p-2.5">
                <AlertTriangle
                  size={14}
                  strokeWidth={2.5}
                  className="mt-0.5 shrink-0 text-terracotta"
                />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold leading-tight text-indigo">
                    Couldn&apos;t start verification
                  </p>
                  <p className="mt-0.5 wrap-break-word text-[11px] leading-snug text-fg-soft">
                    {errorMessage ?? "Something went wrong. Please try again."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={retry}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo py-2.5 text-[12.5px] font-semibold text-paper hover:bg-indigo/90"
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
            <div className="space-y-2.5">
              <a
                href={fvLink}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-between rounded-full bg-indigo py-2.5 pl-5 pr-2 text-[13px] font-semibold text-paper transition hover:bg-indigo/90"
              >
                Open GoodID verification
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-paper">
                  <ArrowUpRight size={14} strokeWidth={2.6} />
                </span>
              </a>
            </div>
          )}
        </>
      )}

      {!isVerifying && (
        <div className="mt-4 space-y-2 border-t border-canvas-warm pt-4">
          <Bullet text="One-time setup, takes about 2 minutes" />
          <Bullet text="Unlocks daily UBI and direct G$ payouts" />
          <Bullet text="Privacy-preserved — your face becomes a hash" />
        </div>
      )}
    </PanelCard>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Check
        size={12}
        strokeWidth={3}
        className="mt-0.5 shrink-0 text-forest"
      />
      <span className="text-[11.5px] leading-tight text-fg-soft">{text}</span>
    </div>
  );
}
