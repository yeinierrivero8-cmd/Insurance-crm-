/**
 * CacheService — 3-layer cache (memory + localStorage + network)
 * TTL: 5min (clients), 10min (renewals), 1h (profile)
 * Auto-expiration on get()
 */

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.ttlConfig = {
      '/clients': 5 * 60 * 1000,      // 5 min
      '/renewals': 10 * 60 * 1000,    // 10 min
      '/policies': 10 * 60 * 1000,    // 10 min
      '/profile': 60 * 60 * 1000,     // 1 hour
    };
    this.prefix = 'cache_';
  }

  /**
   * Get from cache (memory first, then localStorage)
   * Returns null if expired or not found
   */
  get(endpoint) {
    // Check memory cache first
    if (this.memoryCache.has(endpoint)) {
      const entry = this.memoryCache.get(endpoint);
      if (!this._isExpired(entry)) {
        console.log(`[CACHE HIT] ${endpoint}`);
        return entry.data;
      } else {
        // Expired, remove from memory
        this.memoryCache.delete(endpoint);
      }
    }

    // Check localStorage
    const localKey = this.prefix + endpoint;
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const entry = JSON.parse(stored);
        if (!this._isExpired(entry)) {
          // Restore to memory cache for faster next access
          this.memoryCache.set(endpoint, entry);
          console.log(`[CACHE HIT] ${endpoint} (from localStorage)`);
          return entry.data;
        } else {
          // Expired, remove from storage
          localStorage.removeItem(localKey);
        }
      }
    } catch (e) {
      console.warn(`[CACHE] Error reading localStorage for ${endpoint}:`, e);
    }

    console.log(`[CACHE MISS] ${endpoint}`);
    return null;
  }

  /**
   * Set cache with TTL
   */
  set(endpoint, data) {
    const ttl = this.ttlConfig[endpoint] || 5 * 60 * 1000; // Default 5 min
    const entry = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Store in memory
    this.memoryCache.set(endpoint, entry);

    // Store in localStorage
    const localKey = this.prefix + endpoint;
    try {
      localStorage.setItem(localKey, JSON.stringify(entry));
      console.log(`[CACHE SET] ${endpoint} (TTL: ${ttl / 1000}s)`);
    } catch (e) {
      console.warn(`[CACHE] Error writing to localStorage for ${endpoint}:`, e);
    }
  }

  /**
   * Invalidate cache for endpoint (pattern match supported)
   * E.g., invalidate('/clients') removes /clients, /clients?*, etc.
   */
  invalidate(pattern) {
    // Remove from memory
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Remove from localStorage
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.prefix + pattern)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn(`[CACHE] Error invalidating localStorage:`, e);
    }

    console.log(`[CACHE INVALIDATE] ${pattern}`);
  }

  /**
   * Clear all caches
   */
  clear() {
    this.memoryCache.clear();
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn(`[CACHE] Error clearing localStorage:`, e);
    }
    console.log(`[CACHE CLEAR] All caches cleared`);
  }

  /**
   * Check if entry is expired
   */
  _isExpired(entry) {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Get cache stats (for monitoring)
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      memoryKeys: Array.from(this.memoryCache.keys()),
      localStorageSize: Object.keys(localStorage).filter(k => k.startsWith(this.prefix)).length
    };
  }
}

// Singleton instance
export const cacheService = new CacheService();
