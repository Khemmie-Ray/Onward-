import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 60;

export async function GET() {
  try {
    const [usersCount, completionsCount, gEarnedRows] = await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("module_completions")
        .select("id", { count: "exact", head: true }),
      // Sum lifetime G$ earned across all users
      supabaseAdmin.from("users").select("total_g_earned"),
    ]);

    const learners = usersCount.count ?? 0;
    const modulesDone = completionsCount.count ?? 0;

    const gDistributed = (gEarnedRows.data ?? []).reduce(
      (sum, u) => sum + Number(u.total_g_earned ?? 0),
      0,
    );

    return NextResponse.json({
      learners,
      gDistributed,
      modulesDone,
    });
  } catch (err) {
    console.error("[stats]", err);
    return NextResponse.json(
      { learners: 0, gDistributed: 0, modulesDone: 0 },
      { status: 200 },
    );
  }
}
