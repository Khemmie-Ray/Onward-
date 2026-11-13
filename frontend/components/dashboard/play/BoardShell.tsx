import type { ReactNode } from "react";

export function BoardShell({
  patternLabel,
  difficulty,
  children,
  dim = false,
  overlay,
}: {
  patternLabel: string;
  difficulty?: number | null;
  children: ReactNode;
  dim?: boolean;
  overlay?: ReactNode;
}) {
  const dimmed = dim || overlay != null;
  return (
    <div className="relative flex min-h-140 flex-col overflow-hidden rounded-[22px] bg-[#1C133D] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-forest" />
            <span className="h-2.5 w-2.5 rounded-full bg-mustard" />
            <span className="h-2.5 w-2.5 rounded-full bg-terracotta" />
          </div>
          {difficulty != null && <DifficultyChip difficulty={difficulty} />}
        </div>
        <div className="hidden text-[11px] font-bold uppercase tracking-[0.12em] text-paper/60 sm:block">
          Today · {patternLabel}
        </div>
        <div className="text-[11px] font-semibold text-paper/55">
          Tap scams. Leave real ones.
        </div>
      </div>

      <div className="relative flex flex-1 flex-col justify-center">
        <div className={dimmed ? "pointer-events-none opacity-40" : ""}>
          {children}
        </div>

        {overlay && (
          <div className="absolute inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-2 sm:p-3">
              <div className="w-full max-w-md rounded-[20px] bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:p-6">
                {overlay}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DifficultyChip({ difficulty }: { difficulty: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-2.5 py-1">
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i <= difficulty ? "bg-mustard" : "bg-paper/20"
            }`}
          />
        ))}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wide text-paper/70">
        Difficulty {difficulty}
      </span>
    </span>
  );
}
