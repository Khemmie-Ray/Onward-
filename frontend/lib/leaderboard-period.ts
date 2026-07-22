export function getPeriodStart(now: Date = new Date()): Date {
  const d = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );

  const dayFromMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayFromMonday);
  return d;
}

export function getPeriodEnd(now: Date = new Date()): Date {
  const start = getPeriodStart(now);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return end;
}

export function getPreviousPeriodStart(now: Date = new Date()): Date {
  const start = getPeriodStart(now);
  const prev = new Date(start);
  prev.setUTCDate(prev.getUTCDate() - 7);
  return prev;
}

export function getWeekSlug(periodStart: Date): string {
  const target = new Date(periodStart);
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
  const weekNo =
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000),
    );
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function secondsUntilReset(now: Date = new Date()): number {
  return Math.max(
    0,
    Math.floor((getPeriodEnd(now).getTime() - now.getTime()) / 1000),
  );
}
