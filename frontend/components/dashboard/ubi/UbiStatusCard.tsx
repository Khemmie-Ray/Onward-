"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { PanelCard } from "@/components/shell/PanelCard";

export function UbiCheckingCard({ label }: { label: string }) {
  return (
    <PanelCard>
      <div className="flex items-center gap-2 text-[12px] text-fg-soft">
        <Loader2
          size={14}
          strokeWidth={2.5}
          className="animate-spin text-blue"
        />
        {label}
      </div>
    </PanelCard>
  );
}


export function UbiErrorCard({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <PanelCard>
      <div className="mb-3 flex items-start gap-2">
        <AlertTriangle
          size={15}
          strokeWidth={2.5}
          className="mt-0.5 shrink-0 text-terracotta"
        />
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold">{title}</div>
          <p className="wrap-break-word text-[11px] leading-snug text-fg-soft">
            {message}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-blue py-2 text-[12px] font-semibold text-paper hover:bg-blue/90"
      >
        <RefreshCw size={12} strokeWidth={2.8} />
        Try again
      </button>
    </PanelCard>
  );
}
