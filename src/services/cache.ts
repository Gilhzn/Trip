/** localStorage TTL cache for API responses. App state lives in state/storage.ts. */
const PREFIX = 'trip.cache.';

interface Entry<T> {
  v: T;
  exp: number;
}

export const TTL = {
  forecast: 60 * 60 * 1000, // 1h
  climate: 30 * 24 * 60 * 60 * 1000, // 30d
  rates: 12 * 60 * 60 * 1000, // 12h
  geocoding: 7 * 24 * 60 * 60 * 1000, // 7d
  overpass: 24 * 60 * 60 * 1000, // 24h
} as const;

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (Date.now() > entry.exp) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.v;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  const entry: Entry<T> = { v: value, exp: Date.now() + ttlMs };
  const raw = JSON.stringify(entry);
  try {
    localStorage.setItem(PREFIX + key, raw);
  } catch {
    // Quota exceeded — evict all cache entries and retry once.
    evictAll();
    try {
      localStorage.setItem(PREFIX + key, raw);
    } catch {
      // Still failing (private mode?) — operate without cache.
    }
  }
}

export function evictAll(): void {
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) doomed.push(key);
  }
  doomed.forEach((k) => localStorage.removeItem(k));
}

/** Fetch-through helper: cache hit → value; miss → produce, store, return. */
export async function cached<T>(key: string, ttlMs: number, produce: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await produce();
  cacheSet(key, value, ttlMs);
  return value;
}
