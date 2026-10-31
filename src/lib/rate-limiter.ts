/**
 * OPENLAB PROTOCOL - IN-MEMORY SLIDING-WINDOW RATE LIMITER
 * Protects against API denial-of-service, rapid booking spam, and credential brute-forcing.
 * Zero external Redis/Memcached dependencies - 100% pure software implementation.
 */

interface RateLimitRecord {
  timestamps: number[];
}

class SlidingWindowRateLimiter {
  private storage: Map<string, RateLimitRecord> = new Map();
  private cleanupIntervalMs: number = 60_000;

  constructor() {
    // Periodically prune stale window entries to maintain tight memory footprint
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupStaleRecords(), this.cleanupIntervalMs);
    }
  }

  /**
   * Check if an identifier (IP address, user ID, or composite key) exceeds the limit.
   * @param key Unique client identifier (e.g., "ip:127.0.0.1:bookings" or "user:aarav:reserve")
   * @param maxRequests Maximum allowed requests within the window
   * @param windowMs Time window in milliseconds (default: 60,000ms = 1 minute)
   */
  public check(
    key: string,
    maxRequests: number = 60,
    windowMs: number = 60_000
  ): { allowed: boolean; remaining: number; resetMs: number; total: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = this.storage.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.storage.set(key, record);
    }

    // Filter out timestamps outside the active sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const resetMs = Math.max(0, oldestInWindow + windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetMs,
        total: record.timestamps.length
      };
    }

    // Record this request
    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: maxRequests - record.timestamps.length,
      resetMs: windowMs,
      total: record.timestamps.length
    };
  }

  private cleanupStaleRecords(): void {
    const now = Date.now();
    const maxRetentionMs = 300_000; // 5 minutes max retention
    for (const [key, record] of this.storage.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < maxRetentionMs);
      if (record.timestamps.length === 0) {
        this.storage.delete(key);
      }
    }
  }
}

// Global singleton instance
export const rateLimiter = new SlidingWindowRateLimiter();

