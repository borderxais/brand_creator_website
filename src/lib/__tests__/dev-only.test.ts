import { describe, it, expect, afterEach } from "vitest";
import { assertDevOnly } from "@/lib/dev-only";

describe("assertDevOnly", () => {
  const original = (process.env as Record<string, string | undefined>).NODE_ENV;
  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = original;
  });

  it("does not throw when NODE_ENV is development", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    expect(() => assertDevOnly()).not.toThrow();
  });

  it("does not throw when NODE_ENV is test", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    expect(() => assertDevOnly()).not.toThrow();
  });

  it("throws when NODE_ENV is production", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    expect(() => assertDevOnly()).toThrow(/dev-only/i);
  });
});
