"use client";

import Image from "next/image";
import { ExternalLink, X } from "lucide-react";
import { tintForCategory } from "@/lib/themes/tones";
import { LoopSigil } from "@/components/home/motifs";
import type { OnchainBadge } from "./badge-type";
import { resolveCategory, resolveImage } from "./badge-type";

export function BadgeDetail({
  badge,
  onClose,
}: {
  badge: OnchainBadge;
  onClose: () => void;
}) {
  const t = tintForCategory(resolveCategory(badge.category));
  const resolvedImage = resolveImage(badge.metadata?.image);
  const description = badge.metadata?.description;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-[fade-up_0.2s_ease_both]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-105 rounded-[24px] bg-paper p-6 shadow-[0_24px_60px_rgba(0,0,0,0.20)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-canvas-warm text-fg-soft hover:text-indigo"
          aria-label="Close"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <div
          className={`mb-5 mx-auto h-35 w-35 relative rounded-full overflow-hidden ${t.bg}`}
        >
          {resolvedImage ? (
            <Image
              src={resolvedImage}
              alt={`${badge.label} badge`}
              fill
              sizes="140px"
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <LoopSigil size={64} className={t.iconColor} />
            </div>
          )}
        </div>

        <div className="text-center mb-4">
          <div
            className={`text-[10px] font-bold uppercase tracking-[0.14em] ${t.accent} mb-2`}
          >
            {badge.category} · Soulbound
          </div>
          <h2 className="display text-[22px] font-bold leading-[1.2] tracking-[-0.015em] text-indigo mb-1">
            {badge.metadata?.name ?? badge.label}
          </h2>
        </div>

        {description && (
          <div className="rounded-[12px] bg-canvas-warm p-4 mb-4">
            <p className="text-[12px] text-fg-soft leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {badge.explorerUrl && (
          <a
            href={badge.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-aubergine hover:opacity-80"
          >
            View on Celoscan <ExternalLink size={11} strokeWidth={2.5} />
          </a>
        )}
      </div>
    </div>
  );
}
