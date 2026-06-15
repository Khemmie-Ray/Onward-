import { supabaseAdmin } from "@/lib/supabase/admin";
import type { WhackIcon } from "./whackIcon";
import { iconsForRound } from "./patternIcons";
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

function tierConfig(mode: PlayMode, level: number) {
  if (mode === "premium") {
    return {
      totalItems: 60,
      scamRatio: 0.55,
      popupDurationMs: 1500,
      baseSpawnDelay: 300,
      spawnJitter: 200,
      boardProgression: [6],
    };
  }
  if (level < 20) {
    return {
      totalItems: 50,
      scamRatio: 0.6,
      popupDurationMs: 2000,
      baseSpawnDelay: 400,
      spawnJitter: 250,
      boardProgression: [6],
    };
  }
  if (level < 60) {
    return {
      totalItems: 55,
      scamRatio: 0.55,
      popupDurationMs: 1800,
      baseSpawnDelay: 350,
      spawnJitter: 220,
      boardProgression: [6],
    };
  }
  return {
    totalItems: 60,
    scamRatio: 0.5,
    popupDurationMs: 1700,
    baseSpawnDelay: 320,
    spawnJitter: 200,
    boardProgression: [6],
  };
}

async function pickFamily(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("scam_patterns")
    .select("family")
    .eq("is_scam", true);

  const families = Array.from(new Set((data ?? []).map((r) => r.family)));
  if (families.length === 0) {
    throw new Error("No scam families found — run seed script");
  }
  return families[Math.floor(Math.random() * families.length)];
}

/**
 * Generates a fresh round. The previewId argument is used to derive
 * the per-round icon pair deterministically.
 */
export async function generateRound(
  mode: PlayMode,
  userLevel: number,
  previewId: string,
): Promise<GeneratedRound> {
  const config = tierConfig(mode, userLevel);
  const family = await pickFamily();

  const { data: exemplarData } = await supabaseAdmin
    .from("scam_patterns")
    .select("*")
    .eq("family", family)
    .eq("is_exemplar", true)
    .single();

  if (!exemplarData) throw new Error(`No exemplar for family ${family}`);
  const exemplar = exemplarData as PatternRow;

  const numScams = Math.floor(config.totalItems * config.scamRatio);
  const numLegits = config.totalItems - numScams;

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

  const roundIcons = iconsForRound(previewId);
  const sequenceWithIcons: PatternWithIcon[] = sequence.map((p) => ({
    ...p,
    icon: p.is_scam ? roundIcons.scam : roundIcons.legit,
  }));

  return {
    featured_family: family,
    family_label: exemplar.family_label,
    family_description: exemplar.family_description,
    exemplar,
    exemplar_icon: roundIcons.scam,
    items: sequence.map((p) => ({ pattern_id: p.id, is_scam: p.is_scam })),
    full_patterns: sequenceWithIcons,
    popup_duration_ms: config.popupDurationMs,
    total_seconds: 60,
    board_progression: config.boardProgression,
    base_spawn_delay: config.baseSpawnDelay,
    spawn_jitter: config.spawnJitter,
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
  const roundIcons = iconsForRound(session.id);

  const sequence: PatternWithIcon[] = session.items
    .map((item) => {
      const p = patternMap.get(item.pattern_id);
      if (!p) return null;
      const row = p as PatternRow;
      return {
        ...row,
        icon: row.is_scam ? roundIcons.scam : roundIcons.legit,
      };
    })
    .filter((x): x is PatternWithIcon => x !== null);

  const config =
    session.mode === "premium"
      ? { boardProgression: [6], baseSpawnDelay: 300, spawnJitter: 200 }
      : { boardProgression: [6], baseSpawnDelay: 400, spawnJitter: 250 };

  return {
    featured_family: session.featured_family,
    family_label: (exemplar as PatternRow).family_label,
    family_description: (exemplar as PatternRow).family_description,
    exemplar: exemplar as PatternRow,
    exemplar_icon: roundIcons.scam,
    items: session.items,
    full_patterns: sequence,
    popup_duration_ms: session.popup_duration_ms,
    total_seconds: session.total_seconds,
    board_progression: config.boardProgression,
    base_spawn_delay: config.baseSpawnDelay,
    spawn_jitter: config.spawnJitter,
  };
}
