// @vitest-environment node
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { upsert: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { POST } from "@/app/api/dev/subscription/route";
import { prisma } from "@/lib/prisma";

const fakeReq = (body: unknown) =>
  new Request("http://localhost/api/dev/subscription", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/dev/subscription", () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = original;
    vi.clearAllMocks();
  });

  it("returns 404 in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const res = await POST(fakeReq({ email: "x@test.local", tier: "PRO" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 on invalid tier", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const res = await POST(fakeReq({ email: "x@test.local", tier: "PLATINUM" }));
    expect(res.status).toBe(400);
  });

  it("upserts subscription with provided tier and quota", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", email: "x@test.local" });
    (prisma.subscription.upsert as any).mockResolvedValue({
      id: "sub-1",
      userId: "u1",
      tier: "PRO",
      quotaLimit: 20,
      quotaUsed: 3,
    });
    const res = await POST(fakeReq({ email: "x@test.local", tier: "PRO", quotaUsed: 3 }));
    expect(res.status).toBe(200);
    expect((prisma.subscription.upsert as any).mock.calls[0][0].where).toEqual({
      userId: "u1",
    });
  });
});
