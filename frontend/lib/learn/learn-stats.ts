import { supabaseAdmin } from "@/lib/supabase/admin";
import { sectionContentEnabled } from "@/lib/learn/section-content";

const completionsTable = () =>
  sectionContentEnabled() ? "section_completions" : "learn_completions";

export async function countUserCompletions(
  userId: string,
  sinceIso?: string,
): Promise<number> {
  let query = supabaseAdmin
    .from(completionsTable())
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId);
  if (sinceIso) query = query.gte("completed_at", sinceIso);
  const { count, error } = await query;
  if (error) throw new Error(`lessons count failed: ${error.message}`);
  return count ?? 0;
}

export async function countAllCompletions(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from(completionsTable())
    .select("id", { head: true, count: "exact" });
  if (error) throw new Error(`lessons count failed: ${error.message}`);
  return count ?? 0;
}

export async function usersWithCompletions(): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from(completionsTable())
    .select("user_id");
  if (error) throw new Error(`lessons load failed: ${error.message}`);
  return new Set((data ?? []).map((r) => r.user_id as string));
}

export async function userCompletionTimes(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from(completionsTable())
    .select("completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: true });
  if (error) throw new Error(`lessons load failed: ${error.message}`);
  return (data ?? []).map((r) => r.completed_at as string);
}

export async function countLiveLessons(): Promise<number> {
  if (!sectionContentEnabled()) {
    const { count, error } = await supabaseAdmin
      .from("learn_modules")
      .select("id", { head: true, count: "exact" })
      .eq("status", "live");
    if (error) throw new Error(`lessons count failed: ${error.message}`);
    return count ?? 0;
  }
  const ids = await liveSectionIds();
  return ids.length;
}

async function liveSectionIds(moduleSlug?: string): Promise<string[]> {
  let modules = supabaseAdmin
    .from("course_modules")
    .select("id")
    .eq("status", "available");
  if (moduleSlug) modules = modules.eq("slug", moduleSlug.toLowerCase());
  const { data: mods, error } = await modules;
  if (error) throw new Error(`modules load failed: ${error.message}`);
  const moduleIds = (mods ?? []).map((m) => m.id);
  if (moduleIds.length === 0) return [];

  const { data: sections, error: secErr } = await supabaseAdmin
    .from("course_sections")
    .select("id")
    .in("module_id", moduleIds)
    .eq("status", "live");
  if (secErr) throw new Error(`sections load failed: ${secErr.message}`);
  return (sections ?? []).map((s) => s.id);
}

export async function hasFinishedModule(
  userId: string,
  moduleSlug?: string,
): Promise<boolean> {
  if (!sectionContentEnabled()) {
    let modulesQuery = supabaseAdmin
      .from("learn_modules")
      .select("id")
      .eq("status", "live");
    if (moduleSlug) {
      const { data: track } = await supabaseAdmin
        .from("learn_tracks")
        .select("id")
        .eq("slug", moduleSlug)
        .maybeSingle();
      if (!track) return false;
      modulesQuery = modulesQuery.eq("track_id", track.id);
    }
    const { data: modules, error } = await modulesQuery;
    if (error) throw new Error(`track modules load failed: ${error.message}`);
    const ids = (modules ?? []).map((m) => m.id);
    if (ids.length === 0) return false;
    const { data: done, error: doneErr } = await supabaseAdmin
      .from("learn_completions")
      .select("module_id")
      .eq("user_id", userId)
      .in("module_id", ids);
    if (doneErr) throw new Error(`track progress failed: ${doneErr.message}`);
    const completed = new Set((done ?? []).map((c) => c.module_id));
    return ids.every((id) => completed.has(id));
  }

  const ids = await liveSectionIds(moduleSlug);
  if (ids.length === 0) return false;
  const { data: done, error } = await supabaseAdmin
    .from("section_completions")
    .select("section_id")
    .eq("user_id", userId)
    .in("section_id", ids);
  if (error) throw new Error(`module progress failed: ${error.message}`);
  const completed = new Set((done ?? []).map((c) => c.section_id));
  return ids.every((id) => completed.has(id));
}
