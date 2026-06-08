import { NextResponse } from "next/server";
import { type Address } from "viem";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateRound, type PlayMode } from "@/lib/scam/roundGenerator";
import { verifyStakePlaced } from "@/lib/onchain/play";

type StartBody = {
  mode?: PlayMode;
  round_id?: string;
};

export async function POST(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as StartBody | null;
  const mode: PlayMode = body?.mode === "premium" ? "premium" : "free";

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  if (mode === "free") {
    if (process.env.DISABLE_DAILY_CAP !== "true") {
      const { count } = await supabaseAdmin
        .from("game_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("mode", "free")
        .gte("started_at", todayStart.toISOString());

      if ((count ?? 0) >= 1) {
        return NextResponse.json(
          {
            error:
              "Already played your free round today. Come back tomorrow.",
          },
          { status: 429 }
        );
      }
    }
  }

  if (mode === "premium") {
    if (!body?.round_id) {
      return NextResponse.json(
        { error: "round_id required for premium mode" },
        { status: 400 }
      );
    }

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

    const stakeOk = await verifyStakePlaced(
      body.round_id,
      user.wallet_address as Address
    );
    if (!stakeOk) {
      return NextResponse.json(
        { error: "Stake not found onchain. Did the transaction confirm?" },
        { status: 400 }
      );
    }
  }

  let round;
  try {
    round = await generateRound(mode, user.current_level);
  } catch (err) {
    console.error("[generateRound failed]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate round",
      },
      { status: 500 }
    );
  }

  const itemsForClient = round.full_patterns.map((p) => ({
    pattern_id: p.id,
    kind: p.kind,
    content: p.content,
  }));

  return NextResponse.json({
    preview_id:
      mode === "premium" && body?.round_id
        ? body.round_id
        : crypto.randomUUID(),
    mode,
    featured_family: round.featured_family,
    family_label: round.family_label,
    family_description: round.family_description,
    exemplar: {
      kind: round.exemplar.kind,
      content: round.exemplar.content,
      teaching: round.exemplar.teaching,
    },
    items: itemsForClient,
    popup_duration_ms: round.popup_duration_ms,
    total_seconds: round.total_seconds,
    board_progression: round.board_progression,
    base_spawn_delay: round.base_spawn_delay,
    spawn_jitter: round.spawn_jitter,
    scam_icon: round.scam_icon,
    legit_icon: round.legit_icon,
    _round_payload: {
      featured_family: round.featured_family,
      items: round.items,
      popup_duration_ms: round.popup_duration_ms,
      total_seconds: round.total_seconds,
    },
  });
}