"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";

const CLASSES =
  "flex w-full items-center justify-between rounded-full bg-blue py-2.5 pl-5 pr-2 text-[13px] font-semibold text-paper transition hover:bg-blue/90 disabled:cursor-not-allowed disabled:opacity-60";

export function PillButton({
  children,
  onClick,
  href,
  loading = false,
  disabled = false,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const badge = (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-paper">
      {loading ? (
        <Loader2 size={14} strokeWidth={2.6} className="animate-spin" />
      ) : (
        (icon ?? <ArrowUpRight size={14} strokeWidth={2.6} />)
      )}
    </span>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={CLASSES}>
        {children}
        {badge}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={CLASSES}
    >
      {children}
      {badge}
    </button>
  );
}
