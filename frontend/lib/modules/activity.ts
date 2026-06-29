export type DayActivity = {
  date: string;
  count: number;
};

export function buildActivityLookup(activity: DayActivity[]): Set<string> {
  return new Set(activity.map((a) => a.date));
}

export function activityLevel(date: string, activity: DayActivity[]): number {
  return activity.find((a) => a.date === date)?.count ?? 0;
}

export function calculateStreak(activity: DayActivity[]): number {
  if (activity.length === 0) return 0;

  const activeDates = new Set(
    activity.filter((a) => a.count > 0).map((a) => a.date),
  );

  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);

  while (true) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!activeDates.has(iso)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}