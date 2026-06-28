import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { isModuleLocked } from "@/lib/modules/lock-check";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { slug } = await context.params;

  const { data: module } = await supabaseAdmin
    .from("modules")
    .select("id, slug, category, order_in_category")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (!module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const locked = await isModuleLocked(
    user.id,
    module.category,
    module.order_in_category,
  );

  if (locked) {
    return NextResponse.json(
      { error: `Complete the earlier ${module.category} modules first` },
      { status: 403 },
    );
  }

  const { data: existingCompletion } = await supabaseAdmin
    .from("module_completions")
    .select("id, completed_at")
    .eq("user_id", user.id)
    .eq("module_id", module.id)
    .maybeSingle();

  if (existingCompletion) {
    return NextResponse.json({
      status: "complete",
      current_card: 1,
      already_completed_at: existingCompletion.completed_at,
    });
  }

  const { data: existingProgress } = await supabaseAdmin
    .from("module_progress")
    .select("current_card, started_at")
    .eq("user_id", user.id)
    .eq("module_id", module.id)
    .maybeSingle();

  if (existingProgress) {
    return NextResponse.json({
      status: "active",
      current_card: existingProgress.current_card,
      started_at: existingProgress.started_at,
    });
  }

  const { error: insertError } = await supabaseAdmin
    .from("module_progress")
    .insert({ user_id: user.id, module_id: module.id, current_card: 1 });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to start module" },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: "active", current_card: 1 });
}