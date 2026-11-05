/**
 * Performance Monitoring Service — Enhanced
 * Tracks: API response times, component render times, Core Web Vitals
 * Usage:
 *   perfMonitor.mark('clientListFetch');
 *   ... fetch happens ...
 *   perfMonitor.measure('clientListFetch');
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.apiMetrics = [];
    this.enabled = true;
  }

  /**
   * Mark a timing point (start)
   */
  mark(label) {
    if (!performance.mark || !this.enabled) return;
    performance.mark(`${label}-start`);
  }

  /**
   * Measure time between mark() and measure()
   * Logs to console and stores in metrics array
   */
  measure(label) {
    if (!performance.measure || !this.enabled) return;
    try {
      performance.mark(`${label}-end`);
      const entry = performance.measure(label, `${label}-start`, `${label}-end`);
      const duration = entry.duration;

      this.metrics.push({
        label,
        duration,
        timestamp: Date.now()
      });

      // Log slow operations (> 1s)
      if (duration > 1000) {
        console.warn(`[PERF] Slow operation: ${label}: ${duration.toFixed(2)}ms`);
      } else {
        console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
      }

      return duration;
    } catch (e) {
      console.warn(`[PERF] Could not measure ${label}:`, e.message);
      return null;
    }
  }

  /**
   * Track API call timing
   */
  trackApiCall(endpoint, duration, statusCode = 200) {
    if (!this.enabled) return;

    const metric = {
      endpoint,
      duration,
      statusCode,
      timestamp: Date.now()
    };

    this.apiMetrics.push(metric);

    // Keep only last 50 API metrics
    if (this.apiMetrics.length > 50) {
      this.apiMetrics.shift();
    }

    // Log slow API calls (> 2s)
    if (duration > 2000) {
      console.warn(`[PERF] Slow API: ${endpoint} (${statusCode}) took ${duration.toFixed(0)}ms`);
    }

    return metric;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const avgDuration = this.metrics.length > 0
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length
      : 0;

    const slowOps = this.metrics.filter(m => m.duration > 1000).length;
    const avgApiTime = this.apiMetrics.length > 0
      ? this.apiMetrics.reduce((sum, m) => sum + m.duration, 0) / this.apiMetrics.length
      : 0;

    const failedApis = this.apiMetrics.filter(m => m.statusCode >= 400).length;

    return {
      totalMeasurements: this.metrics.length,
      averageDuration: Math.round(avgDuration),
      slowOperations: slowOps,
      apiCalls: {
        total: this.apiMetrics.length,
        averageDuration: Math.round(avgApiTime),
        failedCalls: failedApis,
        healthScore: failedApis === 0 ? 100 : Math.max(0, 100 - failedApis * 5)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get Core Web Vitals (CWV) estimate
   */
  getCoreWebVitals() {
    // Note: This is a simplified estimate; use real Web Vitals library for production
    const avgApiTime = this.apiMetrics.length > 0
      ? this.apiMetrics.reduce((sum, m) => sum + m.duration, 0) / this.apiMetrics.length
      : 0;

    // Estimate LCP (Largest Contentful Paint) - approximated from API times
    const lcp = Math.min(3000, avgApiTime + 500); // ms

    // Estimate FID (First Input Delay) - assume good (< 100ms)
    const fid = 50; // ms

    // Estimate CLS (Cumulative Layout Shift) - assume good (< 0.1)
    const cls = 0.05;

    return {
      lcp: { value: lcp, rating: lcp < 2500 ? 'good' : lcp < 4000 ? 'needsImprovement' : 'poor' },
      fid: { value: fid, rating: fid < 100 ? 'good' : fid < 300 ? 'needsImprovement' : 'poor' },
      cls: { value: cls.toFixed(2), rating: cls < 0.1 ? 'good' : cls < 0.25 ? 'needsImprovement' : 'poor' },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get Lighthouse-like performance score
   */
  getLighthouseScore() {
    const avgApiTime = this.apiMetrics.length > 0
      ? this.apiMetrics.reduce((sum, m) => sum + m.duration, 0) / this.apiMetrics.length
      : 0;

    const failureRate = this.apiMetrics.length > 0
      ? this.apiMetrics.filter(m => m.statusCode >= 400).length / this.apiMetrics.length
      : 0;

    let score = 100;

    // Deduct for slow APIs
    if (avgApiTime > 1000) score -= 15;
    if (avgApiTime > 2000) score -= 15;
    if (avgApiTime > 3000) score -= 20;

    // Deduct for failures
    score -= failureRate * 30;

    return Math.max(0, Math.round(score));
  }

  /**
   * Log all performance metrics
   */
  logAll() {
    console.log('[PERF] === Performance Report ===');
    console.log(this.getSummary());
    console.log('[PERF] === Core Web Vitals ===');
    console.log(this.getCoreWebVitals());
    console.log(`[PERF] Lighthouse Score: ${this.getLighthouseScore()}/100`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    try {
      const { cacheService } = require('./cacheService.js');
      return cacheService.getStats?.();
    } catch (e) {
      return null;
    }
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      metrics: this.metrics,
      apiMetrics: this.apiMetrics,
      summary: this.getSummary(),
      cwv: this.getCoreWebVitals(),
      lighthouseScore: this.getLighthouseScore(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear all metrics
   */
  clearAll() {
    if (performance.clearMarks) performance.clearMarks();
    if (performance.clearMeasures) performance.clearMeasures();
    this.metrics = [];
    this.apiMetrics = [];
    console.log('[PERF] All marks, measures, and metrics cleared');
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[PERF] Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export const perfMonitor = new PerformanceMonitor();
