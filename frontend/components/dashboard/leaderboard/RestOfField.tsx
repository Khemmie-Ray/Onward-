"use client";

import { ChevronDown, ChevronUp, Loader2, Users } from "lucide-react";
import type { LeaderboardEntry } from "./type";

export function RestOfField({
  entries,
  viewer,
  totalPlayers,
  hasMore,
  isLoadingMore,
  onShowMore,
  onShowFewer,
  visibleTableSize,
}: {
  entries: LeaderboardEntry[];
  viewer: LeaderboardEntry | null;
  totalPlayers: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onShowMore: () => void;
  onShowFewer: () => void;
  visibleTableSize: number;
}) {
  const restEntries = entries.filter((e) => e.rank > 10);

  const viewerOutOfRange =
    viewer !== null &&
    viewer.rank > 10 &&
    !restEntries.some((e) => e.is_viewer);

  const totalBeyondTop10 = Math.max(0, totalPlayers - 10);
  const isExpanded = restEntries.length > visibleTableSize;
  const showEmptyState = restEntries.length === 0 && !viewerOutOfRange;

  return (
    <div className="mt-12">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-soft mb-3">
        Everyone else
      </div>

      {showEmptyState ? (
        <EmptyState />
      ) : (
        <div className="rounded-2xl bg-paper border border-fg-soft/15 overflow-hidden">
          <TableHeader />

          <div>
            {restEntries.map((entry) => (
              <RestRow key={entry.user_id} entry={entry} />
            ))}

            {viewerOutOfRange && viewer && (
              <>
                <div className="flex items-center gap-3 my-1 px-4 sm:px-5">
                  <div className="flex-1 h-px bg-fg-soft/15" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft">
                    Your rank
                  </span>
                  <div className="flex-1 h-px bg-fg-soft/15" />
                </div>
                <RestRow entry={viewer} />
              </>
            )}
          </div>

          {totalBeyondTop10 > visibleTableSize && (
            <PaginationFooter
              loadedCount={restEntries.length}
              totalCount={totalBeyondTop10}
              isExpanded={isExpanded}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onShowMore={onShowMore}
              onShowFewer={onShowFewer}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-2xl bg-paper border border-dashed border-fg-soft/30 px-5 py-8 sm:py-10 text-center">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-fg-soft/10 mb-3">
        <Users size={18} strokeWidth={2.5} className="text-fg-soft" />
      </div>
      <div className="font-bold text-[14px] text-indigo mb-1">
        Spots 11+ open as more players join
      </div>
      <div className="text-[12px] text-fg-soft leading-relaxed max-w-[320px] mx-auto">
        Once more spotters pass rounds this week, they show up here. The list
        paginates 5 at a time.
      </div>
    </div>
  );
}

function TableHeader() {
  return (
    <div className="hidden sm:grid grid-cols-[44px_36px_1fr_70px] gap-3 items-center px-5 py-2.5 border-b border-fg-soft/10 text-[10px] font-bold uppercase tracking-[0.12em] text-fg-soft">
      <span className="text-right">#</span>
      <span></span>
      <span>Player</span>
      <span className="text-right">Whacks</span>
    </div>
  );
}

function RestRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={`grid grid-cols-[36px_32px_1fr_auto] sm:grid-cols-[44px_36px_1fr_70px] gap-3 items-center px-4 sm:px-5 py-3 border-b border-fg-soft/5 last:border-b-0 transition ${
        entry.is_viewer
          ? "bg-mustard/15 ring-1 ring-mustard/30 ring-inset"
          : "hover:bg-canvas-warm/40"
      }`}
    >
      <span className="display font-bold tabular-nums text-fg-soft text-right text-[13px]">
        {entry.rank}
      </span>

      <div
        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-cream font-bold text-[10px] sm:text-[11px] shrink-0 ${avatarColor(entry.user_id)}`}
      >
        {getInitials(entry.display_name)}
      </div>

      <div className="min-w-0">
        <span className="font-bold text-[13px] sm:text-[14px] text-indigo truncate inline-block max-w-full align-middle">
          {entry.display_name}
        </span>
        {entry.is_viewer && (
          <span className="ml-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-mustard">
            You
          </span>
        )}
      </div>

      <span className="display font-bold tabular-nums text-[14px] sm:text-[15px] text-indigo text-right">
        {entry.correct_whacks.toLocaleString()}
      </span>
    </div>
  );
}

function PaginationFooter({
  loadedCount,
  totalCount,
  isExpanded,
  hasMore,
  isLoadingMore,
  onShowMore,
  onShowFewer,
}: {
  loadedCount: number;
  totalCount: number;
  isExpanded: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onShowMore: () => void;
  onShowFewer: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-fg-soft/10 bg-canvas/60">
      <span className="text-[11px] text-fg-soft">
        Showing {loadedCount} of {totalCount}
      </span>
      <div className="flex gap-2">
        {isExpanded && (
          <button
            onClick={onShowFewer}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-canvas-warm text-fg-soft text-[11px] font-bold hover:bg-canvas-warm/70 transition"
          >
            <ChevronUp size={12} strokeWidth={2.5} />
            Show fewer
          </button>
        )}
        {hasMore && (
          <button
            onClick={onShowMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo text-cream text-[11px] font-bold hover:bg-indigo/90 disabled:opacity-60 transition"
          >
            {isLoadingMore ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ChevronDown size={12} strokeWidth={2.5} />
            )}
            Show 5 more
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return initials || "?";
}

function avatarColor(userId: string): string {
  const hash = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const palette = ["bg-indigo", "bg-aubergine"];
  return palette[hash % palette.length];
}