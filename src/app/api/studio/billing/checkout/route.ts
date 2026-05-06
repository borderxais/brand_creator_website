import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withApiHandler, requireSession } from "@/features/ai-studio/lib/api-handler";
import { getStripe, priceIdForTier } from "@/features/ai-studio/lib/stripe";
import { HttpError } from "@/features/ai-studio/lib/errors";

const Body = z.object({ tier: z.enum(["STARTER", "PRO"]) });

export const POST = withApiHandler(async (req) => {
  const session = await requireSession();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(400, "invalid input — tier must be STARTER or PRO");
  }
  const stripe = getStripe();
  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  let customerId = sub?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    if (sub) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { stripeCustomerId: customerId },
      });
    }
  }
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: session.user.id,
    line_items: [{ price: priceIdForTier(parsed.data.tier), quantity: 1 }],
    success_url: `${baseUrl}/studio/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/studio/billing`,
    metadata: { userId: session.user.id, tier: parsed.data.tier },
  });
  return { id: checkout.id, url: checkout.url };
});
