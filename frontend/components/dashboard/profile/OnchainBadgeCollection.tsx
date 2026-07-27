"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { tintForCategory } from "@/lib/themes/tones";
import { LoopSigil, MudclothPattern } from "@/components/home/motifs";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LEARN_BADGE_SLUGS } from "@/lib/badges/badge-slugs";
import { BadgeDetail } from "./BadgeDetail";
import type { OnchainBadge, BadgesResponse } from "./badge-type";
import { resolveCategory, resolveImage } from "./badge-type";

const PAGE_SIZE = 4;

const LEARN_SLUG_SET = new Set(LEARN_BADGE_SLUGS.map((b) => b.slug));

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

  const isLearn = (b: OnchainBadge) => LEARN_SLUG_SET.has(b.slug);

  const activeOwned = data.owned.filter(isLearn);
  const activeUnearned = data.unearned.filter(isLearn);
  const legacyOwned = data.owned.filter((b) => !isLearn(b));

  return (
    <div>
      <Tabs defaultValue="active">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-semibold text-indigo">
            {data.total_owned} {data.total_owned === 1 ? "badge" : "badges"}{" "}
            earned
          </span>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            {legacyOwned.length > 0 && (
              <TabsTrigger value="legacy">Legacy</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="active">
          {activeOwned.length > 0 && (
            <PaginatedGrid badges={activeOwned} owned onSelect={setSelected} />
          )}

          {activeUnearned.length > 0 && (
            <div className="mt-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft mb-3">
                Still to earn
              </div>
              <PaginatedGrid badges={activeUnearned} owned={false} />
            </div>
          )}

          {activeOwned.length === 0 && activeUnearned.length === 0 && (
            <p className="text-[12px] text-fg-soft py-4">
              No badges yet. Complete a lesson to earn your first.
            </p>
          )}
        </TabsContent>

        <TabsContent value="legacy">
          {legacyOwned.length > 0 ? (
            <PaginatedGrid badges={legacyOwned} owned onSelect={setSelected} />
          ) : (
            <p className="text-[12px] text-fg-soft py-4">No legacy badges.</p>
          )}
        </TabsContent>
      </Tabs>

      {selected && (
        <BadgeDetail badge={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function PaginatedGrid({
  badges,
  owned,
  onSelect,
}: {
  badges: OnchainBadge[];
  owned: boolean;
  onSelect?: (b: OnchainBadge) => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(badges.length / PAGE_SIZE));
  const pageBadges = useMemo(
    () => badges.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [badges, page],
  );

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {pageBadges.map((badge) => (
          <BadgeTile
            key={badge.slug}
            badge={badge}
            owned={owned}
            onClick={owned ? () => onSelect?.(badge) : undefined}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-indigo disabled:opacity-30 hover:bg-canvas-warm transition"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <span className="text-[11px] font-semibold text-fg-soft tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-indigo disabled:opacity-30 hover:bg-canvas-warm transition"
            aria-label="Next page"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
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
            className={`mb-3 mx-auto flex h-25 w-25 items-center justify-center rounded-full ${t.iconBg} opacity-50`}
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
        <div className="mb-3 mx-auto h-25 w-25 relative">
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
