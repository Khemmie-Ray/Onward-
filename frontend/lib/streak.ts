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