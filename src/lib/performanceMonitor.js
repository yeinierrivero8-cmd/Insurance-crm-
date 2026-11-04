/**
 * Performance Monitoring Helper
 * Usage:
 *   perfMonitor.mark('clientListFetch');
 *   ... fetch happens ...
 *   perfMonitor.measure('clientListFetch');
 */

export const perfMonitor = {
  /**
   * Mark a timing point (start)
   */
  mark(label) {
    if (!performance.mark) return;
    performance.mark(`${label}-start`);
  },

  /**
   * Measure time between mark() and measure()
   * Logs to console
   */
  measure(label) {
    if (!performance.measure) return;
    try {
      performance.mark(`${label}-end`);
      const entry = performance.measure(label, `${label}-start`, `${label}-end`);
      console.log(`[PERF] ${label}: ${entry.duration.toFixed(2)}ms`);
      return entry.duration;
    } catch (e) {
      console.warn(`[PERF] Could not measure ${label}:`, e.message);
      return null;
    }
  },

  /**
   * Get cache statistics (from cacheService if available)
   */
  getCacheStats() {
    try {
      const { cacheService } = require('./cacheService.js');
      return cacheService.getStats();
    } catch (e) {
      return null;
    }
  },

  /**
   * Log all performance entries
   */
  logAll() {
    if (!performance.getEntriesByType) return;
    const entries = performance.getEntriesByType('measure');
    console.log(`[PERF] Total measurements: ${entries.length}`);
    entries.forEach(e => {
      console.log(`  - ${e.name}: ${e.duration.toFixed(2)}ms`);
    });
  },

  /**
   * Clear all performance entries
   */
  clearAll() {
    if (!performance.clearMarks) return;
    performance.clearMarks();
    performance.clearMeasures();
    console.log('[PERF] All marks and measures cleared');
  }
};
