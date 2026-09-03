import { supabaseAdmin } from "@/lib/supabase/admin";
import type { WhackIcon } from "./whackIcon";
import { iconById } from "./whackIcon";
import type { PlayMode } from "@/lib/scoring";

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
  icon_id: string | null;
};

export type PatternWithIcon = PatternRow & {
  icon: WhackIcon;
};

export type GeneratedRound = {
  featured_family: string;
  family_label: string;
  family_description: string;
  exemplar: PatternRow;
  exemplar_icon: WhackIcon;
  items: RoundItem[];
  full_patterns: PatternWithIcon[];
  popup_duration_ms: number;
  total_seconds: number;
  board_progression: number[];
  base_spawn_delay: number;
  spawn_jitter: number;
};

export { type PlayMode };

const PACING = {
  totalSeconds: 60,
  popupDurationMs: 1550,
  baseSpawnDelay: 450,
  spawnJitter: 300,
  boardProgression: [6],
  listSize: 100, 
  scamRatio: 0.4,
} as const;

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

  // Stable, sorted, de-duplicated family list so the date index is consistent.
  const families = Array.from(
    new Set((data ?? []).map((r) => r.family)),
  ).sort();
  if (families.length === 0) {
    throw new Error("No scam families found — run seed script");
  }
  return families[todayFeaturedIndex(families.length)];
}

export async function generateRound(
  _mode: PlayMode,
  _userLevel: number,
  previewId: string,
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

  const numScams = Math.floor(PACING.listSize * PACING.scamRatio);
  const numLegits = PACING.listSize - numScams;

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

  const chosenScams = sampleN(scamVariants as PatternRow[], numScams);
  const chosenLegits = sampleN(legitPool as PatternRow[], numLegits);
  const sequence = [...chosenScams, ...chosenLegits].sort(
    () => Math.random() - 0.5,
  );

  const sequenceWithIcons: PatternWithIcon[] = sequence.map((p) => ({
    ...p,
    icon: iconById(p.icon_id, p.is_scam),
  }));

  return {
    featured_family: family,
    family_label: exemplar.family_label,
    family_description: exemplar.family_description,
    exemplar,
    exemplar_icon: iconById((exemplar as PatternRow).icon_id, true),
    items: sequence.map((p) => ({ pattern_id: p.id, is_scam: p.is_scam })),
    full_patterns: sequenceWithIcons,
    popup_duration_ms: PACING.popupDurationMs,
    total_seconds: PACING.totalSeconds,
    board_progression: [...PACING.boardProgression],
    base_spawn_delay: PACING.baseSpawnDelay,
    spawn_jitter: PACING.spawnJitter,
  };
}

export async function rebuildRoundFromSession(session: {
  id: string;
  featured_family: string;
  items: RoundItem[];
  popup_duration_ms: number;
  total_seconds: number;
  mode: string;
}): Promise<GeneratedRound> {
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

  const sequence: PatternWithIcon[] = session.items
    .map((item) => {
      const p = patternMap.get(item.pattern_id);
      if (!p) return null;
      const row = p as PatternRow;
      return {
        ...row,
        icon: iconById(row.icon_id, row.is_scam),
      };
    })
    .filter((x): x is PatternWithIcon => x !== null);

  return {
    featured_family: session.featured_family,
    family_label: (exemplar as PatternRow).family_label,
    family_description: (exemplar as PatternRow).family_description,
    exemplar: exemplar as PatternRow,
    exemplar_icon: iconById((exemplar as PatternRow).icon_id, true),
    items: session.items,
    full_patterns: sequence,
    popup_duration_ms: session.popup_duration_ms,
    total_seconds: session.total_seconds,
    board_progression: [...PACING.boardProgression],
    base_spawn_delay: PACING.baseSpawnDelay,
    spawn_jitter: PACING.spawnJitter,
  };
}
