
const TTL_MS = 60 * 1000; 

type Entry = { at: number; payload: unknown };

const cache = new Map<string, Entry>();

const key = (wallet: string) => wallet.toLowerCase();

export function getCachedBadges(wallet: string): unknown | null {
  const hit = cache.get(key(wallet));
  if (!hit) return null;
  if (Date.now() - hit.at >= TTL_MS) {
    cache.delete(key(wallet));
    return null;
  }
  return hit.payload;
}

export function setCachedBadges(wallet: string, payload: unknown): void {
  cache.set(key(wallet), { at: Date.now(), payload });
}

export function invalidateBadges(wallet: string): void {
  cache.delete(key(wallet));
}
