import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DbUser } from "@/lib/supabase/types";
import { sectionContentEnabled } from "@/lib/learn/section-content";
import {
  countLiveLessons,
  countUserCompletions,
} from "@/lib/learn/learn-stats";

export type RecentBadge = {
  moduleSlug: string;
  moduleTitle: string;
  category: string;
  earnedAt: string;
};

export type DashboardData = {
  displayName: string;
  walletAddress: string;
  currentStreak: number;
  longestStreak: number;
  totalGEarned: number;
  gEarnedThisWeek: number;
  currentLevel: number;
  avatarId: string | null;

  modulesCompleted: number;
  modulesTotal: number;
  ecosystemAppsExplored: number;
  ecosystemAppsTotal: number;

  currentModule: {
    slug: string;
    title: string;
    description: string;
    trackSlug: string; 
    currentCard: number;
    totalCards: number;
    progressPercent: number;
  } | null;

  recentBadges: RecentBadge[];

  hoursUntilMidnightUTC: number;
  minutesUntilMidnightUTC: number;
};

type LearnSummary = Pick<
  DashboardData,
  | "modulesCompleted"
  | "modulesTotal"
  | "gEarnedThisWeek"
  | "currentModule"
  | "recentBadges"
>;

export async function loadDashboardData(user: DbUser): Promise<DashboardData> {
  const learn = sectionContentEnabled()
    ? await loadSectionLearnSummary(user.id)
    : await loadLegacyLearnSummary(user.id);

  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  const msUntil = midnight.getTime() - now.getTime();
  const hoursUntilMidnightUTC = Math.floor(msUntil / (1000 * 60 * 60));
  const minutesUntilMidnightUTC = Math.floor(
    (msUntil % (1000 * 60 * 60)) / (1000 * 60),
  );

  return {
    displayName: user.display_name ?? "there",
    walletAddress: user.wallet_address,
    currentStreak: user.current_streak,
    longestStreak: user.longest_streak,
    avatarId: user.avatar_id ?? null,
    totalGEarned: Number(user.total_g_earned),
    gEarnedThisWeek: learn.gEarnedThisWeek,
    currentLevel: user.current_level,
    modulesCompleted: learn.modulesCompleted,
    modulesTotal: learn.modulesTotal,
    ecosystemAppsExplored: 0,
    ecosystemAppsTotal: 8,
    currentModule: learn.currentModule,
    recentBadges: learn.recentBadges,
    hoursUntilMidnightUTC,
    minutesUntilMidnightUTC,
  };
}

async function loadLegacyLearnSummary(userId: string): Promise<LearnSummary> {
  const oneWeekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    { count: modulesCompletedCount },
    { count: modulesTotalCount },
    { data: weekCompletions },
    { data: progressRows },
    { data: recentCompletions },
  ] = await Promise.all([
    supabaseAdmin
      .from("learn_completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    supabaseAdmin
      .from("learn_modules")
      .select("id", { count: "exact", head: true })
      .eq("status", "live"),

    supabaseAdmin
      .from("learn_completions")
      .select("module_id, completed_at, points_awarded")
      .eq("user_id", userId)
      .gte("completed_at", oneWeekAgo),

    supabaseAdmin
      .from("learn_progress")
      .select("module_id, current_card, last_active_at")
      .eq("user_id", userId)
      .order("last_active_at", { ascending: false })
      .limit(1),

    supabaseAdmin
      .from("learn_completions")
      .select("module_id, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(3),
  ]);

  const moduleIds = new Set<string>([
    ...(weekCompletions ?? []).map((c) => c.module_id),
    ...(progressRows ?? []).map((p) => p.module_id),
    ...(recentCompletions ?? []).map((c) => c.module_id),
  ]);

  const { data: relevantModules } = moduleIds.size
    ? await supabaseAdmin
        .from("learn_modules")
        .select("id, slug, title, description, track_id")
        .in("id", Array.from(moduleIds))
    : {
        data: [] as Array<{
          id: string;
          slug: string;
          title: string;
          description: string | null;
          track_id: string;
        }>,
      };

  const trackIds = new Set(
    (relevantModules ?? []).map((m) => m.track_id).filter(Boolean),
  );
  const { data: tracks } = trackIds.size
    ? await supabaseAdmin
        .from("learn_tracks")
        .select("id, slug, title")
        .in("id", Array.from(trackIds))
    : { data: [] as Array<{ id: string; slug: string; title: string }> };

  const trackById = new Map((tracks ?? []).map((t) => [t.id, t]));
  const moduleById = new Map((relevantModules ?? []).map((m) => [m.id, m]));

  const gEarnedThisWeek = (weekCompletions ?? []).reduce(
    (sum, c) => sum + (c.points_awarded ?? 0),
    0,
  );

  let currentModule: DashboardData["currentModule"] = null;
  const inProgressRow = progressRows?.[0];
  if (inProgressRow) {
    const mod = moduleById.get(inProgressRow.module_id);
    if (mod) {
      const { count: cardCount } = await supabaseAdmin
        .from("learn_cards")
        .select("id", { count: "exact", head: true })
        .eq("module_id", inProgressRow.module_id);
      const totalCards = cardCount ?? 5;
      const track = trackById.get(mod.track_id);
      currentModule = {
        slug: mod.slug,
        title: mod.title,
        description: mod.description ?? "",
        trackSlug: track?.slug ?? "",
        currentCard: inProgressRow.current_card,
        totalCards,
        progressPercent: Math.round(
          (inProgressRow.current_card / totalCards) * 100,
        ),
      };
    }
  }

  const recentBadges: RecentBadge[] = (recentCompletions ?? [])
    .map((c) => {
      const mod = moduleById.get(c.module_id);
      if (!mod) return null;
      const track = trackById.get(mod.track_id);
      return {
        moduleSlug: mod.slug,
        moduleTitle: mod.title,
        category: track?.title ?? "Learn",
        earnedAt: c.completed_at,
      };
    })
    .filter((b): b is RecentBadge => b !== null);

  return {
    modulesCompleted: modulesCompletedCount ?? 0,
    modulesTotal: modulesTotalCount ?? 0,
    gEarnedThisWeek,
    currentModule,
    recentBadges,
  };
}

async function loadSectionLearnSummary(userId: string): Promise<LearnSummary> {
  const oneWeekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    modulesCompleted,
    modulesTotal,
    { data: week },
    { data: progressRows },
    { data: recent },
  ] = await Promise.all([
    countUserCompletions(userId),
    countLiveLessons(),
    supabaseAdmin
      .from("section_completions")
      .select("points_awarded")
      .eq("user_id", userId)
      .gte("completed_at", oneWeekAgo),
    supabaseAdmin
      .from("section_progress")
      .select("section_id, current_card, last_active_at")
      .eq("user_id", userId)
      .order("last_active_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("section_completions")
      .select("section_id, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(3),
  ]);

  const sectionIds = new Set<string>([
    ...(progressRows ?? []).map((p) => p.section_id),
    ...(recent ?? []).map((c) => c.section_id),
  ]);
  const { data: sections } = sectionIds.size
    ? await supabaseAdmin
        .from("course_sections")
        .select("id, slug, title, description, module_id")
        .in("id", [...sectionIds])
    : {
        data: [] as {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          module_id: string;
        }[],
      };

  const moduleIds = new Set((sections ?? []).map((s) => s.module_id));
  const { data: modules } = moduleIds.size
    ? await supabaseAdmin
        .from("course_modules")
        .select("id, slug, title")
        .in("id", [...moduleIds])
    : { data: [] as { id: string; slug: string; title: string }[] };

  const sectionById = new Map((sections ?? []).map((s) => [s.id, s]));
  const moduleById = new Map((modules ?? []).map((m) => [m.id, m]));

  // The section opened most recently that isn't finished yet.
  const { data: finishedRows } = progressRows?.length
    ? await supabaseAdmin
        .from("section_completions")
        .select("section_id")
        .eq("user_id", userId)
        .in(
          "section_id",
          progressRows.map((p) => p.section_id),
        )
    : { data: [] as { section_id: string }[] };
  const finished = new Set((finishedRows ?? []).map((r) => r.section_id));
  const open = (progressRows ?? []).find((p) => !finished.has(p.section_id));

  let currentModule: DashboardData["currentModule"] = null;
  const openSection = open ? sectionById.get(open.section_id) : undefined;
  if (open && openSection) {
    const { data: version } = await supabaseAdmin
      .from("section_versions")
      .select("items")
      .eq("section_id", open.section_id)
      .eq("status", "published")
      .maybeSingle();
    const totalCards =
      Array.isArray(version?.items) && version.items.length > 0
        ? version.items.length
        : 5;
    currentModule = {
      slug: openSection.slug,
      title: openSection.title,
      description: openSection.description ?? "",
      trackSlug: moduleById.get(openSection.module_id)?.slug ?? "",
      currentCard: open.current_card,
      totalCards,
      progressPercent: Math.round((open.current_card / totalCards) * 100),
    };
  }

  const recentBadges: RecentBadge[] = (recent ?? [])
    .map((c) => {
      const section = sectionById.get(c.section_id);
      if (!section) return null;
      return {
        moduleSlug: section.slug,
        moduleTitle: section.title,
        category: moduleById.get(section.module_id)?.title ?? "Learn",
        earnedAt: c.completed_at,
      };
    })
    .filter((b): b is RecentBadge => b !== null);

  return {
    modulesCompleted,
    modulesTotal,
    gEarnedThisWeek: (week ?? []).reduce(
      (sum, c) => sum + (c.points_awarded ?? 0),
      0,
    ),
    currentModule,
    recentBadges,
  };
}
