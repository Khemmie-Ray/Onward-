import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PlayMode } from "@/lib/scoring";
import { loadTier, type DifficultyTier, type TierKey } from "./difficulty";
import { getTodaysPattern } from "./rotation";

export type RoundItem = {
  pattern_id: string;
  is_scam: boolean;
};

export type PatternRow = {
  id: string;
  family: string;
  family_label: string;
  family_description: string;
  is_scam: boolean;
  is_exemplar: boolean;
  difficulty: number;
  kind: string;
  content: Record<string, unknown>;
  teaching: string;
};

export type GeneratedRound = {
  featured_family: string;
  family_label: string;
  family_description: string;
  exemplar: PatternRow;
  items: RoundItem[];
  full_patterns: PatternRow[];
  popup_duration_ms: number;
  total_seconds: number;
  board_progression: number[];
  base_spawn_delay: number;
  spawn_jitter: number;
  tier: DifficultyTier;
};

export { type PlayMode };

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function spreadPick<T>(pool: T[], n: number): T[] {
  const out: T[] = [];
  let deck: T[] = [];
  while (out.length < n) {
    if (deck.length === 0) deck = shuffle(pool);
    out.push(deck.pop() as T);
  }
  return out;
}

export async function generateRound(
  tier: DifficultyTier,
): Promise<GeneratedRound> {
  // Content is today's pattern from the rotation. Difficulty belongs to the
  // game, not the content: the tier only sets speed, list size, scam ratio
  // and pass rules. Every scam on the board is today's pattern.
  const pattern = await getTodaysPattern();

  const numScams = Math.floor(tier.listSize * tier.scamRatio);
  const numLegits = tier.listSize - numScams;

  const { data: legitPool } = await supabaseAdmin
    .from("scam_patterns")
    .select("*")
    .eq("is_scam", false);

  if (!legitPool?.length) throw new Error("No legit patterns");

  const chosenScams: PatternRow[] = Array.from(
    { length: numScams },
    () => pattern,
  );
  const chosenLegits = spreadPick(legitPool as PatternRow[], numLegits);
  const sequence = shuffle([...chosenScams, ...chosenLegits]);

  return {
    featured_family: pattern.family,
    family_label: pattern.family_label,
    family_description: pattern.family_description,
    exemplar: pattern,
    items: sequence.map((p) => ({ pattern_id: p.id, is_scam: p.is_scam })),
    full_patterns: sequence,
    popup_duration_ms: tier.popupDurationMs,
    total_seconds: tier.totalSeconds,
    board_progression: [tier.boardSize],
    base_spawn_delay: tier.baseSpawnDelay,
    spawn_jitter: tier.spawnJitter,
    tier,
  };
}

export type TodayPattern = {
  featured_family: string;
  family_label: string;
  family_description: string;
  difficulty: number;
  exemplar: {
    kind: string;
    content: Record<string, unknown>;
    teaching: string;
  };
};

export async function getTodayPattern(): Promise<TodayPattern> {
  const pattern = await getTodaysPattern();

  return {
    featured_family: pattern.family,
    family_label: pattern.family_label,
    family_description: pattern.family_description,
    difficulty: pattern.difficulty,
    exemplar: {
      kind: pattern.kind,
      content: pattern.content,
      teaching: pattern.teaching,
    },
  };
}

export async function rebuildRoundFromSession(session: {
  id: string;
  featured_family: string;
  items: RoundItem[];
  popup_duration_ms: number;
  total_seconds: number;
  mode: string;
  difficulty: string;
}): Promise<GeneratedRound> {
  const tier = await loadTier((session.difficulty as TierKey) ?? "easy");

  const patternIds = [...new Set(session.items.map((i) => i.pattern_id))];
  const { data: patterns } = await supabaseAdmin
    .from("scam_patterns")
    .select("*")
    .in("id", patternIds);

  if (!patterns) throw new Error("Cannot rebuild session: patterns not found");

  const patternMap = new Map(patterns.map((p) => [p.id, p]));

  const sequence: PatternRow[] = session.items
    .map((item) => patternMap.get(item.pattern_id) as PatternRow | undefined)
    .filter((x): x is PatternRow => Boolean(x));

  const featured = sequence.find((p) => p.is_scam);
  if (!featured) {
    throw new Error(`Cannot rebuild session ${session.id}: no scam items`);
  }

  return {
    featured_family: session.featured_family,
    family_label: featured.family_label,
    family_description: featured.family_description,
    exemplar: featured,
    items: session.items,
    full_patterns: sequence,
    popup_duration_ms: session.popup_duration_ms,
    total_seconds: session.total_seconds,
    board_progression: [tier.boardSize],
    base_spawn_delay: tier.baseSpawnDelay,
    spawn_jitter: tier.spawnJitter,
    tier,
  };
}
