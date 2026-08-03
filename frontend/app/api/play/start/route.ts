import { NextResponse } from "next/server";
import { type Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  generateRound,
  rebuildRoundFromSession,
  type GeneratedRound,
  type RoundItem,
} from "@/lib/scam/roundGenerator";
import type { PlayMode } from "@/lib/scoring";
import { verifyStakePlaced } from "@/lib/onchain/play";

type StartBody = {
  mode?: PlayMode;
  round_id?: string;
};

function previewResponse(
  round: GeneratedRound,
  previewId: string,
  mode: PlayMode,
) {
  return NextResponse.json({
    preview_id: previewId,
    mode,
    featured_family: round.featured_family,
    family_label: round.family_label,
    family_description: round.family_description,
    exemplar: {
      kind: round.exemplar.kind,
      content: round.exemplar.content,
      teaching: round.exemplar.teaching,
    },
    exemplar_icon: round.exemplar_icon,
    display_items: round.full_patterns.map((p) => ({
      pattern_id: p.id,
      icon: p.icon,
      is_scam: p.is_scam,
      kind: p.kind,
    })),
    popup_duration_ms: round.popup_duration_ms,
    total_seconds: round.total_seconds,
    board_progression: round.board_progression,
    base_spawn_delay: round.base_spawn_delay,
    spawn_jitter: round.spawn_jitter,
  });
}

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as StartBody | null;
  const mode: PlayMode = body?.mode === "premium" ? "premium" : "free";

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  if (mode === "free" && process.env.DISABLE_DAILY_CAP !== "true") {
    const { count } = await supabaseAdmin
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("mode", "free")
      .in("status", ["active", "submitted", "expired"])
      .gte("started_at", todayStart.toISOString());

    if ((count ?? 0) >= 1) {
      return NextResponse.json(
        { error: "Already played your free round today. Come back tomorrow." },
        { status: 429 },
      );
    }
  }

  if (mode === "premium") {
    if (!body?.round_id) {
      return NextResponse.json(
        { error: "round_id required for premium mode" },
        { status: 400 },
      );
    }

    const { count } = await supabaseAdmin
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("mode", "premium")
      .in("status", ["active", "submitted", "expired"])
      .gte("started_at", todayStart.toISOString());

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Daily premium cap reached" },
        { status: 429 },
      );
    }

    const stakeOk = await verifyStakePlaced(
      body.round_id,
      user.wallet_address as Address,
    );
    if (!stakeOk) {
      return NextResponse.json(
        { error: "Stake not found onchain. Did the transaction confirm?" },
        { status: 400 },
      );
    }
  }

  const { data: existingPending } = await supabaseAdmin
    .from("game_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("mode", mode)
    .eq("status", "pending")
    .gte("started_at", todayStart.toISOString())
    .maybeSingle();

  if (existingPending) {
    try {
      const rebuilt = await rebuildRoundFromSession({
        id: existingPending.id,
        featured_family: existingPending.featured_family,
        items: existingPending.items as RoundItem[],
        popup_duration_ms: existingPending.popup_duration_ms,
        total_seconds: existingPending.total_seconds,
        mode: existingPending.mode,
      });
      return previewResponse(rebuilt, existingPending.id, mode);
    } catch (err) {
      console.error("[/api/play/start] rebuild pending failed:", err);
    }
  }

  const previewId =
    mode === "premium" && body?.round_id ? body.round_id : crypto.randomUUID();

  let round: GeneratedRound;
  try {
    round = await generateRound(mode, user.current_level, previewId);
  } catch (err) {
    console.error("[generateRound failed]", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to generate round",
      },
      { status: 500 },
    );
  }

  const { error: insertErr } = await supabaseAdmin
    .from("game_sessions")
    .insert({
      id: previewId,
      user_id: user.id,
      mode,
      featured_family: round.featured_family,
      items: round.items,
      popup_duration_ms: round.popup_duration_ms,
      total_seconds: round.total_seconds,
      status: "pending",
      level_before: user.current_level,
    });

  if (insertErr) {
    if (insertErr.code === "23505") {
      const { data: existing } = await supabaseAdmin
        .from("game_sessions")
        .select("*")
        .eq("id", previewId)
        .single();
      if (existing) {
        const rebuilt = await rebuildRoundFromSession({
          id: existing.id,
          featured_family: existing.featured_family,
          items: existing.items as RoundItem[],
          popup_duration_ms: existing.popup_duration_ms,
          total_seconds: existing.total_seconds,
          mode: existing.mode,
        });
        return previewResponse(rebuilt, existing.id, mode);
      }
    }
    console.error("[/api/play/start] insert failed:", insertErr);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }

  return previewResponse(round, previewId, mode);
}
