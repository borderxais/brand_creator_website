interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Simple in-memory rate limiter
class RateLimiter {
  private cache: Map<string, RateLimitEntry>;
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60 * 60 * 1000, maxRequests: number = 5) {
    this.cache = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  // Check if a key is rate limited
  isRateLimited(key: string): boolean {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.cache.set(key, { count: 1, resetAt: now + this.windowMs });
      return false;
    }

    // If the window has expired, reset the counter
    if (now > entry.resetAt) {
      this.cache.set(key, { count: 1, resetAt: now + this.windowMs });
      return false;
    }

    // Increment the counter
    entry.count += 1;
    this.cache.set(key, entry);

    // Check if the rate limit is exceeded
    return entry.count > this.maxRequests;
  }

  // Get remaining time in seconds before the rate limit resets
  getRemainingTime(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return 0;
    
    const now = Date.now();
    return Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.resetAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instances for different operations
export const emailVerificationLimiter = new RateLimiter(60 * 60 * 1000, 5); // 5 requests per hour
export const loginAttemptsLimiter = new RateLimiter(15 * 60 * 1000, 10); // 10 attempts per 15 minutes
