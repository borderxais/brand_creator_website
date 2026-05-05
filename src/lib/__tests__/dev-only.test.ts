import { describe, it, expect, afterEach } from "vitest";
import { assertDevOnly } from "@/lib/dev-only";

describe("assertDevOnly", () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it("does not throw when NODE_ENV is development", () => {
    process.env.NODE_ENV = "development";
    expect(() => assertDevOnly()).not.toThrow();
  });

  it("does not throw when NODE_ENV is test", () => {
    process.env.NODE_ENV = "test";
    expect(() => assertDevOnly()).not.toThrow();
  });

  it("throws when NODE_ENV is production", () => {
    process.env.NODE_ENV = "production";
    expect(() => assertDevOnly()).toThrow(/dev-only/i);
  });
});
