"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  Trophy,
} from "lucide-react";

export function CompletionScreen({
  moduleTitle,
  moduleSlug: _moduleSlug,
  rewardAmount,
  correctCount,
  totalQuestions,
  recapPoints = [],
  badgeImageUrl,
  badgeTxHash,
  badgeTokenId,
  alreadyMinted,
  onchainError,
  onNext,
  onExit,
  trackTitle,
}: {
  moduleTitle: string;
  moduleSlug: string;
  rewardAmount: number;
  correctCount: number;
  totalQuestions: number;
  /** What the learner can now do, from the section's recap. */
  recapPoints?: string[];
  badgeImageUrl?: string | null;
  badgeTxHash?: string | null;
  badgeTokenId?: string | null;
  alreadyMinted?: boolean;
  onchainError?: string | null;
  onNext: () => void;
  onExit?: () => void;
  trackTitle?: string;
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

  const resolvedImageUrl = badgeImageUrl
    ? badgeImageUrl.startsWith("ipfs://")
      ? `https://gateway.pinata.cloud/ipfs/${badgeImageUrl.slice(7)}`
      : badgeImageUrl
    : null;

  const ZERO_HASH = "0x" + "0".repeat(64);
  const isRealHash = (h?: string | null): h is string =>
    !!h && h !== ZERO_HASH && h.length > 10;

  const badgeReady =
    isRealHash(badgeTxHash) ||
    alreadyMinted === true ||
    (!!badgeTokenId && badgeTokenId !== "0");

  const txPending = !badgeReady;

  return (
    <div className="no-scrollbar fixed inset-0 z-60 overflow-y-auto bg-indigo text-paper md:static md:z-auto md:min-h-130 md:rounded-[28px]">
      <div className="mx-auto flex min-h-full w-full max-w-115 flex-col gap-4 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-8 md:py-10">
        <div className="flex flex-col items-center gap-2.5 text-center animate-[fade-up_0.6s_ease_both]">
          {resolvedImageUrl ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-paper ring-4 ring-mustard">
              <Image
                src={resolvedImageUrl}
                alt={`${moduleTitle} badge`}
                fill
                sizes="96px"
                className="object-cover"
                onLoad={() => setImageLoaded(true)}
                priority
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-mustard text-indigo">
                  <Trophy size={36} strokeWidth={2} />
                </div>
              )}
            </div>
          ) : (
            <span className="flex h-19 w-19 -rotate-6 items-center justify-center rounded-[26px] bg-mustard text-indigo">
              <Trophy size={38} strokeWidth={2} />
            </span>
          )}
          <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#CDC4FB]">
            Section complete
          </span>
          <h1 className="display text-[30px] font-bold leading-[1.1] tracking-[-0.02em]">
            {moduleTitle}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-0.5 rounded-[18px] bg-mint p-3.5 text-indigo">
            <b className="display text-[26px] tabular-nums">
              +{displayedReward}
            </b>
            <span className="text-[12px] font-semibold">points earned</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-[18px] bg-[#CDC4FB] p-3.5 text-indigo">
            <b className="display text-[26px] tabular-nums">
              {correctCount}/{totalQuestions}
            </b>
            <span className="text-[12px] font-semibold">right first time</span>
          </div>
        </div>

        {recapPoints.length > 0 && (
          <div className="flex flex-col gap-3 rounded-[22px] bg-paper p-4.5 text-indigo">
            <b className="display text-[17px]">What you can do now</b>
            {recapPoints.map((point) => (
              <div key={point} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-mint">
                  <Check size={12} strokeWidth={3.5} />
                </span>
                <span className="text-[13.5px] leading-normal">{point}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-[12px]">
          {onchainError ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-terracotta-tint px-3 py-2 text-terracotta">
              <AlertCircle size={13} strokeWidth={2.5} />
              <span className="font-semibold">
                Your badge is still minting. Refresh in a moment.
              </span>
            </div>
          ) : txPending ? (
            <div className="flex items-center justify-center gap-2 text-paper/75">
              <Loader2 size={13} strokeWidth={2.5} className="animate-spin" />
              <span className="font-semibold">Minting your badge on Celo…</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <a
                href={`https://celoscan.io/tx/${badgeTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-mint hover:opacity-80"
              >
                View your badge on Celoscan{" "}
                <ExternalLink size={11} strokeWidth={2.5} />
              </a>
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-13.5 w-full items-center justify-center gap-2 rounded-full bg-mint text-[16px] font-bold text-indigo shadow-[0_4px_0_#3A6B47] transition hover:bg-mint/90 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-indigo"
          >
            Choose your next
            <ArrowRight size={16} strokeWidth={2.8} />
          </button>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="min-h-12 w-full rounded-full border-2 border-paper/25 text-[15px] font-semibold text-paper transition hover:bg-paper/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper"
            >
              Back to {trackTitle ?? "the track"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
