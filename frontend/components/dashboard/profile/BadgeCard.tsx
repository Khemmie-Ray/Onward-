"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock, X } from "lucide-react";
import { tintForCategory } from "@/lib/themes/tones";
import { LoopSigil, MudclothPattern } from "@/components/home/motifs";
import type { ProfileBadge } from "@/lib/data/profile";
import { BadgeDetailModal } from "./BadgeDetail";

export function BadgeCard({ badge }: { badge: ProfileBadge }) {
  const [open, setOpen] = useState(false);
  const t = tintForCategory(badge.category);

  const resolvedImage = badge.imageUrl
    ? badge.imageUrl.startsWith("ipfs://")
      ? `https://gateway.pinata.cloud/ipfs/${badge.imageUrl.slice(7)}`
      : badge.imageUrl
    : null;

  if (!badge.earned) {
    return (
      <div
        className={`relative overflow-hidden rounded-[18px] p-4 ${t.bg} opacity-70`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-indigo opacity-[0.04]"
        >
          <MudclothPattern />
        </div>
        <div className="relative">
          <div
            className={`mb-3 mx-auto flex h-[100px] w-[100px] items-center justify-center rounded-full ${t.iconBg} opacity-50`}
          >
            <Lock size={28} strokeWidth={2.5} className={t.iconColor} />
          </div>
          <div className="text-center">
            <div className="display text-[13px] font-bold text-indigo/50 mb-0.5">
              ???
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-fg-soft">
              Locked
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group relative overflow-hidden rounded-[18px] p-4 ${t.bg} shadow-[0_6px_20px_rgba(31,58,110,0.08)] transition-transform hover:-translate-y-1 cursor-pointer text-left w-full`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-indigo opacity-[0.04]"
        >
          <MudclothPattern />
        </div>
        <div className="relative">
          <div className="mb-3 mx-auto h-[100px] w-[100px] relative">
            {resolvedImage ? (
              <Image
                src={resolvedImage}
                alt={`${badge.moduleTitle} badge`}
                fill
                sizes="100px"
                className="object-contain rounded-full"
              />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center rounded-full ${t.iconBg}`}
              >
                <LoopSigil size={48} className={t.iconColor} />
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="display text-[13px] font-bold text-indigo leading-tight mb-0.5 line-clamp-2">
              {badge.moduleTitle}
            </div>
            <div
              className={`text-[9px] font-bold uppercase tracking-[0.12em] ${t.accent}`}
            >
              {badge.category}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <BadgeDetailModal
          badge={badge}
          resolvedImage={resolvedImage}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
