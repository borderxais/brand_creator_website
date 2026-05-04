import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { emailVerificationLimiter, loginAttemptsLimiter } from "@/lib/rate-limiter";

// Each test uses a unique key so singleton state does not bleed between tests.
let keyCounter = 0;
function uniqueKey(prefix: string): string {
  return `${prefix}-${++keyCounter}`;
}

describe("emailVerificationLimiter (5 requests per hour)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request for a new key", () => {
    expect(emailVerificationLimiter.isRateLimited(uniqueKey("evl"))).toBe(false);
  });

  it("blocks after exceeding the 5-request limit", () => {
    const key = uniqueKey("evl-exceed");
    // Requests 1-5: allowed
    for (let i = 0; i < 5; i++) {
      expect(emailVerificationLimiter.isRateLimited(key)).toBe(false);
    }
    // Request 6: blocked
    expect(emailVerificationLimiter.isRateLimited(key)).toBe(true);
  });

  it("resets the counter after the window expires", () => {
    const key = uniqueKey("evl-reset");
    // Exhaust the limit
    for (let i = 0; i < 6; i++) {
      emailVerificationLimiter.isRateLimited(key);
    }
    // Advance time past the 1-hour window
    vi.advanceTimersByTime(60 * 60 * 1000 + 1);
    // Counter resets — first request in the new window is allowed
    expect(emailVerificationLimiter.isRateLimited(key)).toBe(false);
  });
});

describe("loginAttemptsLimiter (10 requests per 15 minutes)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports zero remaining time for an unknown key", () => {
    expect(loginAttemptsLimiter.getRemainingTime(uniqueKey("lal-unknown"))).toBe(0);
  });

  it("returns a positive remaining time after the first request", () => {
    const key = uniqueKey("lal-time");
    loginAttemptsLimiter.isRateLimited(key);
    // The window is 15 minutes; remaining time must be > 0 immediately after first call
    expect(loginAttemptsLimiter.getRemainingTime(key)).toBeGreaterThan(0);
  });
});
