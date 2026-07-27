import { NextResponse } from "next/server";
import { requireCompletedProfile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireCompletedProfile(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { data: tracks } = await supabaseAdmin
    .from("learn_tracks")
    .select("id, slug, title, description, order_index, status, icon")
    .order("order_index", { ascending: true });

  if (!tracks) {
    return NextResponse.json({ tracks: [] });
  }

  const { data: modules } = await supabaseAdmin
    .from("learn_modules")
    .select("id, track_id")
    .eq("status", "live");

  const { data: completions } = await supabaseAdmin
    .from("learn_completions")
    .select("module_id")
    .eq("user_id", user.id);

  const completedIds = new Set((completions ?? []).map((c) => c.module_id));

  const modulesByTrack = new Map<string, string[]>();
  for (const m of modules ?? []) {
    const list = modulesByTrack.get(m.track_id) ?? [];
    list.push(m.id);
    modulesByTrack.set(m.track_id, list);
  }

  const result = tracks.map((t) => {
    const moduleIds = modulesByTrack.get(t.id) ?? [];
    const total = moduleIds.length;
    const done = moduleIds.filter((id) => completedIds.has(id)).length;
    return {
      slug: t.slug,
      title: t.title,
      description: t.description,
      icon: t.icon,
      status: t.status,
      total_modules: total,
      completed_modules: done,
      progress_state:
        t.status === "coming_soon"
          ? "coming_soon"
          : total === 0
            ? "empty"
            : done === 0
              ? "not_started"
              : done === total
                ? "complete"
                : "in_progress",
    };
  });

  return NextResponse.json({ tracks: result });
}
