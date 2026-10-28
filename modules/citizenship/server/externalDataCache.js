import { createHash } from "node:crypto";

/** Bounded server-only cache. Private lookup inputs never become readable keys. */
export class ExternalDataCache {
  constructor({ maxEntries = 300 } = {}) {
    this.maxEntries = Math.max(1, maxEntries);
    this.entries = new Map();
    this.pending = new Map();
    this.health = new Map();
  }

  keyFor(provider, input) {
    return createHash("sha256").update(`${provider}:${input}`).digest("hex");
  }

  getProviderHealth() {
    return Object.fromEntries([...this.health].map(([provider, health]) => [provider, { ...health }]));
  }

  markUnavailable(provider) {
    this.health.set(provider, { ...this.health.get(provider), status: "unconfigured", consecutiveFailures: 0 });
  }

  async resolve({ provider, key, load, ttlMs = 86_400_000, now = Date.now(), allowStale = true }) {
    const cacheKey = this.keyFor(provider, key);
    const previous = this.entries.get(cacheKey);
    if (previous && previous.expiresAt > now) {
      this.entries.delete(cacheKey);
      this.entries.set(cacheKey, previous);
      return { ...previous, status: "fresh" };
    }
    if (this.pending.has(cacheKey)) return this.pending.get(cacheKey);
    if (this.pending.size >= this.maxEntries) {
      if (allowStale && previous?.value != null) return { ...previous, status: "stale" };
      throw new Error("The information service is temporarily busy.");
    }
    const request = (async () => {
      try {
        const value = await load();
        const entry = { value, retrievedAt: new Date(now).toISOString(), expiresAt: now + ttlMs };
        this.entries.delete(cacheKey);
        this.entries.set(cacheKey, entry);
        while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value);
        const health = this.health.get(provider);
        this.health.set(provider, { ...health, status: "healthy", lastSuccessAt: entry.retrievedAt, consecutiveFailures: 0 });
        return { ...entry, status: "updated" };
      } catch (error) {
        const health = this.health.get(provider);
        this.health.set(provider, { ...health, status: "unavailable", lastFailureAt: new Date(now).toISOString(), consecutiveFailures: (health?.consecutiveFailures || 0) + 1 });
        if (allowStale && previous?.value != null) return { ...previous, status: "stale" };
        throw error;
      }
    })();
    this.pending.set(cacheKey, request);
    try { return await request; }
    finally { this.pending.delete(cacheKey); }
  }
}

export const externalDataCache = new ExternalDataCache();
