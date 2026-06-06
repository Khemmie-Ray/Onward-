import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PlayMode } from "@/lib/scam/roundGenerator";

type BeginBody = {
  preview_id?: string;
  mode?: PlayMode;
  round_payload?: {
    featured_family: string;
    items: { pattern_id: string; is_scam: boolean }[];
    popup_duration_ms: number;
    total_seconds: number;
  };
};

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as BeginBody | null;
  if (!body?.preview_id || !body?.mode || !body?.round_payload) {
    return NextResponse.json(
      { error: "Missing preview_id, mode, or round_payload" },
      { status: 400 }
    );
  }
  const { preview_id, mode, round_payload } = body;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  if (mode === "free" && process.env.DISABLE_DAILY_CAP !== "true") {
    const { count } = await supabaseAdmin
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("mode", "free")
      .gte("started_at", todayStart.toISOString());

    if ((count ?? 0) >= 1) {
      return NextResponse.json(
        { error: "Already played your free round today" },
        { status: 429 }
      );
    }
  }

  if (mode === "premium") {
    const { count } = await supabaseAdmin
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("mode", "premium")
      .gte("started_at", todayStart.toISOString());

    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { error: "Daily premium cap reached" },
        { status: 429 }
      );
    }
  }

  const { data: session, error } = await supabaseAdmin
    .from("game_sessions")
    .insert({
      id: preview_id,
      user_id: user.id,
      mode,
      featured_family: round_payload.featured_family,
      items: round_payload.items,
      popup_duration_ms: round_payload.popup_duration_ms,
      total_seconds: round_payload.total_seconds,
      status: "active",
      level_before: user.current_level,
    })
    .select("id")
    .single();

  if (error || !session) {
    // Duplicate key (preview_id reused) is the most likely error here
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Round already begun" },
        { status: 409 }
      );
    }
    console.error("[/api/play/begin] insert failed:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ round_id: session.id });
}