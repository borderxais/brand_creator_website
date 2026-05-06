import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { subscription: { findUnique: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { getQuotaForUser } from "@/features/ai-studio/lib/get-quota";

beforeEach(() => vi.clearAllMocks());

describe("getQuotaForUser", () => {
  it("returns FREE default when no subscription row", async () => {
    (prisma.subscription.findUnique as any).mockResolvedValue(null);
    const q = await getQuotaForUser("u1");
    expect(q.tier).toBe("FREE");
    expect(q.quotaLimit).toBe(1);
    expect(q.quotaUsed).toBe(0);
    expect(q.exists).toBe(false);
  });

  it("returns the subscription state when present", async () => {
    (prisma.subscription.findUnique as any).mockResolvedValue({
      tier: "STARTER",
      quotaLimit: 5,
      quotaUsed: 2,
      periodEnd: new Date(Date.now() + 86_400_000),
    });
    const q = await getQuotaForUser("u1");
    expect(q.tier).toBe("STARTER");
    expect(q.quotaUsed).toBe(2);
    expect(q.exists).toBe(true);
  });
});
