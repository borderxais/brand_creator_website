import Stripe from "stripe";

export type StudioTier = "FREE" | "STARTER" | "PRO";

const QUOTA_LIMITS: Record<StudioTier, number> = {
  FREE: 1,
  STARTER: 5,
  PRO: 20,
};

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY not set");
  client = new Stripe(secret);
  return client;
}

export function priceIdForTier(tier: StudioTier): string {
  if (tier === "FREE") {
    throw new Error("no price ID for FREE tier");
  }
  const envName = tier === "STARTER" ? "STRIPE_PRICE_STARTER" : "STRIPE_PRICE_PRO";
  const id = process.env[envName];
  if (!id) throw new Error(`${envName} not set`);
  return id;
}

export function tierForPriceId(priceId: string): StudioTier | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "STARTER";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  return null;
}

export function quotaLimitForTier(tier: StudioTier): number {
  return QUOTA_LIMITS[tier];
}

export function verifyWebhookSignature(payload: string, sigHeader: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  return getStripe().webhooks.constructEvent(payload, sigHeader, secret);
}
