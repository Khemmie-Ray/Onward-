import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTodayPattern } from "@/lib/scam/roundGenerator";
import { resolveTierKeyForNextPlay, loadTier } from "@/lib/scam/difficulty";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const pattern = await getTodayPattern();

    const tier = await loadTier(await resolveTierKeyForNextPlay(user.id));

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count } = await supabaseAdmin
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("mode", "free")
      .in("status", ["active", "submitted", "expired"])
      .gte("started_at", todayStart.toISOString());

    const freeAvailable =
      process.env.DISABLE_DAILY_CAP === "true" || (count ?? 0) < 1;

    return NextResponse.json({
      ...pattern,
      difficulty: tier.maxPatternDifficulty,
      tier: tier.key,
      tier_label: tier.label,
      free_available: freeAvailable,
    });
  } catch (err) {
    console.error("[/api/play/today]", err);
    return NextResponse.json(
      { error: "Could not load today's pattern" },
      { status: 500 },
    );
  }
}
