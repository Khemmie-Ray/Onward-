import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeLockStates } from "@/lib/learn/lock";
import { getEnrolledCourseIds } from "@/lib/server/enrollment";
import type { DbCourseModule, DbCourseSection, DbSectionCompletion } from "@/lib/supabase/types";

// ─── The daily rule ─────────────────────────────────────────────────────────

export function utcDayStart(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function nextUtcDayStart(now = new Date()): Date {
  const d = utcDayStart(now);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

export type DailyState = {
  done_today: boolean;
  resets_at: string;
};

export async function getDailyState(userId: string): Promise<DailyState> {
  const { count, error } = await supabaseAdmin
    .from("section_completions")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId)
    .gte("completed_at", utcDayStart().toISOString());
  if (error) throw new Error(`daily state failed: ${error.message}`);
  return { done_today: (count ?? 0) > 0, resets_at: nextUtcDayStart().toISOString() };
}

// ─── Lock states ────────────────────────────────────────────────────────────

export type SectionLockState = "completed" | "current" | "tomorrow" | "locked";

type SectionRow = Pick<
  DbCourseSection,
  | "id"
  | "slug"
  | "title"
  | "description"
  | "order_in_module"
  | "estimated_minutes"
  | "points_reward"
  | "first_card_tease"
  | "what_you_will_learn"
  | "legacy_module_id"
>;

const SECTION_FIELDS =
  "id, slug, title, description, order_in_module, estimated_minutes, points_reward, first_card_tease, what_you_will_learn, legacy_module_id";

export function sectionLockStates(
  sections: SectionRow[],
  completedIds: Set<string>,
  doneToday: boolean,
): Map<string, SectionLockState> {
  const base = computeLockStates(
    sections.map((s) => ({ id: s.id, order_in_track: s.order_in_module })),
    completedIds,
  );
  const states = new Map<string, SectionLockState>();
  for (const [id, state] of base) {
    states.set(id, state === "current" && doneToday ? "tomorrow" : state);
  }
  return states;
}

async function liveSections(moduleIds: string[]): Promise<(SectionRow & { module_id: string })[]> {
  if (moduleIds.length === 0) return [];
  const { data, error } = await supabaseAdmin
    .from("course_sections")
    .select(`module_id, ${SECTION_FIELDS}`)
    .in("module_id", moduleIds)
    .eq("status", "live")
    .order("order_in_module", { ascending: true });
  if (error) throw new Error(`sections load failed: ${error.message}`);
  return (data ?? []) as (SectionRow & { module_id: string })[];
}

async function completedSectionIds(userId: string, sectionIds?: string[]): Promise<Set<string>> {
  let query = supabaseAdmin.from("section_completions").select("section_id").eq("user_id", userId);
  if (sectionIds) {
    if (sectionIds.length === 0) return new Set();
    query = query.in("section_id", sectionIds);
  }
  const { data, error } = await query;
  if (error) throw new Error(`completions load failed: ${error.message}`);
  return new Set((data ?? []).map((c) => c.section_id));
}

// ─── All modules (the "All tracks" list) ────────────────────────────────────

export type ModuleCard = {
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  status: DbCourseModule["status"];
  total_modules: number;
  completed_modules: number;
  progress_state: "coming_soon" | "empty" | "not_started" | "in_progress" | "complete";
  next_module: {
    slug: string;
    title: string;
    estimated_minutes: number;
    points_reward: number;
    opens_tomorrow: boolean;
  } | null;
};

export async function listModules(
  userId: string,
): Promise<{ enrolled: boolean; tracks: ModuleCard[]; daily: DailyState | null }> {
  const enrolled = await getEnrolledCourseIds(userId);
  if (enrolled.size === 0) return { enrolled: false, tracks: [], daily: null };

  const { data: modules, error } = await supabaseAdmin
    .from("course_modules")
    .select("id, slug, title, description, icon, status, order_index")
    .in("course_id", [...enrolled])
    .neq("status", "draft")
    .order("order_index", { ascending: true });
  if (error) throw new Error(`modules load failed: ${error.message}`);

  const sections = await liveSections((modules ?? []).map((m) => m.id));
  const [completed, daily] = await Promise.all([
    completedSectionIds(userId),
    getDailyState(userId),
  ]);

  const tracks = (modules ?? []).map((m): ModuleCard => {
    const own = sections.filter((s) => s.module_id === m.id);
    const done = own.filter((s) => completed.has(s.id)).length;
    const next = own.find((s) => !completed.has(s.id)) ?? null;
    const comingSoon = m.status === "coming_soon";

    return {
      slug: m.slug,
      title: m.title,
      description: m.description,
      icon: m.icon,
      status: m.status,
      total_modules: own.length,
      completed_modules: done,
      progress_state: comingSoon
        ? "coming_soon"
        : own.length === 0
          ? "empty"
          : done === 0
            ? "not_started"
            : done === own.length
              ? "complete"
              : "in_progress",
      next_module:
        next && !comingSoon
          ? {
              slug: next.slug,
              title: next.title,
              estimated_minutes: next.estimated_minutes,
              points_reward: next.points_reward,
              opens_tomorrow: daily.done_today,
            }
          : null,
    };
  });

  return { enrolled: true, tracks, daily };
}

// ─── One module and its sections (the hex page) ─────────────────────────────

export type SectionWithLock = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order_in_track: number;
  estimated_minutes: number;
  points_reward: number;
  first_card_tease: string | null;
  what_you_will_learn: string[];
  lock_state: SectionLockState;
};

export type ModuleDetail = {
  track: { slug: string; title: string; description: string | null; status: string };
  modules: SectionWithLock[];
  daily: DailyState;
};

export async function getModuleDetail(
  moduleSlug: string,
  userId: string,
): Promise<ModuleDetail | "not_found" | "not_enrolled"> {
  const { data: mod } = await supabaseAdmin
    .from("course_modules")
    .select("id, slug, title, description, status, course_id")
    .eq("slug", moduleSlug.toLowerCase())
    .neq("status", "draft")
    .maybeSingle();
  if (!mod) return "not_found";

  const enrolled = await getEnrolledCourseIds(userId);
  if (!enrolled.has(mod.course_id)) return "not_enrolled";

  const sections = await liveSections([mod.id]);
  const [completed, daily] = await Promise.all([
    completedSectionIds(userId, sections.map((s) => s.id)),
    getDailyState(userId),
  ]);
  const states = sectionLockStates(sections, completed, daily.done_today);

  return {
    track: { slug: mod.slug, title: mod.title, description: mod.description, status: mod.status },
    modules: sections.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      order_in_track: s.order_in_module,
      estimated_minutes: s.estimated_minutes,
      points_reward: s.points_reward,
      first_card_tease: s.first_card_tease,
      what_you_will_learn: s.what_you_will_learn ?? [],
      lock_state: states.get(s.id) ?? "locked",
    })),
    daily,
  };
}

// ─── Opening and finishing one section ──────────────────────────────────────

export type SectionAccess =
  | {
      ok: true;
      section: SectionRow;
      module: { id: string; slug: string; title: string };
      /** Already finished: the learner may review it, for no reward. */
      completion: DbSectionCompletion | null;
    }
  | { ok: false; reason: "not_found" | "not_enrolled" | "locked" }
  | { ok: false; reason: "daily_limit"; resets_at: string };

export async function checkSectionAccess(sectionSlug: string, userId: string): Promise<SectionAccess> {
  const { data: section } = await supabaseAdmin
    .from("course_sections")
    .select(`module_id, ${SECTION_FIELDS}`)
    .eq("slug", sectionSlug)
    .eq("status", "live")
    .maybeSingle();
  if (!section) return { ok: false, reason: "not_found" };

  const { data: mod } = await supabaseAdmin
    .from("course_modules")
    .select("id, slug, title, status, course_id")
    .eq("id", section.module_id)
    .maybeSingle();
  if (!mod || mod.status !== "available") return { ok: false, reason: "not_found" };

  const enrolled = await getEnrolledCourseIds(userId);
  if (!enrolled.has(mod.course_id)) return { ok: false, reason: "not_enrolled" };

  const { data: completion } = await supabaseAdmin
    .from("section_completions")
    .select("*")
    .eq("user_id", userId)
    .eq("section_id", section.id)
    .maybeSingle();

  const moduleInfo = { id: mod.id, slug: mod.slug, title: mod.title };
  if (completion) return { ok: true, section, module: moduleInfo, completion };

  const siblings = await liveSections([mod.id]);
  const [completed, daily] = await Promise.all([
    completedSectionIds(userId, siblings.map((s) => s.id)),
    getDailyState(userId),
  ]);
  const state = sectionLockStates(siblings, completed, daily.done_today).get(section.id) ?? "locked";

  if (state === "locked") return { ok: false, reason: "locked" };
  if (state === "tomorrow") return { ok: false, reason: "daily_limit", resets_at: daily.resets_at };
  return { ok: true, section, module: moduleInfo, completion: null };
}

export async function touchSectionProgress(userId: string, sectionId: string) {
  const { error } = await supabaseAdmin.from("section_progress").upsert(
    { user_id: userId, section_id: sectionId, last_active_at: new Date().toISOString() },
    { onConflict: "user_id,section_id" },
  );
  if (error) console.error("[course-store] progress update failed", error.message);
}

export async function insertSectionCompletion(input: {
  userId: string;
  sectionId: string;
  versionId: string | null;
  score: number | null;
  badgeTokenId: string | null;
  badgeTxHash: string | null;
}): Promise<DbSectionCompletion | null> {
  const { data, error } = await supabaseAdmin
    .from("section_completions")
    .insert({
      user_id: input.userId,
      section_id: input.sectionId,
      version_id: input.versionId,
      score: input.score,
      points_awarded: 0,
      badge_token_id: input.badgeTokenId,
      badge_tx_hash: input.badgeTxHash,
      source: "live",
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return null;
    throw new Error(`completion insert failed: ${error.message}`);
  }
  return data;
}

export async function mirrorToLegacyCompletion(input: {
  userId: string;
  legacyModuleId: string | null;
  completion: DbSectionCompletion;
}) {
  if (!input.legacyModuleId) return;
  try {
    const { data, error } = await supabaseAdmin
      .from("learn_completions")
      .upsert(
        {
          user_id: input.userId,
          module_id: input.legacyModuleId,
          completed_at: input.completion.completed_at,
          quiz_score: input.completion.score,
          points_awarded: input.completion.points_awarded,
          badge_token_id: input.completion.badge_token_id,
          badge_tx_hash: input.completion.badge_tx_hash,
        },
        { onConflict: "user_id,module_id", ignoreDuplicates: true },
      )
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("[course-store] legacy mirror failed", error.message);
      return;
    }
    if (data?.id) {
      await supabaseAdmin
        .from("section_completions")
        .update({ legacy_completion_id: data.id })
        .eq("id", input.completion.id);
    }
  } catch (err) {
    console.error("[course-store] legacy mirror failed", err);
  }
}