/**
 * Persists specific react-query cache keys to localStorage
 * so dropdown data remains available when offline.
 */

const CACHE_PREFIX = 'rq_cache_';

// Keys that should be persisted for offline use
const PERSISTED_KEYS = [
  'credit_contracts',
  'collectors',
  'sales_agents',
];

export function shouldPersist(queryKey: unknown[]): boolean {
  const key = queryKey[0] as string;
  return PERSISTED_KEYS.includes(key);
}

export function getCacheKey(queryKey: unknown[]): string {
  return CACHE_PREFIX + JSON.stringify(queryKey);
}

export function saveToCache(queryKey: unknown[], data: unknown): void {
  try {
    const key = getCacheKey(queryKey);
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function loadFromCache<T>(queryKey: unknown[]): T | undefined {
  try {
    const key = getCacheKey(queryKey);
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed.data as T;
  } catch {
    return undefined;
  }
}
