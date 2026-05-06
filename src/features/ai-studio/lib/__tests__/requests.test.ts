import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    videoRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/features/ai-studio/lib/quota", () => ({
  deductQuota: vi.fn(),
  refundQuota: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { deductQuota, refundQuota } from "@/features/ai-studio/lib/quota";
import {
  isValidTransition,
  submitRequest,
  claimRequest,
  deliverRequest,
  rejectRequest,
  failRequest,
} from "@/features/ai-studio/lib/requests";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isValidTransition", () => {
  it("allows PENDING → IN_PROGRESS", () => {
    expect(isValidTransition("PENDING", "IN_PROGRESS")).toBe(true);
  });
  it("allows IN_PROGRESS → DELIVERED|REJECTED|FAILED|PENDING", () => {
    expect(isValidTransition("IN_PROGRESS", "DELIVERED")).toBe(true);
    expect(isValidTransition("IN_PROGRESS", "REJECTED")).toBe(true);
    expect(isValidTransition("IN_PROGRESS", "FAILED")).toBe(true);
    expect(isValidTransition("IN_PROGRESS", "PENDING")).toBe(true);
  });
  it("rejects DELIVERED → anything", () => {
    expect(isValidTransition("DELIVERED", "REJECTED")).toBe(false);
    expect(isValidTransition("DELIVERED", "DELIVERED")).toBe(false);
  });
  it("rejects PENDING → DELIVERED (must claim first)", () => {
    expect(isValidTransition("PENDING", "DELIVERED")).toBe(false);
  });
});

describe("submitRequest", () => {
  it("deducts quota and creates request", async () => {
    (deductQuota as any).mockResolvedValue({ subscriptionId: "sub1", quotaUsedAfter: 1 });
    (prisma.videoRequest.create as any).mockResolvedValue({ id: "r1", status: "PENDING" });
    const result = await submitRequest({
      creatorId: "u1",
      input: {
        prompt: "A".repeat(50),
        targetCategory: "EMOTION_STORY",
        sampleId: "s1",
      },
    });
    expect(deductQuota).toHaveBeenCalledWith({ userId: "u1" });
    expect(result.id).toBe("r1");
  });
});

describe("claimRequest", () => {
  it("requires status PENDING", async () => {
    (prisma.videoRequest.findUnique as any).mockResolvedValue({
      id: "r1",
      status: "DELIVERED",
    });
    await expect(claimRequest({ requestId: "r1", adminId: "a1" })).rejects.toMatchObject({
      status: 409,
    });
  });
  it("transitions PENDING → IN_PROGRESS with claimedBy/claimedAt", async () => {
    (prisma.videoRequest.findUnique as any).mockResolvedValue({ id: "r1", status: "PENDING" });
    (prisma.videoRequest.update as any).mockResolvedValue({
      id: "r1",
      status: "IN_PROGRESS",
    });
    await claimRequest({ requestId: "r1", adminId: "a1" });
    const args = (prisma.videoRequest.update as any).mock.calls[0][0];
    expect(args.data.status).toBe("IN_PROGRESS");
    expect(args.data.claimedById).toBe("a1");
    expect(args.data.claimedAt).toBeInstanceOf(Date);
  });
});

describe("deliverRequest", () => {
  it("requires status IN_PROGRESS", async () => {
    (prisma.videoRequest.findUnique as any).mockResolvedValue({
      id: "r1",
      status: "PENDING",
    });
    await expect(
      deliverRequest({
        requestId: "r1",
        outputUrl: "studio-outputs/u1/r1.mp4",
        outputDurationSec: 90,
      })
    ).rejects.toMatchObject({ status: 409 });
  });
  it("transitions IN_PROGRESS → DELIVERED with output fields", async () => {
    (prisma.videoRequest.findUnique as any).mockResolvedValue({
      id: "r1",
      status: "IN_PROGRESS",
    });
    (prisma.videoRequest.update as any).mockResolvedValue({
      id: "r1",
      status: "DELIVERED",
    });
    await deliverRequest({
      requestId: "r1",
      outputUrl: "studio-outputs/u1/r1.mp4",
      outputDurationSec: 90,
    });
    const args = (prisma.videoRequest.update as any).mock.calls[0][0];
    expect(args.data.status).toBe("DELIVERED");
    expect(args.data.outputUrl).toBe("studio-outputs/u1/r1.mp4");
    expect(args.data.deliveredAt).toBeInstanceOf(Date);
  });
});

describe("rejectRequest", () => {
  it("refunds quota and sets rejectionReason", async () => {
    (prisma.videoRequest.findUnique as any)
      .mockResolvedValueOnce({ id: "r1", status: "IN_PROGRESS" })
      .mockResolvedValueOnce({
        id: "r1",
        subscriptionId: "sub1",
        createdAt: new Date(),
        subscription: { periodStart: new Date() },
      });
    (prisma.videoRequest.update as any).mockResolvedValue({ id: "r1", status: "REJECTED" });
    await rejectRequest({ requestId: "r1", reason: "needs more story setup" });
    expect(refundQuota).toHaveBeenCalled();
    const args = (prisma.videoRequest.update as any).mock.calls[0][0];
    expect(args.data.status).toBe("REJECTED");
    expect(args.data.rejectionReason).toBe("needs more story setup");
    expect(args.data.quotaConsumed).toBe(false);
  });
});

describe("failRequest", () => {
  it("refunds quota and sets canned reason", async () => {
    (prisma.videoRequest.findUnique as any)
      .mockResolvedValueOnce({ id: "r1", status: "IN_PROGRESS" })
      .mockResolvedValueOnce({
        id: "r1",
        subscriptionId: "sub1",
        createdAt: new Date(),
        subscription: { periodStart: new Date() },
      });
    (prisma.videoRequest.update as any).mockResolvedValue({ id: "r1", status: "FAILED" });
    await failRequest({ requestId: "r1" });
    const args = (prisma.videoRequest.update as any).mock.calls[0][0];
    expect(args.data.status).toBe("FAILED");
    expect(args.data.rejectionReason).toMatch(/generation failed/i);
  });
});
