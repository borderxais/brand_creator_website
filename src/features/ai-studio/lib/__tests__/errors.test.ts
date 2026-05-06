import { describe, it, expect } from "vitest";
import { HttpError, isHttpError } from "@/features/ai-studio/lib/errors";

describe("HttpError", () => {
  it("captures status and message", () => {
    const e = new HttpError(402, "quota exhausted");
    expect(e.status).toBe(402);
    expect(e.message).toBe("quota exhausted");
    expect(e.name).toBe("HttpError");
  });

  it("isHttpError narrows the type", () => {
    const e = new HttpError(403, "forbidden");
    expect(isHttpError(e)).toBe(true);
    expect(isHttpError(new Error("plain"))).toBe(false);
    expect(isHttpError(null)).toBe(false);
    expect(isHttpError(undefined)).toBe(false);
  });

  it("preserves an optional details payload", () => {
    const issues = [{ path: ["email"], message: "required" }];
    const e = new HttpError(400, "bad input", issues);
    expect(e.details).toEqual(issues);
  });
});
