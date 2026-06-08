import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 60;

export async function GET() {
  try {
    const [usersCount, completions, gameSessions] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("module_completions")
        .select("id, modules(reward_g_amount)"),
      supabaseAdmin
        .from("game_sessions")
        .select("reward_g_amount")
        .eq("passed", true),
    ]);

    const learners = usersCount.count ?? 0;
    const modulesDone = completions.data?.length ?? 0;

    // G$ from module completions
    const moduleG = (completions.data ?? []).reduce((sum, c) => {
      const mod = c.modules as { reward_g_amount?: number } | null;
      return sum + (mod?.reward_g_amount ?? 0);
    }, 0);

    // G$ from game wins
    const gameG = (gameSessions.data ?? []).reduce(
      (sum, s) => sum + (s.reward_g_amount ?? 0),
      0
    );

    return NextResponse.json({
      learners,
      gDistributed: moduleG + gameG,
      modulesDone,
    });
  } catch (err) {
    console.error("[stats]", err);
    return NextResponse.json(
      { learners: 0, gDistributed: 0, modulesDone: 0 },
      { status: 200 }
    );
  }
}