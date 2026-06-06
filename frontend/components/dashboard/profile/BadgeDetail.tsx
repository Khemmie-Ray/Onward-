import React from "react";
import Image from "next/image";
import { ExternalLink, X } from "lucide-react";
import { tintForCategory } from "@/lib/themes/tones";
import { LoopSigil } from "@/components/home/motifs";
import type { ProfileBadge } from "@/lib/data/profile";

interface BadgeDetailModalProps {
  badge: ProfileBadge;
  resolvedImage: string | null;
  onClose: () => void;
}

export function BadgeDetailModal({ badge, resolvedImage, onClose }: BadgeDetailModalProps) {
  const t = tintForCategory(badge.category);
  
  const earnedDate = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-[fade-up_0.2s_ease_both]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] rounded-[24px] bg-paper p-6 shadow-[0_24px_60px_rgba(0,0,0,0.20)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-canvas-warm text-fg-soft hover:text-indigo"
          aria-label="Close"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <div className={`mb-5 mx-auto h-[140px] w-[140px] relative rounded-full overflow-hidden ${t.bg}`}>
          {resolvedImage ? (
            <Image
              src={resolvedImage}
              alt={`${badge.moduleTitle} badge`}
              fill
              sizes="140px"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <LoopSigil size={64} className={t.iconColor} />
            </div>
          )}
        </div>

        <div className="text-center mb-4">
          <div className={`text-[10px] font-bold uppercase tracking-[0.14em] ${t.accent} mb-2`}>
            {badge.category} · Soulbound
          </div>
          <h2 className="display text-[22px] font-bold leading-[1.2] tracking-[-0.015em] text-indigo mb-1">
            {badge.moduleTitle}
          </h2>
          {earnedDate && (
            <p className="text-[12px] text-fg-soft">Earned {earnedDate}</p>
          )}
        </div>

        <div className="rounded-[12px] bg-canvas-warm p-4 mb-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-fg-soft">Reward received</span>
            <span className="display font-bold text-indigo">
              +{badge.rewardAmount} g$
            </span>
          </div>
        </div>

        {badge.explorerUrl && (
          <a
            href={badge.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-aubergine hover:opacity-80"
          >
            View on Celo Sepolia <ExternalLink size={11} strokeWidth={2.5} />
          </a>
        )}
      </div>
    </div>
  );
}