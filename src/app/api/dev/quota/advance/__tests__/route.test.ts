// @vitest-environment node
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    subscription: { update: vi.fn() },
  },
}));

import { POST } from "@/app/api/dev/quota/advance/route";
import { prisma } from "@/lib/prisma";

const fakeReq = (body: unknown) =>
  new Request("http://localhost/api/dev/quota/advance", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/dev/quota/advance", () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = original;
    vi.clearAllMocks();
  });

  it("returns 404 in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const res = await POST(fakeReq({ email: "x@test.local" }));
    expect(res.status).toBe(404);
  });

  it("resets quotaUsed and pushes period forward", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1" });
    (prisma.subscription.update as any).mockResolvedValue({
      id: "sub-1",
      quotaUsed: 0,
    });
    const res = await POST(fakeReq({ email: "creator-pro@test.local" }));
    expect(res.status).toBe(200);
    const args = (prisma.subscription.update as any).mock.calls[0][0];
    expect(args.where).toEqual({ userId: "u1" });
    expect(args.data.quotaUsed).toBe(0);
    expect(args.data.periodEnd).toBeInstanceOf(Date);
  });
});
