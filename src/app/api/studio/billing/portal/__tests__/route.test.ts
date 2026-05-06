import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { subscription: { findUnique: vi.fn() } },
}));

const createPortalSession = vi.fn();
vi.mock("@/features/ai-studio/lib/stripe", () => ({
  getStripe: () => ({
    billingPortal: { sessions: { create: createPortalSession } },
  }),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/studio/billing/portal/route";

beforeEach(() => {
  vi.clearAllMocks();
  createPortalSession.mockResolvedValue({ url: "https://stripe.example/portal" });
});

describe("POST /api/studio/billing/portal", () => {
  it("returns 401 when no session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost/x", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when no Stripe customer", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (prisma.subscription.findUnique as any).mockResolvedValue({ stripeCustomerId: null });
    const res = await POST(new Request("http://localhost/x", { method: "POST" }));
    expect(res.status).toBe(404);
  });

  it("creates portal session", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (prisma.subscription.findUnique as any).mockResolvedValue({
      stripeCustomerId: "cus_x",
    });
    const res = await POST(new Request("http://localhost/x", { method: "POST" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://stripe.example/portal");
    expect(createPortalSession.mock.calls[0][0].customer).toBe("cus_x");
  });
});
