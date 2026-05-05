// @vitest-environment node
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { POST } from "@/app/api/dev/login/route";
import { prisma } from "@/lib/prisma";

const fakeReq = (body: unknown) =>
  new Request("http://localhost/api/dev/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/dev/login", () => {
  const original = process.env.NODE_ENV;
  const originalSecret = process.env.NEXTAUTH_SECRET;
  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = original;
    (process.env as Record<string, string | undefined>).NEXTAUTH_SECRET = originalSecret;
    vi.clearAllMocks();
  });

  it("returns 404 in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const res = await POST(fakeReq({ email: "x@y.z" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when email missing", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const res = await POST(fakeReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when user not found", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    (process.env as Record<string, string | undefined>).NEXTAUTH_SECRET = "test-secret";
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await POST(fakeReq({ email: "ghost@test.local" }));
    expect(res.status).toBe(404);
  });

  it("issues session cookie when user found", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    (process.env as Record<string, string | undefined>).NEXTAUTH_SECRET = "test-secret";
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "user-1",
      email: "creator-free@test.local",
      name: "Free",
      role: "CREATOR",
      image: null,
    });
    const res = await POST(fakeReq({ email: "creator-free@test.local" }));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/next-auth\.session-token=/);
  });
});
