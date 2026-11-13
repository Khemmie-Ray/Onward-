import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PlayMode } from "@/lib/scoring";
import { loadTier, type DifficultyTier, type TierKey } from "./difficulty";

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

function pickBandPool(
  pool: PatternRow[],
  min: number,
  max: number,
): PatternRow[] {
  let lo = min;
  let hi = max;
  for (;;) {
    const inBand = pool.filter((p) => p.difficulty >= lo && p.difficulty <= hi);
    if (inBand.length > 0) return inBand;
    if (lo <= 1 && hi >= 5) return pool;
    lo = Math.max(1, lo - 1);
    hi = Math.min(5, hi + 1);
  }
}

function todayFeaturedIndex(familyCount: number): number {
  const msPerDay = 86_400_000;
  const today = Math.floor(Date.now() / msPerDay);
  return ((today % familyCount) + familyCount) % familyCount;
}

async function pickFamily(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("scam_patterns")
    .select("family")
    .eq("is_scam", true);

  const families = Array.from(
    new Set((data ?? []).map((r) => r.family)),
  ).sort();
  if (families.length === 0) {
    throw new Error("No scam families found — run seed script");
  }
  return families[todayFeaturedIndex(families.length)];
}

export async function generateRound(
  tier: DifficultyTier,
): Promise<GeneratedRound> {
  const family = await pickFamily();

  const { data: exemplarData } = await supabaseAdmin
    .from("scam_patterns")
    .select("*")
    .eq("family", family)
    .eq("is_exemplar", true)
    .single();

  if (!exemplarData) throw new Error(`No exemplar for family ${family}`);
  const exemplar = exemplarData as PatternRow;

  const numScams = Math.floor(tier.listSize * tier.scamRatio);
  const numLegits = tier.listSize - numScams;

  const { data: scamVariants } = await supabaseAdmin
    .from("scam_patterns")
    .select("*")
    .eq("family", family)
    .eq("is_scam", true)
    .eq("is_exemplar", false);

  const { data: legitPool } = await supabaseAdmin
    .from("scam_patterns")
    .select("*")
    .eq("is_scam", false);

  if (!scamVariants?.length) throw new Error(`No scam variants for ${family}`);
  if (!legitPool?.length) throw new Error("No legit patterns");

  const sampleN = <T>(pool: T[], n: number): T[] => {
    const out: T[] = [];
    for (let i = 0; i < n; i++) {
      out.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return out;
  };

  const scamPool = pickBandPool(
    scamVariants as PatternRow[],
    tier.minPatternDifficulty,
    tier.maxPatternDifficulty,
  );

  const chosenScams = sampleN(scamPool, numScams);
  const chosenLegits = sampleN(legitPool as PatternRow[], numLegits);
  const sequence = [...chosenScams, ...chosenLegits].sort(
    () => Math.random() - 0.5,
  );

  return {
    featured_family: family,
    family_label: exemplar.family_label,
    family_description: exemplar.family_description,
    exemplar,
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
  const family = await pickFamily();

  const { data: exemplarData } = await supabaseAdmin
    .from("scam_patterns")
    .select("*")
    .eq("family", family)
    .eq("is_exemplar", true)
    .single();

  if (!exemplarData) throw new Error(`No exemplar for family ${family}`);
  const ex = exemplarData as PatternRow;

  return {
    featured_family: family,
    family_label: ex.family_label,
    family_description: ex.family_description,
    difficulty: ex.difficulty,
    exemplar: {
      kind: ex.kind,
      content: ex.content,
      teaching: ex.teaching,
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

  const { data: exemplar } = await supabaseAdmin
    .from("scam_patterns")
    .select("*")
    .eq("family", session.featured_family)
    .eq("is_exemplar", true)
    .single();

  if (!exemplar) {
    throw new Error(
      `Cannot rebuild session: exemplar missing for ${session.featured_family}`,
    );
  }

  const patternIds = session.items.map((i) => i.pattern_id);
  const { data: patterns } = await supabaseAdmin
    .from("scam_patterns")
    .select("*")
    .in("id", patternIds);

  if (!patterns) throw new Error("Cannot rebuild session: patterns not found");

  const patternMap = new Map(patterns.map((p) => [p.id, p]));

  const sequence: PatternRow[] = session.items
    .map((item) => patternMap.get(item.pattern_id) as PatternRow | undefined)
    .filter((x): x is PatternRow => Boolean(x));

  return {
    featured_family: session.featured_family,
    family_label: (exemplar as PatternRow).family_label,
    family_description: (exemplar as PatternRow).family_description,
    exemplar: exemplar as PatternRow,
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
