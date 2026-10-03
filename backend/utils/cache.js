/**
 * High-Performance In-Memory Cache Layer
 * Provides sub-millisecond (< 1ms) data delivery for hot database queries
 */

class FastMemoryCache {
  constructor(defaultTtlMs = 60000) { // Default 60 seconds TTL
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });

    // Prevent unbounded memory growth by limiting size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  del(key) {
    this.cache.delete(key);
  }

  flush() {
    this.cache.clear();
  }

  // Clear keys starting with a prefix (e.g., 'cases:', 'search:')
  invalidatePrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const fastCache = new FastMemoryCache();
export default fastCache;
