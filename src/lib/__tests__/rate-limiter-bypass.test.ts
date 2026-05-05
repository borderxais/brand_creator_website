import { describe, it, expect, afterEach } from "vitest";

describe("rate-limiter E2E bypass", () => {
  const original = process.env.E2E_BYPASS_RATELIMIT;
  afterEach(() => {
    (process.env as Record<string, string | undefined>).E2E_BYPASS_RATELIMIT = original;
  });

  it("isRateLimited returns false unconditionally when E2E_BYPASS_RATELIMIT=1", async () => {
    (process.env as Record<string, string | undefined>).E2E_BYPASS_RATELIMIT = "1";
    const mod = await import("@/lib/rate-limiter");
    const limiter = new mod.RateLimiter(60_000, 1);
    expect(limiter.isRateLimited("k1")).toBe(false);
    expect(limiter.isRateLimited("k1")).toBe(false);
    expect(limiter.isRateLimited("k1")).toBe(false);
  });
});
