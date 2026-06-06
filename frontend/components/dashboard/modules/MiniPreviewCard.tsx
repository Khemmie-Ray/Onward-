import type { ReactNode } from "react";

export function MiniPreviewCard({
  eyebrow,
  accentClass,
  children,
}: {
  eyebrow: string;
  accentClass: string;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[14px] bg-paper p-4 shadow-[0_4px_12px_rgba(31,58,110,0.06)]">
      <div
        className={`text-[9px] font-bold uppercase tracking-[0.12em] mb-2 ${accentClass}`}
      >
        {eyebrow}
      </div>
      {children}
    </div>
  );
}