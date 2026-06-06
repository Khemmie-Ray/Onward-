import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DbUser, DbModule } from "@/lib/supabase/types";

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

  modulesCompleted: number;
  modulesTotal: number;
  ecosystemAppsExplored: number;
  ecosystemAppsTotal: number;

  currentModule: {
    slug: string;
    title: string;
    description: string;
    currentCard: number;
    totalCards: number;
    progressPercent: number;
  } | null;

  recentBadges: RecentBadge[];

  hoursUntilMidnightUTC: number;
  minutesUntilMidnightUTC: number;
};

export async function loadDashboardData(user: DbUser): Promise<DashboardData> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: modulesCompletedCount },
    { count: modulesTotalCount },
    { data: weekCompletions },
    { data: progressRows },
    { data: recentCompletions },
  ] = await Promise.all([

    supabaseAdmin
      .from("module_completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),

    supabaseAdmin
      .from("modules")
      .select("id", { count: "exact", head: true })
      .eq("status", "live"),

    supabaseAdmin
      .from("module_completions")
      .select("module_id, completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", oneWeekAgo),

    supabaseAdmin
      .from("module_progress")
      .select("module_id, current_card, last_active_at")
      .eq("user_id", user.id)
      .order("last_active_at", { ascending: false })
      .limit(1),

    supabaseAdmin
      .from("module_completions")
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

  const { data: relevantModules } = moduleIds.size
    ? await supabaseAdmin
        .from("modules")
        .select("id, slug, title, description, category, reward_g_amount")
        .in("id", Array.from(moduleIds))
    : { data: [] as Partial<DbModule>[] };

  const moduleById = new Map(
    (relevantModules ?? []).map((m) => [m.id as string, m])
  );

  const gEarnedThisWeek = (weekCompletions ?? []).reduce((sum, c) => {
    const m = moduleById.get(c.module_id);
    return sum + (m?.reward_g_amount ?? 0);
  }, 0);

  let currentModule: DashboardData["currentModule"] = null;
  const inProgressRow = progressRows?.[0];
  if (inProgressRow) {
    const mod = moduleById.get(inProgressRow.module_id);
    if (mod) {
      const { count: cardCount } = await supabaseAdmin
        .from("module_cards")
        .select("id", { count: "exact", head: true })
        .eq("module_id", inProgressRow.module_id);
      const totalCards = cardCount ?? 5;
      currentModule = {
        slug: mod.slug as string,
        title: mod.title as string,
        description: (mod.description as string) ?? "",
        currentCard: inProgressRow.current_card,
        totalCards,
        progressPercent: Math.round(
          (inProgressRow.current_card / totalCards) * 100
        ),
      };
    }
  }

  const recentBadges: RecentBadge[] = (recentCompletions ?? [])
    .map((c) => {
      const mod = moduleById.get(c.module_id);
      if (!mod) return null;
      return {
        moduleSlug: mod.slug as string,
        moduleTitle: mod.title as string,
        category: mod.category as string,
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
    (msUntil % (1000 * 60 * 60)) / (1000 * 60)
  );

  return {
    displayName: user.display_name ?? "there",
    walletAddress: user.wallet_address,
    currentStreak: user.current_streak,
    longestStreak: user.longest_streak,
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