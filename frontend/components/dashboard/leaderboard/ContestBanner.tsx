"use client";

// Green contest banner at the top of the weekly board. Shows the live/upcoming
// pill, the contest title + subtitle, and a days/hours countdown to the end.
export function ContestBanner({
  title,
  subtitle,
  endsAt,
  live = true,
}: {
  title: string;
  subtitle?: string | null;
  endsAt: string;
  live?: boolean;
}) {
  const { days, hours } = timeLeft(endsAt);

  return (
    <div className="relative overflow-hidden rounded-[22px] bg-[#5EC48A] px-5 py-5 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border-[14px] border-white/10"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo px-2.5 py-1 text-[11px] font-bold text-cream">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5EC48A]" />
            {live ? "Contest live" : "Upcoming"}
          </span>
          <h2 className="display mt-2 text-[22px] font-bold leading-tight text-indigo">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[12.5px] font-medium text-indigo/75">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2.5">
          <CountBox value={days} unit={days === 1 ? "day" : "days"} />
          <CountBox value={hours} unit={hours === 1 ? "hour" : "hours"} />
        </div>
      </div>
    </div>
  );
}

function CountBox({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex min-w-[58px] flex-col items-center rounded-2xl bg-indigo px-3 py-2.5 text-cream">
      <span className="display text-[22px] font-bold leading-none tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-cream/60">
        {unit}
      </span>
    </div>
  );
}

function timeLeft(endsAt: string): { days: number; hours: number } {
  const end = new Date(endsAt).getTime();
  const diff = Math.max(0, end - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  return { days, hours };
}
