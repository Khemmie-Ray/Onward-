import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DbUser } from "@/lib/supabase/types";

export type RecentBadge = {
  moduleSlug: string;
  moduleTitle: string;
  category: string; // now holds the track title
  earnedAt: string;
};

export type DashboardData = {
  displayName: string;
  walletAddress: string;
  currentStreak: number;
  longestStreak: number;
  totalGEarned: number;
  gEarnedThisWeek: number; // retained for shape; now reflects points earned this week
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
    trackSlug: string; // added so the resume link can point at /learn/[track]
    currentCard: number;
    totalCards: number;
    progressPercent: number;
  } | null;

  recentBadges: RecentBadge[];

  hoursUntilMidnightUTC: number;
  minutesUntilMidnightUTC: number;
};

export async function loadDashboardData(user: DbUser): Promise<DashboardData> {
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
      .eq("user_id", user.id),

    supabaseAdmin
      .from("learn_modules")
      .select("id", { count: "exact", head: true })
      .eq("status", "live"),

    supabaseAdmin
      .from("learn_completions")
      .select("module_id, completed_at, points_awarded")
      .eq("user_id", user.id)
      .gte("completed_at", oneWeekAgo),

    supabaseAdmin
      .from("learn_progress")
      .select("module_id, current_card, last_active_at")
      .eq("user_id", user.id)
      .order("last_active_at", { ascending: false })
      .limit(1),

    supabaseAdmin
      .from("learn_completions")
      .select("module_id, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(3),
  ]);

  const moduleIds = new Set<string>([
    ...(weekCompletions ?? []).map((c) => c.module_id),
    ...(progressRows ?? []).map((p) => p.module_id),
    ...(recentCompletions ?? []).map((c) => c.module_id),
  ]);

  // Load the modules we need, plus their track (for the title that stands in
  // for the old "category", and the track slug for resume links).
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

  // Points earned this week from learn completions.
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
    gEarnedThisWeek,
    currentLevel: user.current_level,
    modulesCompleted: modulesCompletedCount ?? 0,
    modulesTotal: modulesTotalCount ?? 0,
    ecosystemAppsExplored: 0,
    ecosystemAppsTotal: 8,
    currentModule,
    recentBadges,
    hoursUntilMidnightUTC,
    minutesUntilMidnightUTC,
  };
}
