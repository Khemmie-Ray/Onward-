"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Coins,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { LoopSigil, MudclothPattern, SunMotif } from "@/components/home/motifs";

/**
 * Celebration screen with streaming transaction state.
 *
 *   - Badge image shows immediately if known (from props), otherwise sigil
 *   - g$ counter tickers up
 *   - Tx hashes start as null (pending) and fill in as parent receives them
 *   - On onchainError, shows a friendly "minting in background" message
 *     instead of breaking the celebration
 */
export function CompletionScreen({
  moduleTitle,
  moduleSlug: _moduleSlug,
  rewardAmount,
  correctCount,
  totalQuestions,
  badgeImageUrl,
  badgeTxHash,
  rewardTxHash,
  onchainError,
}: {
  moduleTitle: string;
  moduleSlug: string;
  rewardAmount: number;
  correctCount: number;
  totalQuestions: number;
  badgeImageUrl?: string | null;
  badgeTxHash?: string | null;
  rewardTxHash?: string | null;
  onchainError?: string | null;
}) {
  const [displayedReward, setDisplayedReward] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    let rafId: number;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedReward(Math.floor(eased * rewardAmount));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [rewardAmount]);

  const perfect = correctCount === totalQuestions;

  const resolvedImageUrl = badgeImageUrl
    ? badgeImageUrl.startsWith("ipfs://")
      ? `https://gateway.pinata.cloud/ipfs/${badgeImageUrl.slice(7)}`
      : badgeImageUrl
    : null;

  const ZERO_HASH = "0x" + "0".repeat(64);
  const isRealHash = (h?: string | null): h is string =>
    !!h && h !== ZERO_HASH && h.length > 10;

  const badgeReady = isRealHash(badgeTxHash);
  const rewardReady = isRealHash(rewardTxHash);
  const txPending = !badgeReady || !rewardReady;

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[10%] left-[15%] h-[400px] w-[400px] rounded-full opacity-50 blur-[100px] bg-[radial-gradient(circle,rgba(230,180,72,0.6)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[10%] right-[15%] h-[400px] w-[400px] rounded-full opacity-40 blur-[100px] bg-[radial-gradient(circle,rgba(199,93,63,0.5)_0%,transparent_70%)]"
      />

      <div className="relative w-full max-w-[480px] flex flex-col items-center text-center animate-[fade-up_0.8s_ease_both]">
        <div className="relative mb-7">
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-mustard"
            style={{ animation: "spin 20s linear infinite" }}
          >
            <SunMotif size={220} rays={12} />
          </div>
          <div className="relative bg-paper rounded-full p-3 shadow-[0_20px_50px_rgba(31,58,110,0.15)]">
            {resolvedImageUrl ? (
              <div className="relative w-[140px] h-[140px] rounded-full overflow-hidden">
                <Image
                  src={resolvedImageUrl}
                  alt={`${moduleTitle} badge`}
                  fill
                  sizes="140px"
                  className="object-cover"
                  onLoad={() => setImageLoaded(true)}
                  priority
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-paper">
                    <LoopSigil size={64} color="var(--color-indigo)" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-[140px] h-[140px] flex items-center justify-center">
                <LoopSigil size={64} color="var(--color-indigo)" />
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-forest mb-3">
          Badge earned
        </div>

        <h1 className="display text-[40px] md:text-[48px] font-bold leading-[1.05] tracking-[-0.025em] text-indigo mb-2">
          {moduleTitle}
        </h1>

        <p className="text-[14px] text-fg-soft mb-8 max-w-[360px]">
          A soulbound badge is on its way to your wallet. Yours forever,
          onchain, on Celo.
        </p>

        <div className="relative w-full bg-aubergine rounded-[20px] p-6 mb-3 overflow-hidden shadow-[0_12px_32px_rgba(91,46,92,0.25)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 text-paper opacity-[0.06]"
          >
            <MudclothPattern />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-mustard mb-1">
                Reward
              </div>
              <div className="text-[13px] text-paper/80">
                Sent to your wallet
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <Coins size={20} strokeWidth={2.5} className="text-mustard" />
              <span className="display text-[42px] font-bold leading-none tabular-nums text-mustard">
                +{displayedReward}
              </span>
              <span className="text-[14px] font-bold text-mustard">g$</span>
            </div>
          </div>
        </div>

        {perfect && (
          <div className="w-full bg-forest-tint rounded-[14px] p-3 mb-3 animate-[fade-up_0.8s_0.3s_ease_both]">
            <div className="text-[12px] font-bold text-forest text-center">
              ⚡ Perfect score · {correctCount} of {totalQuestions} on first try
            </div>
          </div>
        )}

        {/* Transaction status row */}
        <div className="w-full mb-6 text-[11px]">
          {onchainError ? (
            <div className="flex items-center justify-center gap-2 rounded-[10px] bg-terracotta-tint px-3 py-2 text-terracotta">
              <AlertCircle size={12} strokeWidth={2.5} />
              <span className="font-semibold">
                Minting in background — refresh in a moment
              </span>
            </div>
          ) : txPending ? (
            <div className="flex items-center justify-center gap-2 text-fg-soft">
              <Loader2 size={12} strokeWidth={2.5} className="animate-spin" />
              <span className="font-semibold">Confirming on Celo Sepolia…</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <a
                href={`https://celo-sepolia.blockscout.com/tx/${badgeTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-aubergine hover:opacity-80"
              >
                View badge mint <ExternalLink size={10} strokeWidth={2.5} />
              </a>
              <span className="text-fg-faint">·</span>
              <a
                href={`https://celo-sepolia.blockscout.com/tx/${rewardTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-aubergine hover:opacity-80"
              >
                View reward tx <ExternalLink size={10} strokeWidth={2.5} />
              </a>
            </div>
          )}
        </div>

        <Link
          href="/modules"
          className="inline-flex items-center gap-2 rounded-full bg-terracotta px-7 py-3.5 text-[14px] font-bold text-paper shadow-[0_6px_20px_rgba(199,93,63,0.35)] transition-transform hover:-translate-y-0.5 animate-[fade-up_0.8s_0.5s_ease_both]"
        >
          Back to modules
          <ArrowRight size={16} strokeWidth={2.8} />
        </Link>
      </div>
    </div>
  );
}
