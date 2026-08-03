import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type BeginBody = {
  preview_id?: string;
};

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as BeginBody | null;
  if (!body?.preview_id) {
    return NextResponse.json({ error: "Missing preview_id" }, { status: 400 });
  }

  const { data: session } = await supabaseAdmin
    .from("game_sessions")
    .update({ status: "active" })
    .eq("id", body.preview_id)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (session) {
    await tickStreakForToday(user.id);
    return NextResponse.json({ round_id: session.id });
  }

  const { data: existing } = await supabaseAdmin
    .from("game_sessions")
    .select("id, status")
    .eq("id", body.preview_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "active") {
    return NextResponse.json({ round_id: existing.id });
  }

  return NextResponse.json(
    { error: "Round not found or already finished" },
    { status: 404 },
  );
}

async function tickStreakForToday(userId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dayStr = today.toISOString().slice(0, 10);

  const { data: existingDay } = await supabaseAdmin
    .from("streak_days")
    .select("user_id, rounds_played")
    .eq("user_id", userId)
    .eq("day", dayStr)
    .maybeSingle();

  if (existingDay) {
    await supabaseAdmin
      .from("streak_days")
      .update({
        rounds_played: (existingDay.rounds_played ?? 0) + 1,
      })
      .eq("user_id", userId)
      .eq("day", dayStr);
    return;
  }

  await supabaseAdmin.from("streak_days").insert({
    user_id: userId,
    day: dayStr,
    passed: true,
    rounds_played: 1,
  });

  await recomputeUserStreak(userId);
}

async function recomputeUserStreak(userId: string) {
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
