import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PatternRow } from "./roundGenerator";

const ROTATION_START_DAY = "2026-11-25";

const MS_PER_DAY = 86_400_000;

export function rotationDayIndex(now: Date = new Date()): number {
  const start = Date.parse(`${ROTATION_START_DAY}T00:00:00.000Z`);
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.floor((today - start) / MS_PER_DAY);
}

/** The full rotation in order, built from the scam patterns that exist now. */
export function buildRotation(patterns: PatternRow[]): PatternRow[] {
  // Map keeps insertion order, so families stay in the order they first appear.
  const byFamily = new Map<string, PatternRow[]>();
  for (const p of patterns) {
    const list = byFamily.get(p.family);
    if (list) list.push(p);
    else byFamily.set(p.family, [p]);
  }

  const families = [...byFamily.values()];
  const longest = Math.max(0, ...families.map((f) => f.length));

  const rotation: PatternRow[] = [];
  for (let round = 0; round < longest; round++) {
    for (const family of families) {
      if (round < family.length) rotation.push(family[round]);
    }
  }
  return rotation;
}

export async function getTodaysPattern(
  now: Date = new Date(),
): Promise<PatternRow> {
  const { data, error } = await supabaseAdmin
    .from("scam_patterns")
    .select("*")
    .eq("is_scam", true)
    .order("seq", { ascending: true });

  if (error) throw new Error(`scam patterns load failed: ${error.message}`);

  const rotation = buildRotation((data ?? []) as PatternRow[]);
  if (rotation.length === 0) {
    throw new Error("No scam patterns found. Run the seed script.");
  }

  const day = rotationDayIndex(now);
  const index = ((day % rotation.length) + rotation.length) % rotation.length;
  return rotation[index];
}
