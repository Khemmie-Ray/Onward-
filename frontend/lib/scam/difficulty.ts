import { supabaseAdmin } from "@/lib/supabase/admin";

export type TierKey = "easy" | "hard" | "superhard";

export type DifficultyTier = {
  key: TierKey;
  label: string;
  rank: number;
  totalSeconds: number;
  popupDurationMs: number;
  baseSpawnDelay: number;
  spawnJitter: number;
  boardSize: number;
  listSize: number;
  scamRatio: number;
  minPatternDifficulty: number;
  maxPatternDifficulty: number;
  minPrecision: number | null;
  minCorrect: number | null;
  minRecall: number | null;
};

const CYCLE_LENGTH = 8;
const HARD_POSITION = 5;
const SUPERHARD_POSITION = 8;

export function tierKeyForPlay(playNumber: number): TierKey {
  if (playNumber < 1) playNumber = 1;
  const pos = ((playNumber - 1) % CYCLE_LENGTH) + 1; 
  if (pos === SUPERHARD_POSITION) return "superhard";
  if (pos === HARD_POSITION) return "hard";
  return "easy";
}

export async function lifetimePlayCount(userId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("game_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["active", "submitted", "expired"]);
  return count ?? 0;
}

export async function resolveTierKeyForNextPlay(
  userId: string,
): Promise<TierKey> {
  const played = await lifetimePlayCount(userId);
  return tierKeyForPlay(played + 1);
}

function rowToTier(row: Record<string, unknown>): DifficultyTier {
  return {
    key: row.key as TierKey,
    label: row.label as string,
    rank: Number(row.rank),
    totalSeconds: Number(row.total_seconds),
    popupDurationMs: Number(row.popup_duration_ms),
    baseSpawnDelay: Number(row.base_spawn_delay),
    spawnJitter: Number(row.spawn_jitter),
    boardSize: Number(row.board_size),
    listSize: Number(row.list_size),
    scamRatio: Number(row.scam_ratio),
    minPatternDifficulty: Number(row.min_pattern_difficulty),
    maxPatternDifficulty: Number(row.max_pattern_difficulty),
    minPrecision: row.min_precision === null ? null : Number(row.min_precision),
    minCorrect: row.min_correct === null ? null : Number(row.min_correct),
    minRecall: row.min_recall === null ? null : Number(row.min_recall),
  };
}

const FALLBACK: Record<TierKey, DifficultyTier> = {
  easy: {
    key: "easy",
    label: "Easy",
    rank: 1,
    totalSeconds: 60,
    popupDurationMs: 1550,
    baseSpawnDelay: 450,
    spawnJitter: 300,
    boardSize: 6,
    listSize: 100,
    scamRatio: 0.4,
    minPatternDifficulty: 1,
    maxPatternDifficulty: 2,
    minPrecision: null,
    minCorrect: null,
    minRecall: null,
  },
  hard: {
    key: "hard",
    label: "Hard",
    rank: 2,
    totalSeconds: 60,
    popupDurationMs: 1150,
    baseSpawnDelay: 340,
    spawnJitter: 240,
    boardSize: 6,
    listSize: 110,
    scamRatio: 0.45,
    minPatternDifficulty: 2,
    maxPatternDifficulty: 4,
    minPrecision: 0.65,
    minCorrect: null,
    minRecall: 0.6,
  },
  superhard: {
    key: "superhard",
    label: "Superhard",
    rank: 3,
    totalSeconds: 60,
    popupDurationMs: 900,
    baseSpawnDelay: 260,
    spawnJitter: 200,
    boardSize: 6,
    listSize: 120,
    scamRatio: 0.5,
    minPatternDifficulty: 3,
    maxPatternDifficulty: 5,
    minPrecision: 0.7,
    minCorrect: null,
    minRecall: 0.7,
  },
};

export async function loadTier(key: TierKey): Promise<DifficultyTier> {
  try {
    const { data } = await supabaseAdmin
      .from("difficulty_tiers")
      .select("*")
      .eq("key", key)
      .eq("is_active", true)
      .maybeSingle();
    if (data) return rowToTier(data as Record<string, unknown>);
  } catch (e) {
    console.error("[difficulty] loadTier read failed, using fallback", {
      key,
      e,
    });
  }
  return FALLBACK[key];
}
