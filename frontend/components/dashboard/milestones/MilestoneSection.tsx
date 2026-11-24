import type { ReactNode } from "react";

export function MilestoneSection({
  label,
  blurb,
  earned,
  total,
  children,
  footer,
}: {
  label: string;
  blurb: string;
  earned: number;
  total: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="mb-9">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="display text-[20px] font-bold tracking-[-0.015em] text-indigo">
            {label}
          </h3>
          <p className="text-[12px] text-fg-soft">{blurb}</p>
        </div>
        <span className="text-[12px] font-semibold text-fg-soft">
          {earned} of {total} earned
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{children}</div>

      {footer && <div className="mt-3">{footer}</div>}
    </section>
  );
}
