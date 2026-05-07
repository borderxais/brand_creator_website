// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";

// NODE_ENV is typed read-only; cast through unknown to allow test overrides.
const env = process.env as Record<string, string | undefined>;

describe("/api/test/login gate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("rejects when E2E_EXPLORE !== 1", async () => {
    env.E2E_EXPLORE = "0";
    env.NODE_ENV = "development";
    const { GET } = await import("../../src/app/api/test/login/route");
    const req = new Request("http://localhost/api/test/login?role=brand");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("rejects when E2E_EXPLORE is unset", async () => {
    delete env.E2E_EXPLORE;
    env.NODE_ENV = "development";
    const { GET } = await import("../../src/app/api/test/login/route");
    const req = new Request("http://localhost/api/test/login?role=brand");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("returns Set-Cookie when both gates pass and role is valid", async () => {
    env.E2E_EXPLORE = "1";
    env.NODE_ENV = "development";
    env.NEXTAUTH_SECRET = "e2e-nextauth-secret-not-prod";
    const { GET } = await import("../../src/app/api/test/login/route");
    const req = new Request("http://localhost/api/test/login?role=brand");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/next-auth\.session-token=/);
  });

  it("rejects unknown role", async () => {
    env.E2E_EXPLORE = "1";
    env.NODE_ENV = "development";
    const { GET } = await import("../../src/app/api/test/login/route");
    const req = new Request("http://localhost/api/test/login?role=hacker");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
