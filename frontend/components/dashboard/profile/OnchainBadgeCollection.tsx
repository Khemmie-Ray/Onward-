"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, Lock, X } from "lucide-react";
import { tintForCategory } from "@/lib/themes/tones";
import { LoopSigil, MudclothPattern } from "@/components/home/motifs";
import { useAuthFetch } from "@/hooks/useAuthFetch";

type OnchainBadge = {
  slug: string;
  label: string;
  category: string;
  deprecated: boolean;
  owned: boolean;
  tokenId: string | null;
  tokenURI: string | null;
  explorerUrl?: string | null;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
  } | null;
};

type BadgesResponse = {
  owned: OnchainBadge[];
  unearned: OnchainBadge[];
  total_owned: number;
};

type Category = "Foundations" | "Identity" | "Economics" | "Safety" | "Utility";

function resolveCategory(cat: string): Category {
  switch (cat) {
    case "Foundations":
    case "Identity":
    case "Economics":
    case "Safety":
    case "Utility":
      return cat;
    default:
      return "Utility";
  }
}

function resolveImage(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw.startsWith("ipfs://")
    ? `https://gateway.pinata.cloud/ipfs/${raw.slice(7)}`
    : raw;
}

export function OnchainBadgeCollection() {
  const authFetch = useAuthFetch();
  const [data, setData] = useState<BadgesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OnchainBadge | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/profile/badges");
        if (!res.ok) return;
        const json = (await res.json()) as BadgesResponse;
        if (!cancelled) setData(json);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-[18px] bg-canvas-warm animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[13px] font-semibold text-indigo">
          {data.total_owned} {data.total_owned === 1 ? "badge" : "badges"}{" "}
          earned
        </span>
      </div>

      {data.owned.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {data.owned.map((badge) => (
            <BadgeTile
              key={badge.slug}
              badge={badge}
              owned
              onClick={() => setSelected(badge)}
            />
          ))}
        </div>
      )}

      {data.unearned.length > 0 && (
        <>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft mb-3">
            Still to earn
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {data.unearned.map((badge) => (
              <BadgeTile key={badge.slug} badge={badge} owned={false} />
            ))}
          </div>
        </>
      )}

      {selected && (
        <BadgeDetail badge={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function BadgeTile({
  badge,
  owned,
  onClick,
}: {
  badge: OnchainBadge;
  owned: boolean;
  onClick?: () => void;
}) {
  const t = tintForCategory(resolveCategory(badge.category));
  const resolvedImage = resolveImage(badge.metadata?.image);

  if (!owned) {
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
    <button
      onClick={onClick}
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
              alt={`${badge.label} badge`}
              fill
              sizes="100px"
              className="object-contain rounded-full"
              unoptimized
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
            {badge.label}
          </div>
          <div
            className={`text-[9px] font-bold uppercase tracking-[0.12em] ${t.accent}`}
          >
            {badge.category}
          </div>
        </div>
      </div>

      {badge.deprecated && (
        <div className="absolute top-2 right-2 bg-indigo/80 text-cream text-[7px] font-bold uppercase px-1.5 py-0.5 rounded z-10">
          Legacy
        </div>
      )}
    </button>
  );
}

function BadgeDetail({
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

        <div
          className={`mb-5 mx-auto h-[140px] w-[140px] relative rounded-full overflow-hidden ${t.bg}`}
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
