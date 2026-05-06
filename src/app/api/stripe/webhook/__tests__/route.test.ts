import { describe, it, expect, vi, beforeEach } from "vitest";

const verifyWebhookSignature = vi.fn();
vi.mock("@/features/ai-studio/lib/stripe", () => ({
  verifyWebhookSignature: (payload: string, sig: string) => verifyWebhookSignature(payload, sig),
  tierForPriceId: (id: string) =>
    id === "price_starter_test" ? "STARTER" : id === "price_pro_test" ? "PRO" : null,
  quotaLimitForTier: (tier: string) => (tier === "STARTER" ? 5 : tier === "PRO" ? 20 : 1),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    stripeEventLog: { findUnique: vi.fn(), create: vi.fn() },
    subscription: { upsert: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/stripe/webhook/route";

beforeEach(() => vi.clearAllMocks());

const fakeReq = (body: string, sig = "t=1,v1=fake") =>
  new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": sig },
    body,
  });

describe("POST /api/stripe/webhook", () => {
  it("returns 400 when signature verify fails", async () => {
    verifyWebhookSignature.mockImplementation(() => {
      throw new Error("invalid signature");
    });
    const res = await POST(fakeReq("{}"));
    expect(res.status).toBe(400);
  });

  it("returns 200 and skips when event already processed (idempotent)", async () => {
    verifyWebhookSignature.mockReturnValue({
      id: "evt_dup",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    (prisma.stripeEventLog.findUnique as any).mockResolvedValue({ id: "evt_dup" });
    const res = await POST(fakeReq("{}"));
    expect(res.status).toBe(200);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it("activates subscription on checkout.session.completed", async () => {
    verifyWebhookSignature.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          client_reference_id: "u1",
          customer: "cus_1",
          subscription: "sub_1",
          metadata: { tier: "STARTER" },
        },
      },
    });
    (prisma.stripeEventLog.findUnique as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1" });
    (prisma.subscription.upsert as any).mockResolvedValue({ id: "sub1" });
    const res = await POST(fakeReq("{}"));
    expect(res.status).toBe(200);
    expect(prisma.subscription.upsert).toHaveBeenCalled();
    const args = (prisma.subscription.upsert as any).mock.calls[0][0];
    expect(args.where).toEqual({ userId: "u1" });
    expect(args.update.tier).toBe("STARTER");
    expect(args.update.quotaLimit).toBe(5);
    expect(prisma.stripeEventLog.create).toHaveBeenCalledWith({
      data: { id: "evt_1", type: "checkout.session.completed", payload: expect.anything() },
    });
  });

  it("resets quotaUsed on invoice.paid", async () => {
    verifyWebhookSignature.mockReturnValue({
      id: "evt_2",
      type: "invoice.paid",
      data: {
        object: {
          customer: "cus_1",
          period_start: Math.floor(Date.now() / 1000),
          period_end: Math.floor(Date.now() / 1000) + 30 * 86_400,
        },
      },
    });
    (prisma.stripeEventLog.findUnique as any).mockResolvedValue(null);
    (prisma.subscription.findFirst as any).mockResolvedValue({ id: "sub1" });
    (prisma.subscription.update as any).mockResolvedValue({ id: "sub1" });
    const res = await POST(fakeReq("{}"));
    expect(res.status).toBe(200);
    const args = (prisma.subscription.update as any).mock.calls[0][0];
    expect(args.data.quotaUsed).toBe(0);
  });

  it("downgrades to FREE on customer.subscription.deleted", async () => {
    verifyWebhookSignature.mockReturnValue({
      id: "evt_3",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_1" } },
    });
    (prisma.stripeEventLog.findUnique as any).mockResolvedValue(null);
    (prisma.subscription.findFirst as any).mockResolvedValue({ id: "sub1" });
    (prisma.subscription.update as any).mockResolvedValue({ id: "sub1" });
    const res = await POST(fakeReq("{}"));
    expect(res.status).toBe(200);
    const args = (prisma.subscription.update as any).mock.calls[0][0];
    expect(args.data.tier).toBe("FREE");
    expect(args.data.quotaLimit).toBe(1);
  });
});
