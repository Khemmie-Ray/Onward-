import { userCompletionTimes } from "@/lib/learn/learn-stats";
import type { DayActivity } from "@/lib/modules/activity";

export async function loadUserModuleActivity(
  userId: string,
): Promise<DayActivity[]> {
  const times = await userCompletionTimes(userId).catch(() => null);
  if (!times) return [];

  const dayCounts = new Map<string, number>();
  for (const completedAt of times) {
    const date = completedAt.slice(0, 10);
    dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1);
  }

  return Array.from(dayCounts.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}
