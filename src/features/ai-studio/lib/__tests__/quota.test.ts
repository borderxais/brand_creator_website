import { describe, it, expect, vi, beforeEach } from "vitest";

const txMock = {
  $queryRaw: vi.fn(),
  subscription: {
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (tx: typeof txMock) => unknown) => cb(txMock)),
  },
}));

import { deductQuota, refundQuota } from "@/features/ai-studio/lib/quota";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deductQuota", () => {
  it("throws 402 when quota exhausted", async () => {
    txMock.$queryRaw.mockResolvedValue([
      {
        id: "sub1",
        quotaUsed: 5,
        quotaLimit: 5,
        periodEnd: new Date(Date.now() + 86_400_000),
      },
    ]);
    await expect(deductQuota({ userId: "u1" })).rejects.toMatchObject({
      status: 402,
    });
  });

  it("throws 403 when no subscription", async () => {
    txMock.$queryRaw.mockResolvedValue([]);
    await expect(deductQuota({ userId: "u1" })).rejects.toMatchObject({
      status: 403,
    });
  });

  it("throws 409 when period expired", async () => {
    txMock.$queryRaw.mockResolvedValue([
      {
        id: "sub1",
        quotaUsed: 0,
        quotaLimit: 5,
        periodEnd: new Date(Date.now() - 86_400_000),
      },
    ]);
    await expect(deductQuota({ userId: "u1" })).rejects.toMatchObject({
      status: 409,
    });
  });

  it("increments quotaUsed and returns subscriptionId on success", async () => {
    txMock.$queryRaw.mockResolvedValue([
      {
        id: "sub1",
        quotaUsed: 2,
        quotaLimit: 5,
        periodEnd: new Date(Date.now() + 86_400_000),
      },
    ]);
    txMock.subscription.update.mockResolvedValue({ id: "sub1", quotaUsed: 3 });
    const result = await deductQuota({ userId: "u1" });
    expect(result.subscriptionId).toBe("sub1");
    expect(txMock.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub1" },
      data: { quotaUsed: { increment: 1 } },
    });
  });
});

describe("refundQuota", () => {
  it("decrements quotaUsed when subscription period unchanged", async () => {
    const periodStart = new Date(Date.now() - 2000);
    txMock.$queryRaw.mockResolvedValue([
      {
        id: "sub1",
        periodStart,
      },
    ]);
    await refundQuota({
      subscriptionId: "sub1",
      requestCreatedAt: new Date(Date.now() - 1000),
      periodStartAtCreation: periodStart,
    });
    expect(txMock.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub1" },
      data: { quotaUsed: { decrement: 1 } },
    });
  });

  it("does NOT decrement when period rolled over since request", async () => {
    const oldPeriodStart = new Date(Date.now() - 60 * 86_400_000);
    txMock.$queryRaw.mockResolvedValue([
      {
        id: "sub1",
        periodStart: new Date(),
      },
    ]);
    await refundQuota({
      subscriptionId: "sub1",
      requestCreatedAt: new Date(Date.now() - 60 * 86_400_000),
      periodStartAtCreation: oldPeriodStart,
    });
    expect(txMock.subscription.update).not.toHaveBeenCalled();
  });
});
