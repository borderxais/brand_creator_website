import { describe, it, expect } from "vitest";
import { newRunId } from "../../scripts/e2e/lib/runId";

describe("newRunId", () => {
  it("returns 13-digit epoch ms string", () => {
    const id = newRunId();
    expect(id).toMatch(/^\d{13}$/);
  });

  it("returns monotonically increasing values across two calls", async () => {
    const a = newRunId();
    await new Promise((r) => setTimeout(r, 2));
    const b = newRunId();
    expect(Number(b)).toBeGreaterThan(Number(a));
  });
});
