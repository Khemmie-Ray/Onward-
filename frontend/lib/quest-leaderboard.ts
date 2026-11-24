import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPeriodEnd, getPeriodStart } from "@/lib/leaderboard-period";

const PAGE_SIZE = 1000;

export const QUEST_PAYOUTS_BY_RANK: Record<number, number> = {
  1: 1100,
  2: 800,
  3: 600,
};

export const QUEST_TOP_PAID_RANK = Math.max(
  ...Object.keys(QUEST_PAYOUTS_BY_RANK).map(Number),
);

export type QuestStanding = {
  user_id: string;
  quest_points: number;
  last_completed_at: string;
};

export type QuestBoardEntry = {
  rank: number;
  user_id: string;
  display_name: string;
  quest_points: number;
  is_viewer: boolean;
};

export type QuestLeaderboardResponse = {
  period_start: string;
  period_end: string;
  total_players: number;
  entries: QuestBoardEntry[];
  viewer: QuestBoardEntry | null;
};

export async function getWeeklyQuestStandings(
  now: Date = new Date(),
): Promise<QuestStanding[]> {
  const start = getPeriodStart(now).toISOString();
  const end = getPeriodEnd(now).toISOString();

  const rows: { user_id: string; completed_at: string | null }[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from("user_daily_quests")
      .select("user_id, completed_at")
      .gte("completed_at", start)
      .lt("completed_at", end)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`quest standings failed: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const byUser = new Map<string, QuestStanding>();
  for (const row of rows) {
    if (!row.completed_at) continue;
    const current = byUser.get(row.user_id);
    if (!current) {
      byUser.set(row.user_id, {
        user_id: row.user_id,
        quest_points: 1,
        last_completed_at: row.completed_at,
      });
    } else {
      current.quest_points += 1;
      if (row.completed_at > current.last_completed_at) {
        current.last_completed_at = row.completed_at;
      }
    }
  }

  return [...byUser.values()].sort(
    (a, b) =>
      b.quest_points - a.quest_points ||
      a.last_completed_at.localeCompare(b.last_completed_at),
  );
}

export async function getQuestLeaderboard(
  viewerId: string,
  limit = 50,
): Promise<QuestLeaderboardResponse> {
  const now = new Date();
  const standings = await getWeeklyQuestStandings(now);
  const top = standings.slice(0, limit);

  const viewerIdx = standings.findIndex((s) => s.user_id === viewerId);
  const ids = new Set(top.map((s) => s.user_id));
  if (viewerIdx >= 0) ids.add(viewerId);

  const names = new Map<string, string>();
  if (ids.size > 0) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, display_name")
      .in("id", [...ids]);
    if (error) throw new Error(`board names failed: ${error.message}`);
    for (const u of data ?? []) names.set(u.id, u.display_name ?? "Learner");
  }

  const toEntry = (s: QuestStanding, index: number): QuestBoardEntry => ({
    rank: index + 1,
    user_id: s.user_id,
    display_name: names.get(s.user_id) ?? "Learner",
    quest_points: s.quest_points,
    is_viewer: s.user_id === viewerId,
  });

  return {
    period_start: getPeriodStart(now).toISOString(),
    period_end: getPeriodEnd(now).toISOString(),
    total_players: standings.length,
    entries: top.map(toEntry),
    viewer: viewerIdx >= 0 ? toEntry(standings[viewerIdx], viewerIdx) : null,
  };
}
