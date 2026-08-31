import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.get("debug") === "1";
  const nowIso = new Date().toISOString();
  const cols =
    "slug, seq, type, title, subtitle, starts_at, ends_at, status, settings";

  try {
    const liveRes = await supabaseAdmin
      .from("contest_config")
      .select(cols)
      .neq("status", "draft")
      .lte("starts_at", nowIso)
      .gte("ends_at", nowIso)
      .order("starts_at", { ascending: false })
      .limit(1);
    if (liveRes.error) throw liveRes.error;
    if (liveRes.data && liveRes.data[0]) {
      return NextResponse.json({
        contest: { ...liveRes.data[0], phase: "live" },
      });
    }

    const upRes = await supabaseAdmin
      .from("contest_config")
      .select(cols)
      .neq("status", "draft")
      .gt("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1);
    if (upRes.error) throw upRes.error;
    if (upRes.data && upRes.data[0]) {
      return NextResponse.json({
        contest: { ...upRes.data[0], phase: "upcoming" },
      });
    }

    const pastRes = await supabaseAdmin
      .from("contest_config")
      .select(cols)
      .neq("status", "draft")
      .lt("ends_at", nowIso)
      .order("ends_at", { ascending: false })
      .limit(1);
    if (pastRes.error) throw pastRes.error;
    if (pastRes.data && pastRes.data[0]) {
      return NextResponse.json({
        contest: { ...pastRes.data[0], phase: "closed" },
      });
    }

    if (debug) {
      const all = await supabaseAdmin
        .from("contest_config")
        .select("slug, status, starts_at, ends_at");
      return NextResponse.json({
        contest: null,
        debug: { now: nowIso, rows: all.data, rowsError: all.error?.message },
      });
    }
    return NextResponse.json({ contest: null });
  } catch (err) {
    console.error("[contest active]", err);
    return NextResponse.json(
      {
        contest: null,
        error: err instanceof Error ? err.message : "Failed to load contest",
      },
      { status: 500 },
    );
  }
}
