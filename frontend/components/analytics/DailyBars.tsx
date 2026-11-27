type Point = { date: string; value: number };

type DailyBarsProps = {
  title: string;
  caption: string;
  points: Point[];
  format: (n: number) => string;
  tone?: "indigo" | "forest" | "mustard" | "terracotta";
  summary?: "sum" | "max";
  unit?: "day" | "week";
};

const BAR_TONE: Record<NonNullable<DailyBarsProps["tone"]>, string> = {
  indigo: "bg-indigo",
  forest: "bg-forest",
  mustard: "bg-mustard",
  terracotta: "bg-terracotta",
};

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

export function DailyBars({
  title,
  caption,
  points,
  format,
  tone = "indigo",
  summary = "sum",
  unit = "day",
}: DailyBarsProps) {
  const max = Math.max(1, ...points.map((p) => Math.abs(p.value)));
  const headline =
    summary === "max"
      ? Math.max(0, ...points.map((p) => p.value))
      : points.reduce((sum, p) => sum + p.value, 0);
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <section className="flex flex-col rounded-3xl border-2 border-indigo/10 bg-white p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-[17px] font-bold text-indigo">
            {title}
          </h3>
          <p className="mt-1 text-[12.5px] text-fg-soft">{caption}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-[20px] font-bold tabular-nums text-indigo">
            {format(headline)}
          </p>
          <p className="text-[10.5px] text-fg-dim">
            {summary === "max"
              ? "busiest day"
              : `${points.length} ${unit}${points.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="mt-8 text-[13px] text-fg-soft">No activity yet.</p>
      ) : (
        <>
          <div
            className="mt-6 flex h-36 items-end gap-0.75"
            role="img"
            aria-label={`${title}, ${points.length} ${unit}s`}
          >
            {points.map((p) => (
              <div
                key={p.date}
                title={`${unit === "week" ? "Week of " : ""}${shortDate(p.date)}: ${format(p.value)}`}
                className="group flex h-full min-w-0 flex-1 items-end"
              >
                <div
                  className={`w-full rounded-t-[3px] ${
                    p.value < 0 ? "bg-terracotta" : BAR_TONE[tone]
                  } opacity-85 transition-opacity group-hover:opacity-100`}
                  style={{
                    height: `${Math.max(p.value === 0 ? 0 : 3, (Math.abs(p.value) / max) * 100)}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-fg-soft">
            <span>{first ? shortDate(first.date) : ""}</span>
            <span>{last ? shortDate(last.date) : ""}</span>
          </div>
        </>
      )}
    </section>
  );
}
