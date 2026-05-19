interface Entry<T> { value: T; expiresAt: number }

class SimpleCache {
  private store = new Map<string, Entry<unknown>>();

  set<T>(key: string, value: T, ttlMs = 30_000): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
  get<T>(key: string): T | null {
    const e = this.store.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) { this.store.delete(key); return null; }
    return e.value as T;
  }
  invalidate(key: string): void  { this.store.delete(key); }
  clear():            void  { this.store.clear(); }
}

export const apiCache = new SimpleCache();
