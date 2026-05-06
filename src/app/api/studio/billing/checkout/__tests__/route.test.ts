import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { subscription: { findUnique: vi.fn(), update: vi.fn() } },
}));

const createSession = vi.fn();
vi.mock("@/features/ai-studio/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: createSession } },
    customers: { create: vi.fn(async () => ({ id: "cus_new" })) },
  }),
  priceIdForTier: (tier: string) => (tier === "STARTER" ? "price_starter_test" : "price_pro_test"),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/studio/billing/checkout/route";

beforeEach(() => {
  vi.clearAllMocks();
  createSession.mockResolvedValue({ id: "cs_1", url: "https://stripe.example/checkout/cs_1" });
});

describe("POST /api/studio/billing/checkout", () => {
  it("returns 401 when no session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier: "STARTER" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for FREE tier", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier: "FREE" }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("creates Stripe Checkout session for STARTER", async () => {
    (auth as any).mockResolvedValue({
      user: { id: "u1", email: "u1@example.com", role: "CREATOR" },
    });
    (prisma.subscription.findUnique as any).mockResolvedValue({
      id: "sub1",
      stripeCustomerId: "cus_existing",
    });
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier: "STARTER" }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://stripe.example/checkout/cs_1");
    const args = createSession.mock.calls[0][0];
    expect(args.mode).toBe("subscription");
    expect(args.line_items[0].price).toBe("price_starter_test");
    expect(args.customer).toBe("cus_existing");
    expect(args.client_reference_id).toBe("u1");
  });
});
