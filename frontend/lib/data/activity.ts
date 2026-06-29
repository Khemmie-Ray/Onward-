import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DayActivity } from "@/lib/modules/activity";

export async function loadUserModuleActivity(
  userId: string,
): Promise<DayActivity[]> {
  const { data, error } = await supabaseAdmin
    .from("module_completions")
    .select("completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: true });

  if (error || !data) return [];

  const dayCounts = new Map<string, number>();
  for (const row of data) {
    const date = row.completed_at.slice(0, 10);
    dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1);
  }

  return Array.from(dayCounts.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}