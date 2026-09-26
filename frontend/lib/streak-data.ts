import { supabaseAdmin } from "@/lib/supabase/admin";

export async function markStreakDay(userId: string): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dayStr = today.toISOString().slice(0, 10);

  const { data: existing } = await supabaseAdmin
    .from("streak_days")
    .select("*")
    .eq("user_id", userId)
    .eq("day", dayStr)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("streak_days")
      .update({
        passed: true,
        rounds_played: (existing.rounds_played ?? 0) + 1,
      })
      .eq("user_id", userId)
      .eq("day", dayStr);
  } else {
    await supabaseAdmin.from("streak_days").insert({
      user_id: userId,
      day: dayStr,
      passed: true,
      rounds_played: 1,
    });
  }

  await recomputeUserStreak(userId);
}

export async function recomputeUserStreak(userId: string): Promise<void> {
  const { data: days } = await supabaseAdmin
    .from("streak_days")
    .select("day, passed")
    .eq("user_id", userId)
    .eq("passed", true)
    .order("day", { ascending: false });

  if (!days || days.length === 0) return;

  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const row of days) {
    const expected = new Date(today);
    expected.setUTCDate(today.getUTCDate() - streak);
    if (row.day === expected.toISOString().slice(0, 10)) streak++;
    else break;
  }

  const { data: u } = await supabaseAdmin
    .from("users")
    .select("longest_streak")
    .eq("id", userId)
    .single();

  const longestStreak = Math.max(u?.longest_streak ?? 0, streak);

  await supabaseAdmin
    .from("users")
    .update({ current_streak: streak, longest_streak: longestStreak })
    .eq("id", userId);
}

// Live streak, computed from streak_days the SAME way the status route shows it:
// anchor on the most recent activity (which must be today or yesterday, else the
// streak is broken/0) and count consecutive days back from there. This is the
// definition the UI displays, so gating (e.g. the claim route) should use THIS
// rather than the stored users.current_streak column, which recomputeUserStreak
// writes as 0 on any day the user hasn't been active yet (it anchors on today).
export async function computeLiveStreak(userId: string): Promise<number> {
  const { data: days } = await supabaseAdmin
    .from("streak_days")
    .select("day")
    .eq("user_id", userId)
    .eq("passed", true)
    .order("day", { ascending: false })
    .limit(400);
  if (!days || days.length === 0) return 0;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  const todayStr = ymd(today);
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const yesterdayStr = ymd(yesterday);

  // Most recent activity must be today or yesterday, else the streak is broken.
  const mostRecent = days[0].day as string;
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) return 0;

  // Count consecutive days back from the most recent activity day.
  const set = new Set(days.map((d) => d.day as string));
  let streak = 0;
  const cursor = new Date(mostRecent + "T00:00:00Z");
  while (set.has(ymd(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
