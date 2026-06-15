import { SCAM_ICONS, LEGIT_ICONS, type WhackIcon } from "./whackIcon";

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) + h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function iconsForRound(roundId: string): {
  scam: WhackIcon;
  legit: WhackIcon;
} {
  const h = hashString(roundId);
  return {
    scam: SCAM_ICONS[h % SCAM_ICONS.length],
    legit: LEGIT_ICONS[(h >> 8) % LEGIT_ICONS.length],
  };
}