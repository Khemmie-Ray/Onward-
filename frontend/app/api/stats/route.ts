import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPlatformVolumeG } from "@/lib/onchain/volume";

export const revalidate = 60;

export async function GET() {
  try {
    const [usersCount, completionsCount, gDistributed] = await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("module_completions")
        .select("id", { count: "exact", head: true }),
      getPlatformVolumeG(),
    ]);

    return NextResponse.json({
      learners: usersCount.count ?? 0,
      gDistributed,
      modulesDone: completionsCount.count ?? 0,
    });
  } catch (err) {
    console.error("[stats]", err);
    return NextResponse.json(
      { learners: 0, gDistributed: 0, modulesDone: 0 },
      { status: 200 },
    );
  }
}
