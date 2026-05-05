import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateToken, generateExpirationDate } from "@/lib/tokens";

describe("generateToken", () => {
  it("returns a hex string of the correct length for the default 32-byte input", () => {
    const token = generateToken();
    // 32 bytes → 64 hex characters
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("returns a hex string of the correct length for a custom byte size", () => {
    const token = generateToken(16);
    // 16 bytes → 32 hex characters
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("returns unique values on successive calls", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe("generateExpirationDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a Date 24 hours in the future by default", () => {
    const expires = generateExpirationDate();
    const expected = new Date("2024-01-02T00:00:00.000Z");
    expect(expires).toEqual(expected);
  });

  it("returns a Date the specified number of hours in the future", () => {
    const expires = generateExpirationDate(1);
    const expected = new Date("2024-01-01T01:00:00.000Z");
    expect(expires).toEqual(expected);
  });
});
