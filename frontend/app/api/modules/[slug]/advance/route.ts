import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { slug } = await context.params;
  const body = (await request.json().catch(() => null)) as { to_card?: number } | null;
  const toCard = body?.to_card;

  if (typeof toCard !== "number" || toCard < 1) {
    return NextResponse.json({ error: "Invalid to_card" }, { status: 400 });
  }

  const { data: module } = await supabaseAdmin
    .from("modules")
    .select("id")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (!module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const { count: totalCards } = await supabaseAdmin
    .from("module_cards")
    .select("id", { count: "exact", head: true })
    .eq("module_id", module.id);

  if (totalCards == null || toCard > totalCards) {
    return NextResponse.json({ error: "Card out of bounds" }, { status: 400 });
  }

  const { data: progress } = await supabaseAdmin
    .from("module_progress")
    .select("current_card")
    .eq("user_id", user.id)
    .eq("module_id", module.id)
    .maybeSingle();

  if (!progress) {
    return NextResponse.json(
      { error: "Module not started — call /start first" },
      { status: 400 }
    );
  }

  if (toCard <= progress.current_card) {
    return NextResponse.json({
      status: "active",
      current_card: progress.current_card,
    });
  }

  const { error: updateError } = await supabaseAdmin
    .from("module_progress")
    .update({
      current_card: toCard,
      last_active_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("module_id", module.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to advance" }, { status: 500 });
  }

  return NextResponse.json({ status: "active", current_card: toCard });
}
