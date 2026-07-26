import { supabaseAdmin } from "@/lib/supabase/admin";

export type ModuleLockState = "completed" | "current" | "locked";

export type ModuleWithLock = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order_in_track: number;
  estimated_minutes: number;
  points_reward: number;
  first_card_tease: string | null;
  what_you_will_learn: string[];
  lock_state: ModuleLockState;
};

export function computeLockStates(
  modules: Array<{
    id: string;
    order_in_track: number;
    [k: string]: unknown;
  }>,
  completedModuleIds: Set<string>,
): Map<string, ModuleLockState> {
  const ordered = [...modules].sort(
    (a, b) => a.order_in_track - b.order_in_track,
  );
  const states = new Map<string, ModuleLockState>();

  let previousCompleted = true; 

  for (const mod of ordered) {
    if (completedModuleIds.has(mod.id)) {
      states.set(mod.id, "completed");
      previousCompleted = true;
      continue;
    }
    
    states.set(mod.id, previousCompleted ? "current" : "locked");
    previousCompleted = false; 
  }

  return states;
}

export async function getTrackModulesWithLock(
  trackSlug: string,
  userId: string,
): Promise<ModuleWithLock[] | null> {
  const { data: track } = await supabaseAdmin
    .from("learn_tracks")
    .select("id")
    .eq("slug", trackSlug)
    .maybeSingle();

  if (!track) return null;

  const { data: modules } = await supabaseAdmin
    .from("learn_modules")
    .select(
      "id, slug, title, description, order_in_track, estimated_minutes, points_reward, first_card_tease, what_you_will_learn",
    )
    .eq("track_id", track.id)
    .eq("status", "live")
    .order("order_in_track", { ascending: true });

  if (!modules || modules.length === 0) return [];

  const { data: completions } = await supabaseAdmin
    .from("learn_completions")
    .select("module_id")
    .eq("user_id", userId)
    .in(
      "module_id",
      modules.map((m) => m.id),
    );

  const completedIds = new Set((completions ?? []).map((c) => c.module_id));
  const states = computeLockStates(modules, completedIds);

  return modules.map((m) => ({
    ...m,
    lock_state: states.get(m.id) ?? "locked",
  })) as ModuleWithLock[];
}

export async function assertModulePlayable(
  moduleSlug: string,
  userId: string,
): Promise<
  | { ok: true; moduleId: string; lockState: ModuleLockState }
  | { ok: false; reason: "not_found" | "locked" }
> {
  const { data: mod } = await supabaseAdmin
    .from("learn_modules")
    .select("id, track_id, order_in_track")
    .eq("slug", moduleSlug)
    .maybeSingle();

  if (!mod) return { ok: false, reason: "not_found" };

  const { data: siblings } = await supabaseAdmin
    .from("learn_modules")
    .select("id, order_in_track")
    .eq("track_id", mod.track_id)
    .eq("status", "live");

  const { data: completions } = await supabaseAdmin
    .from("learn_completions")
    .select("module_id")
    .eq("user_id", userId)
    .in(
      "module_id",
      (siblings ?? []).map((s) => s.id),
    );

  const completedIds = new Set((completions ?? []).map((c) => c.module_id));
  const states = computeLockStates(siblings ?? [], completedIds);
  const lockState = states.get(mod.id) ?? "locked";

  if (lockState === "locked") return { ok: false, reason: "locked" };
  return { ok: true, moduleId: mod.id, lockState };
}
