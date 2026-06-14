import { SCAM_ICONS, LEGIT_ICONS, type WhackIcon } from "./whackIcon";

/**
 * Deterministic mapping from pattern_id → icon.
 *
 * The same pattern always shows the same icon (so users learn to
 * recognize specific scams visually), but different patterns within
 * a family get different icons (so the game doesn't feel monotonous).
 *
 * Path B: This lives in code for now. The follow-up sprint moves this
 * to a per-pattern `icon_id` column on `scam_patterns`. The function
 * signature stays the same — only the data source changes.
 */

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) + h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function iconForPattern(
  patternId: string,
  isScam: boolean
): WhackIcon {
  const pool = isScam ? SCAM_ICONS : LEGIT_ICONS;
  const idx = hashString(patternId) % pool.length;
  return pool[idx];
}