import { describe, it, expect } from "vitest";
import { buildSummary } from "../../scripts/e2e/lib/summary";

const passingReport = {
  stats: { expected: 1, unexpected: 0, flaky: 0, skipped: 0, duration: 100 },
  suites: [
    {
      title: "e2e/foo.spec.ts",
      specs: [
        {
          title: "passes",
          tests: [{ results: [{ status: "passed", error: null, attachments: [] }] }],
        },
      ],
    },
  ],
};

const failingReport = {
  stats: { expected: 1, unexpected: 1, flaky: 0, skipped: 0, duration: 200 },
  suites: [
    {
      title: "e2e/bar.spec.ts",
      specs: [
        {
          title: "creates campaign",
          tests: [
            {
              results: [
                {
                  status: "failed",
                  error: { message: "Timeout 5000ms waiting for selector [data-testid=submit]" },
                  attachments: [{ name: "trace", path: "/tmp/trace.zip" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("buildSummary", () => {
  it("renders ALL PASS when no failures", () => {
    const md = buildSummary(passingReport as any, "abc");
    expect(md).toMatch(/ALL PASS/);
    expect(md).toMatch(/1 passed/);
  });

  it("renders FAIL block per failing test with error and trace path", () => {
    const md = buildSummary(failingReport as any, "abc");
    expect(md).toMatch(/FAIL e2e\/bar\.spec\.ts › creates campaign/);
    expect(md).toMatch(/Timeout 5000ms/);
    expect(md).toMatch(/\/tmp\/trace\.zip/);
  });
});
