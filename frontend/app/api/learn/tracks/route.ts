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
    .select(
      "id, track_id, slug, title, order_in_track, estimated_minutes, points_reward",
    )
    .eq("status", "live")
    .order("order_in_track", { ascending: true });

  const { data: completions } = await supabaseAdmin
    .from("learn_completions")
    .select("module_id")
    .eq("user_id", user.id);

  const completedIds = new Set((completions ?? []).map((c) => c.module_id));

  const modulesByTrack = new Map<
    string,
    Array<{
      id: string;
      slug: string;
      title: string;
      estimated_minutes: number;
      points_reward: number;
    }>
  >();
  for (const m of modules ?? []) {
    const list = modulesByTrack.get(m.track_id) ?? [];
    list.push({
      id: m.id,
      slug: m.slug,
      title: m.title,
      estimated_minutes: m.estimated_minutes,
      points_reward: m.points_reward,
    });
    modulesByTrack.set(m.track_id, list);
  }

  const result = tracks.map((t) => {
    const trackModules = modulesByTrack.get(t.id) ?? [];
    const total = trackModules.length;
    const done = trackModules.filter((m) => completedIds.has(m.id)).length;

    const next = trackModules.find((m) => !completedIds.has(m.id)) ?? null;

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
      next_module:
        next && t.status !== "coming_soon"
          ? {
              slug: next.slug,
              title: next.title,
              estimated_minutes: next.estimated_minutes,
              points_reward: next.points_reward,
            }
          : null,
    };
  });

  return NextResponse.json({ tracks: result });
}
