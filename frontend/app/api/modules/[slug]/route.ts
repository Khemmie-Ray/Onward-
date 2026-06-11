import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthedUser } from "@/lib/auth";
import type { ModuleDetail } from "@/lib/supabase/types";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const { data: module, error: modErr } = await supabaseAdmin
    .from("modules")
    .select("*")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (modErr || !module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const user = await getAuthedUser();

  if (user && module.prerequisite_slug) {
    const { data: prereq } = await supabaseAdmin
      .from("modules")
      .select("id")
      .eq("slug", module.prerequisite_slug)
      .maybeSingle();

    if (prereq) {
      const { data: prereqDone } = await supabaseAdmin
        .from("module_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("module_id", prereq.id)
        .maybeSingle();

      if (!prereqDone) {
        return NextResponse.json({
          module: { ...module, cards: [] },
          user_state: {
            status: "locked",
            current_card: 0,
            locked_reason: `Complete "${module.prerequisite_slug}" first`,
          },
        });
      }
    }
  }

  const { data: cards } = await supabaseAdmin
    .from("module_cards")
    .select("*")
    .eq("module_id", module.id)
    .order("order_index", { ascending: true });

  const detail: ModuleDetail = { ...module, cards: cards ?? [] };

  let userState: { status: string; current_card: number } | null = null;

  if (user) {
    const [{ data: completion }, { data: progress }] = await Promise.all([
      supabaseAdmin
        .from("module_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("module_id", module.id)
        .maybeSingle(),
      supabaseAdmin
        .from("module_progress")
        .select("current_card")
        .eq("user_id", user.id)
        .eq("module_id", module.id)
        .maybeSingle(),
    ]);

    if (completion) {
      userState = { status: "complete", current_card: detail.cards.length };
    } else if (progress) {
      userState = { status: "active", current_card: progress.current_card };
    } else {
      userState = { status: "available", current_card: 1 };
    }
  }

  return NextResponse.json({ module: detail, user_state: userState });
}