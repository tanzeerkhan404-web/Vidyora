export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
  windowMinutes: number;
  dailyLimit: number;
  dailyRemaining: number;
  limitReason?: 'burst' | 'daily';
}

/**
 * Dual-window rate limiter protecting free-tier Gemini API usage:
 * 1. Short sliding window (burst protection, e.g. 15 requests / 15 min)
 * 2. Daily rolling 24-hour quota (e.g. 40 requests / day per client)
 * Pure and deterministic with injectable clock for unit testing.
 */
export class SlidingWindowRateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly maxDailyRequests: number;
  private readonly dayMs = 24 * 60 * 60 * 1000;
  private readonly buckets: Map<string, number[]> = new Map();

  constructor(maxRequests = 15, windowMinutes = 15, maxDailyRequests = 40) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
    this.maxDailyRequests = maxDailyRequests;
  }

  private pruneDaily(key: string, now: number): number[] {
    const dayCutoff = now - this.dayMs;
    const timestamps = this.buckets.get(key) ?? [];
    const activeDay = timestamps.filter((ts) => ts > dayCutoff);
    if (activeDay.length === 0) {
      this.buckets.delete(key);
    } else {
      this.buckets.set(key, activeDay);
    }
    return activeDay;
  }

  peek(key: string, now = Date.now()): RateLimitResult {
    const activeDay = this.pruneDaily(key, now);
    const burstCutoff = now - this.windowMs;
    const activeBurst = activeDay.filter((ts) => ts > burstCutoff);

    const remaining = Math.max(0, this.maxRequests - activeBurst.length);
    const dailyRemaining = Math.max(0, this.maxDailyRequests - activeDay.length);

    let retryAfterSeconds = 0;
    let limitReason: 'burst' | 'daily' | undefined;

    if (dailyRemaining === 0 && activeDay[0] !== undefined) {
      retryAfterSeconds = Math.max(1, Math.ceil((activeDay[0] + this.dayMs - now) / 1000));
      limitReason = 'daily';
    } else if (remaining === 0 && activeBurst[0] !== undefined) {
      retryAfterSeconds = Math.max(
        1,
        Math.ceil((activeBurst[0] + this.windowMs - now) / 1000)
      );
      limitReason = 'burst';
    }

    return {
      allowed: remaining > 0 && dailyRemaining > 0,
      remaining,
      retryAfterSeconds,
      limit: this.maxRequests,
      windowMinutes: Math.round(this.windowMs / 60000),
      dailyLimit: this.maxDailyRequests,
      dailyRemaining,
      limitReason,
    };
  }

  consume(key: string, now = Date.now()): RateLimitResult {
    const status = this.peek(key, now);
    if (!status.allowed) {
      return status;
    }

    const activeDay = this.pruneDaily(key, now);
    const updated = [...activeDay, now];
    this.buckets.set(key, updated);

    const burstCutoff = now - this.windowMs;
    const updatedBurst = updated.filter((ts) => ts > burstCutoff);

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - updatedBurst.length),
      retryAfterSeconds: 0,
      limit: this.maxRequests,
      windowMinutes: Math.round(this.windowMs / 60000),
      dailyLimit: this.maxDailyRequests,
      dailyRemaining: Math.max(0, this.maxDailyRequests - updated.length),
    };
  }
}
