import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardPoints } from "@/lib/server/point";
import { evaluateMilestones } from "@/lib/server/milestone-rewards";
import type {
  DbQuestDefinition,
  DbUserDailyQuest,
  PointSource,
  QuestMetric,
  QuestTier,
} from "@/lib/supabase/types";

export const DAILY_QUEST_BONUS = 100;

const TIERS: QuestTier[] = ["easy", "medium", "stretch"];

const ACTIVITY_POINT_SOURCES: PointSource[] = [
  "module_complete",
  "free_round_pass",
];

type QuestParams = { mode?: "free" | "premium" };

export type DailyQuest = {
  id: string;
  quest_id: string;
  tier: QuestTier;
  title: string;
  metric: QuestMetric;
  target: number;
  progress: number;
  completed_at: string | null;
};

export type MonthlyQuestView = {
  month: string;
  title: string;
  description: string | null;
  quest_points: number;
  target_quest_points: number;
  reward_points: number;
  completed_at: string | null;
};

export type QuestsView = {
  day: string;
  bonus_points: number;
  all_cleared: boolean;
  quests: DailyQuest[];
  monthly: MonthlyQuestView | null;
};

// ─── Public API ──────────────────────────────────────────────────────────────

export async function evaluateQuests(userId: string): Promise<void> {
  await safely("daily quests", () => evaluateDailyQuests(userId));
  await safely("monthly quest", () => evaluateMonthlyQuest(userId));
  await safely("milestones", () => evaluateMilestones(userId));
}

/** Everything the quests panel needs. Assigns today's quests if needed. */
export async function getQuestsView(userId: string): Promise<QuestsView> {
  const day = todayUtc();
  const quests = await evaluateDailyQuests(userId);
  const monthly = await evaluateMonthlyQuest(userId);

  return {
    day,
    bonus_points: DAILY_QUEST_BONUS,
    all_cleared: isAllCleared(quests),
    quests,
    monthly,
  };
}

// ─── Daily quests ────────────────────────────────────────────────────────────

async function evaluateDailyQuests(userId: string): Promise<DailyQuest[]> {
  const day = todayUtc();
  const quests = await getOrAssignDailyQuests(userId, day);
  const since = `${day}T00:00:00.000Z`;

  // Two of today's quests can share a metric (e.g. "Earn 100 points" and
  // "Earn 300 points"), so measure each metric once.
  const measured = new Map<string, Promise<number>>();
  const measure = (q: DailyQuest, params: QuestParams) => {
    const key = `${q.metric}:${params.mode ?? "any"}`;
    if (!measured.has(key)) {
      measured.set(key, measureToday(userId, q.metric, params, since));
    }
    return measured.get(key)!;
  };

  const definitions = await loadDefinitions(quests.map((q) => q.quest_id));

  for (const quest of quests) {
    const params = parseQuestParams(definitions.get(quest.quest_id)?.params);
    const value = await measure(quest, params);
    const progress = Math.min(value, quest.target);
    const justCompleted = value >= quest.target && !quest.completed_at;

    if (progress === quest.progress && !justCompleted) continue;

    if (justCompleted) {
      const completedAt = new Date().toISOString();
      // .is(null) guarantees completed_at is only ever set once.
      const { error } = await supabaseAdmin
        .from("user_daily_quests")
        .update({ progress, completed_at: completedAt })
        .eq("id", quest.id)
        .is("completed_at", null);
      if (error) throw new Error(`quest completion failed: ${error.message}`);
      quest.completed_at = completedAt;
    } else {
      const { error } = await supabaseAdmin
        .from("user_daily_quests")
        .update({ progress })
        .eq("id", quest.id);
      if (error) throw new Error(`quest progress failed: ${error.message}`);
    }
    quest.progress = progress;
  }

  if (isAllCleared(quests)) {
    await awardPoints({
      userId,
      delta: DAILY_QUEST_BONUS,
      source: "daily_quest",
      referenceId: `daily_quest:${day}`,
      metadata: { quest_ids: quests.map((q) => q.quest_id) },
    });
  }

  return quests;
}

async function getOrAssignDailyQuests(
  userId: string,
  day: string,
): Promise<DailyQuest[]> {
  const existing = await loadDay(userId, day);
  if (existing.length === TIERS.length) return existing;

  const { data: pool, error } = await supabaseAdmin
    .from("quest_definitions")
    .select("*")
    .eq("active", true);
  if (error) throw new Error(`quest pool load failed: ${error.message}`);

  // Never hand out a lesson quest the user can't finish because they have
  // run out of lessons.
  const lessonsLeft = await remainingLessons(userId);
  const assignedTiers = new Set(existing.map((q) => q.tier));

  const rows = TIERS.filter((tier) => !assignedTiers.has(tier)).flatMap(
    (tier) => {
      const options = (pool ?? []).filter(
        (q) =>
          q.tier === tier &&
          !(q.metric === "modules_completed" && q.target > lessonsLeft),
      );
      const pick = weightedPick(options);
      if (!pick) return [];
      return [
        {
          user_id: userId,
          quest_day: day,
          tier,
          quest_id: pick.id,
          target: pick.target,
        },
      ];
    },
  );

  if (rows.length > 0) {
    // The unique (user_id, quest_day, tier) constraint makes a double tap
    // harmless: the second insert is ignored.
    const { error: insErr } = await supabaseAdmin
      .from("user_daily_quests")
      .upsert(rows, {
        onConflict: "user_id,quest_day,tier",
        ignoreDuplicates: true,
      });
    if (insErr) throw new Error(`quest assignment failed: ${insErr.message}`);
  }

  return loadDay(userId, day);
}

async function loadDay(userId: string, day: string): Promise<DailyQuest[]> {
  const { data, error } = await supabaseAdmin
    .from("user_daily_quests")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_day", day);
  if (error) throw new Error(`quest load failed: ${error.message}`);

  const rows = (data ?? []) as DbUserDailyQuest[];
  const definitions = await loadDefinitions(rows.map((r) => r.quest_id));

  return rows
    .map((r) => {
      const def = definitions.get(r.quest_id);
      return {
        id: r.id,
        quest_id: r.quest_id,
        tier: r.tier,
        title: def?.title ?? r.quest_id,
        metric: def?.metric ?? "modules_completed",
        target: r.target,
        progress: r.progress,
        completed_at: r.completed_at,
      };
    })
    .sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier));
}

async function loadDefinitions(
  ids: string[],
): Promise<Map<string, DbQuestDefinition>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabaseAdmin
    .from("quest_definitions")
    .select("*")
    .in("id", ids);
  if (error) throw new Error(`quest definitions load failed: ${error.message}`);
  return new Map((data ?? []).map((d) => [d.id, d as DbQuestDefinition]));
}

async function measureToday(
  userId: string,
  metric: QuestMetric,
  params: QuestParams,
  since: string,
): Promise<number> {
  switch (metric) {
    case "modules_completed": {
      const { count, error } = await supabaseAdmin
        .from("learn_completions")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", userId)
        .gte("completed_at", since);
      if (error) throw new Error(`lessons count failed: ${error.message}`);
      return count ?? 0;
    }

    case "rounds_played":
    case "rounds_passed": {
      let query = supabaseAdmin
        .from("game_sessions")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", userId)
        .eq("status", "submitted")
        .gte("completed_at", since);
      if (metric === "rounds_passed") query = query.eq("passed", true);
      if (params.mode) query = query.eq("mode", params.mode);
      const { count, error } = await query;
      if (error) throw new Error(`rounds count failed: ${error.message}`);
      return count ?? 0;
    }

    case "correct_whacks": {
      let query = supabaseAdmin
        .from("game_sessions")
        .select("correct_whacks")
        .eq("user_id", userId)
        .eq("status", "submitted")
        .gte("completed_at", since);
      if (params.mode) query = query.eq("mode", params.mode);
      const { data, error } = await query;
      if (error) throw new Error(`whacks sum failed: ${error.message}`);
      return (data ?? []).reduce((sum, s) => sum + (s.correct_whacks ?? 0), 0);
    }

    case "activity_points": {
      const { data, error } = await supabaseAdmin
        .from("point_transactions")
        .select("delta")
        .eq("user_id", userId)
        .in("source", ACTIVITY_POINT_SOURCES)
        .gt("delta", 0)
        .gte("created_at", since);
      if (error) throw new Error(`points sum failed: ${error.message}`);
      return (data ?? []).reduce((sum, t) => sum + t.delta, 0);
    }
  }
}

async function remainingLessons(userId: string): Promise<number> {
  const [live, done] = await Promise.all([
    supabaseAdmin
      .from("learn_modules")
      .select("id", { head: true, count: "exact" })
      .eq("status", "live"),
    supabaseAdmin
      .from("learn_completions")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", userId),
  ]);
  return Math.max(0, (live.count ?? 0) - (done.count ?? 0));
}

// ─── Monthly quest ───────────────────────────────────────────────────────────

async function evaluateMonthlyQuest(
  userId: string,
): Promise<MonthlyQuestView | null> {
  const now = new Date();
  const month = ymd(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
  );
  const nextMonth = ymd(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  );

  const { data: config, error } = await supabaseAdmin
    .from("monthly_quests")
    .select("*")
    .eq("month", month)
    .maybeSingle();
  if (error) throw new Error(`monthly quest load failed: ${error.message}`);
  if (!config) return null; // no theme set for this month

  const [{ count, error: countErr }, { data: done, error: doneErr }] =
    await Promise.all([
      supabaseAdmin
        .from("user_daily_quests")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", userId)
        .gte("quest_day", month)
        .lt("quest_day", nextMonth)
        .not("completed_at", "is", null),
      supabaseAdmin
        .from("user_monthly_quests")
        .select("completed_at")
        .eq("user_id", userId)
        .eq("month", month)
        .maybeSingle(),
    ]);
  if (countErr)
    throw new Error(`quest points count failed: ${countErr.message}`);
  if (doneErr)
    throw new Error(`monthly status load failed: ${doneErr.message}`);

  const questPoints = count ?? 0;
  let completedAt = done?.completed_at ?? null;

  if (!completedAt && questPoints >= config.target_quest_points) {
    // Pay first (idempotent), then record. If the record fails, the next
    // evaluation retries both and the payment is a no-op.
    if (config.reward_points > 0) {
      await awardPoints({
        userId,
        delta: config.reward_points,
        source: "monthly_quest",
        referenceId: `monthly_quest:${month.slice(0, 7)}`,
        metadata: { month, quest_points: questPoints },
      });
    }
    const { error: insErr } = await supabaseAdmin
      .from("user_monthly_quests")
      .upsert(
        { user_id: userId, month },
        { onConflict: "user_id,month", ignoreDuplicates: true },
      );
    if (insErr) throw new Error(`monthly record failed: ${insErr.message}`);
    completedAt = new Date().toISOString();
  }

  return {
    month,
    title: config.title,
    description: config.description,
    quest_points: questPoints,
    target_quest_points: config.target_quest_points,
    reward_points: config.reward_points,
    completed_at: completedAt,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isAllCleared(quests: DailyQuest[]): boolean {
  return quests.length === TIERS.length && quests.every((q) => q.completed_at);
}

function weightedPick<T extends { weight: number }>(items: T[]): T | null {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return null;
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}

function parseQuestParams(raw: unknown): QuestParams {
  if (!raw || typeof raw !== "object") return {};
  const mode = (raw as Record<string, unknown>).mode;
  return mode === "free" || mode === "premium" ? { mode } : {};
}

function todayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return ymd(d);
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function safely(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    console.error(`[evaluateQuests] ${label} failed`, err);
  }
}
