"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DayRow = {
  date: string;
  txs: number;
  gdTransfers: number;
  gdVolume: number;
  gdNetFlow: number;
  verified: number;
  onboarded: number;
};

const PAGE_SIZE = 20;

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/** Day-by-day numbers, newest first, 20 days a page. */
export function DayTable({ rows }: { rows: DayRow[] }) {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const [page, setPage] = useState(0);
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const from = rows.length === 0 ? 0 : current * PAGE_SIZE + 1;
  const to = Math.min(rows.length, (current + 1) * PAGE_SIZE);

  return (
    <>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-160 text-left text-[12.5px] tabular-nums">
          <thead>
            <tr className="whitespace-nowrap border-b border-indigo/10 text-[11px] uppercase tracking-wider text-fg-dim">
              <th className="py-2 pr-4 font-semibold">Date</th>
              <th className="py-2 pr-4 text-right font-semibold">
                Transactions
              </th>
              <th className="py-2 pr-4 text-right font-semibold">
                G$ transfers
              </th>
              <th className="py-2 pr-4 text-right font-semibold">G$ volume</th>
              <th className="py-2 pr-4 text-right font-semibold">
                G$ net flow
              </th>
              <th className="py-2 pr-4 text-right font-semibold">
                Verified active
              </th>
              <th className="py-2 text-right font-semibold">Onboarded</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((d) => (
              <tr
                key={d.date}
                className="border-b border-indigo/5 last:border-0"
              >
                <td className="whitespace-nowrap py-2.5 pr-4 font-semibold">
                  {longDate(d.date)}
                </td>
                <td className="py-2.5 pr-4 text-right">
                  {whole.format(d.txs)}
                </td>
                <td className="py-2.5 pr-4 text-right">
                  {whole.format(d.gdTransfers)}
                </td>
                <td className="py-2.5 pr-4 text-right">
                  {whole.format(d.gdVolume)}
                </td>
                <td
                  className={`py-2.5 pr-4 text-right ${
                    d.gdNetFlow < 0 ? "text-terracotta" : "text-forest"
                  }`}
                >
                  {whole.format(d.gdNetFlow)}
                </td>
                <td className="py-2.5 pr-4 text-right">
                  {whole.format(d.verified)}
                </td>
                <td className="py-2.5 text-right">
                  {whole.format(d.onboarded)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-fg-soft">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-indigo/10 pt-4">
          <p className="text-[12px] text-fg-soft">
            {from}–{to} of {rows.length} days
          </p>
          <div className="flex items-center gap-2">
            <PageButton
              label="Newer days"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={16} strokeWidth={2.6} />
            </PageButton>
            <span className="min-w-14 text-center text-[12px] font-semibold tabular-nums text-indigo">
              {current + 1} / {pages}
            </span>
            <PageButton
              label="Older days"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={16} strokeWidth={2.6} />
            </PageButton>
          </div>
        </div>
      )}
    </>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-indigo/15 bg-white text-indigo transition hover:border-indigo/30 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}
