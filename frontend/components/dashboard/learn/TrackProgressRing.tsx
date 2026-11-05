
export function TrackProgressRing({
  done,
  total,
  size = 92,
}: {
  done: number;
  total: number;
  size?: number;
}) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  const offset = c * (1 - pct);

  return (
    <div
      className="flex shrink-0 flex-col items-center gap-1.5"
      role="img"
      aria-label={`${done} of ${total} modules done`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-indigo/15"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="text-indigo transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-indigo">
          <span className="display text-[22px] font-bold leading-none tabular-nums">
            {done}/{total}
          </span>
        </div>
      </div>
      <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo/70">
        modules done
      </span>
    </div>
  );
}
