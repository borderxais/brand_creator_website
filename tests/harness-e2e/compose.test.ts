import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

describe("docker/compose.e2e.yml", () => {
  it("is valid compose syntax", () => {
    expect(() =>
      execSync("docker compose -f docker/compose.e2e.yml config", {
        stdio: "pipe",
      })
    ).not.toThrow();
  });

  it("declares pg, supabase, api, web services", () => {
    const out = execSync("docker compose -f docker/compose.e2e.yml config --services", {
      encoding: "utf8",
    });
    const services = out.trim().split("\n").sort();
    expect(services).toEqual(["api", "pg", "supabase", "web"]);
  });
});
