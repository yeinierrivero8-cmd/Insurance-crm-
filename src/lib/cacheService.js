/**
 * CacheService — 4-layer cache (memory + IndexedDB + localStorage + network)
 * TTL: 5min (clients), 10min (renewals), 1h (profile)
 * Auto-expiration on get()
 * IndexedDB for large datasets, localStorage for quick access
 */

const DB_NAME = 'InsuraFlow-Cache';
const DB_VERSION = 1;
const STORE_NAME = 'api-responses';

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.db = null;
    this.ttlConfig = {
      '/clients': 5 * 60 * 1000,      // 5 min
      '/renewals': 10 * 60 * 1000,    // 10 min
      '/policies': 10 * 60 * 1000,    // 10 min
      '/profile': 60 * 60 * 1000,     // 1 hour
    };
    this.prefix = 'cache_';
    this._initIndexedDB();
  }

  /**
   * Initialize IndexedDB asynchronously
   */
  _initIndexedDB() {
    if (!('indexedDB' in window)) {
      console.warn('[CACHE] IndexedDB not available');
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => console.warn('[CACHE] IndexedDB open failed');
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      request.onsuccess = () => {
        this.db = request.target.result;
        console.log('[CACHE] IndexedDB initialized');
      };
    } catch (e) {
      console.warn('[CACHE] IndexedDB initialization error:', e);
    }
  }

  /**
   * Set cache in IndexedDB (async, non-blocking)
   */
  _setIndexedDB(key, entry) {
    if (!this.db) return;
    try {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put({ key, ...entry });
    } catch (e) {
      console.warn('[CACHE] IndexedDB write error:', e);
    }
  }

  /**
   * Get from IndexedDB (sync-ish via Promise)
   */
  async _getIndexedDB(key) {
    if (!this.db) return null;
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => {
          const entry = request.result;
          if (entry && !this._isExpired(entry)) {
            resolve(entry);
          } else if (entry) {
            // Clean up expired entry
            this._deleteIndexedDB(key);
            resolve(null);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  /**
   * Delete from IndexedDB
   */
  _deleteIndexedDB(key) {
    if (!this.db) return;
    try {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(key);
    } catch (e) {
      console.warn('[CACHE] IndexedDB delete error:', e);
    }
  }

  /**
   * Get from cache (memory → IndexedDB → localStorage → miss)
   * Returns null if expired or not found
   */
  get(endpoint) {
    // Check memory cache first
    if (this.memoryCache.has(endpoint)) {
      const entry = this.memoryCache.get(endpoint);
      if (!this._isExpired(entry)) {
        console.log(`[CACHE HIT] ${endpoint} (memory)`);
        return entry.data;
      } else {
        // Expired, remove from memory
        this.memoryCache.delete(endpoint);
      }
    }

    // Check localStorage (synchronous)
    const localKey = this.prefix + endpoint;
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        const entry = JSON.parse(stored);
        if (!this._isExpired(entry)) {
          // Restore to memory cache for faster next access
          this.memoryCache.set(endpoint, entry);
          console.log(`[CACHE HIT] ${endpoint} (localStorage)`);
          return entry.data;
        } else {
          // Expired, remove from storage
          localStorage.removeItem(localKey);
          this._deleteIndexedDB(localKey);
        }
      }
    } catch (e) {
      console.warn(`[CACHE] Error reading localStorage for ${endpoint}:`, e);
    }

    console.log(`[CACHE MISS] ${endpoint}`);
    return null;
  }

  /**
   * Get from cache async (with IndexedDB fallback for large datasets)
   */
  async getAsync(endpoint) {
    // Check memory first
    if (this.memoryCache.has(endpoint)) {
      const entry = this.memoryCache.get(endpoint);
      if (!this._isExpired(entry)) {
        console.log(`[CACHE HIT] ${endpoint} (memory)`);
        return entry.data;
      }
    }

    // Check IndexedDB for large datasets
    const localKey = this.prefix + endpoint;
    const idbEntry = await this._getIndexedDB(localKey);
    if (idbEntry && !this._isExpired(idbEntry)) {
      console.log(`[CACHE HIT] ${endpoint} (IndexedDB)`);
      return idbEntry.data;
    }

    // Fallback to localStorage
    const entry = this.get(endpoint);
    return entry;
  }

  /**
   * Set cache with TTL (stores in memory, localStorage, and IndexedDB)
   */
  set(endpoint, data) {
    const ttl = this.ttlConfig[endpoint] || 5 * 60 * 1000; // Default 5 min
    const entry = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Store in memory (always)
    this.memoryCache.set(endpoint, entry);

    // Store in localStorage (for quick browser reload)
    const localKey = this.prefix + endpoint;
    try {
      localStorage.setItem(localKey, JSON.stringify(entry));
      console.log(`[CACHE SET] ${endpoint} (TTL: ${ttl / 1000}s, memory+localStorage)`);
    } catch (e) {
      console.warn(`[CACHE] Error writing to localStorage for ${endpoint}:`, e);
    }

    // Store in IndexedDB (async, for large datasets)
    if (data && typeof data === 'object' && JSON.stringify(data).length > 10000) {
      this._setIndexedDB(localKey, entry);
      console.log(`[CACHE SET] ${endpoint} also cached in IndexedDB`);
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

    // Remove from localStorage and IndexedDB
    const localKey = this.prefix + pattern;
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(localKey)) {
          localStorage.removeItem(key);
          this._deleteIndexedDB(key);
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
