import type { ReactNode } from "react";

const LABEL_TONE = {
  lilac: "bg-[#CDC4FB]",
  mustard: "bg-mustard-tint",
};

export function ExerciseFrame({
  label,
  tone = "lilac",
  title,
  children,
}: {
  label: string;
  tone?: keyof typeof LABEL_TONE;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-160 md:rounded-[28px] md:bg-paper md:p-8 md:shadow-[0_18px_44px_rgba(28,19,61,0.08)]">
      <span
        className={`inline-block rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-indigo ${LABEL_TONE[tone]}`}
      >
        {label}
      </span>
      {title && (
        <h2 className="display mt-4 text-[23px] font-bold leading-[1.2] tracking-[-0.02em] text-indigo md:text-[26px]">
          {title}
        </h2>
      )}
      <div className="mt-5">{children}</div>
    </div>
  );
}

/** How a tappable tile looks before and after Check. */
export type TileState = "idle" | "selected" | "correct" | "wrong" | "muted";

const TILE_STATE: Record<TileState, string> = {
  idle: "border-shadow bg-paper hover:bg-cream md:bg-canvas-warm md:hover:bg-mustard-tint",
  selected: "border-indigo bg-paper",
  correct: "border-forest bg-forest-tint",
  wrong: "border-terracotta bg-terracotta-tint",
  muted: "border-shadow bg-paper opacity-60 md:bg-canvas-warm",
};

/** Chunky tile used by every exercise: thick bottom edge, presses down. */
export function tileClass(state: TileState) {
  return `rounded-2xl border-2 border-b-4 text-indigo transition active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-default disabled:active:translate-y-0 ${TILE_STATE[state]}`;
}
