"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { ChampionsHero } from "./ChampionHero";
import { Podium } from "./Podium";
import { RankList } from "./RankList";

export type BoardEntry = {
  rank: number;
  name: string;
  score: number;
  isViewer?: boolean;
};

export function LeaderboardView({
  heroTitle,
  heroSubtitle,
  top3,
  pageEntries,
  total,
  page,
  pageCount,
  onPageChange,
  scoreLabel = "score",
  loading = false,
  emptyMessage = "No one has made the board yet.",
}: {
  heroTitle?: string;
  heroSubtitle?: string;
  top3: BoardEntry[];
  pageEntries: BoardEntry[];
  total: number;
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
  scoreLabel?: string;
  loading?: boolean;
  emptyMessage?: string;
}) {
  const startRank = pageEntries[0]?.rank ?? 0;
  const endRank = pageEntries[pageEntries.length - 1]?.rank ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <ChampionsHero title={heroTitle} subtitle={heroSubtitle} />

      {loading ? (
        <div className="flex justify-center py-12 text-fg-soft">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : top3.length === 0 ? (
        <div className="rounded-[20px] bg-paper p-8 text-center text-[13px] text-fg-soft shadow-[0_6px_24px_rgba(31,58,110,0.06)]">
          {emptyMessage}
        </div>
      ) : (
        <>
          <Podium entries={top3} scoreLabel={scoreLabel} />
          <RankList entries={pageEntries} scoreLabel={scoreLabel} />

          {total > 3 && (
            <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[12px] text-fg-soft">
                Showing {startRank}&ndash;{endRank} of {total}
              </span>
              {pageCount > 1 && (
                <Pager
                  page={page}
                  pageCount={pageCount}
                  onPageChange={onPageChange}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Pager({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <RoundBtn
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        label="Previous page"
        tone="light"
      >
        <ChevronLeft size={14} strokeWidth={2.5} />
      </RoundBtn>

      {pageList(page, pageCount).map((p, i) =>
        p === -1 ? (
          <span key={`gap-${i}`} className="px-1 text-[12px] text-fg-soft/50">
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[12px] font-bold transition ${
              p === page
                ? "bg-[#5EC48A] text-indigo"
                : "text-fg-soft hover:bg-canvas-warm"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <RoundBtn
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        label="Next page"
        tone="dark"
      >
        <ChevronRight size={14} strokeWidth={2.5} />
      </RoundBtn>
    </div>
  );
}

function RoundBtn({
  onClick,
  disabled,
  label,
  tone,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  tone: "light" | "dark";
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-40 ${
        tone === "dark"
          ? "bg-indigo text-cream hover:bg-indigo/90"
          : "bg-canvas-warm text-fg-soft hover:bg-canvas-warm/70"
      }`}
    >
      {children}
    </button>
  );
}

// 1-based page numbers with ellipses, e.g. 1 2 3 … 9.
function pageList(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: number[] = [];
  let prev = -1;
  for (const p of sorted) {
    if (prev !== -1 && p - prev > 1) out.push(-1);
    out.push(p);
    prev = p;
  }
  return out;
}
