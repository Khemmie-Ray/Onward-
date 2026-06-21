
export type DayActivity = {
  date: string; // ISO date YYYY-MM-DD (local)
  count: number;
};

const MOCK_USER_START_DAYS_AGO = 14;

function toIsoDateLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getMockActivity(days = 90): DayActivity[] {
  const result: DayActivity[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    let count = 0;

    if (i < MOCK_USER_START_DAYS_AGO) {
      const r = Math.random();
      if (r < 0.05) {
        count = Math.floor(Math.random() * 3) + 3;
      } else if (r < 0.32) {
        count = Math.floor(Math.random() * 3) + 1;
      }
    }

    result.push({ date: toIsoDateLocal(d), count });
  }

  return result;
}

export function calculateStreak(days: DayActivity[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++;
    else break;
  }
  return streak;
}