import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  verifyWebhookSignature,
  tierForPriceId,
  quotaLimitForTier,
} from "@/features/ai-studio/lib/stripe";

export async function POST(req: Request): Promise<Response> {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });
  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(payload, sig);
  } catch (err) {
    console.error("[stripe-webhook] signature failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const existing = await prisma.stripeEventLog.findUnique({ where: { id: event.id } });
  if (existing) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  try {
    await dispatch(event);
    await prisma.stripeEventLog.create({
      data: {
        id: event.id,
        type: event.type,
         
        payload: event as any,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[stripe-webhook] handler failed for ${event.type}`, err);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }
}

async function dispatch(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.paid":
      await handleInvoicePaid(
        event.data.object as Stripe.Invoice & { period_start?: number; period_end?: number }
      );
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      break;
  }
}

async function handleCheckoutCompleted(s: Stripe.Checkout.Session): Promise<void> {
  const userId = s.client_reference_id;
  if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const tier = (s.metadata?.tier as "STARTER" | "PRO" | undefined) ?? "STARTER";
  const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
  const subscriptionId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
  const periodEnd = new Date(Date.now() + 30 * 86_400_000);

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      tier,
      quotaLimit: quotaLimitForTier(tier),
      quotaUsed: 0,
      periodStart: new Date(),
      periodEnd,
      stripeCustomerId: customerId ?? null,
      stripeSubscriptionId: subscriptionId ?? null,
    },
    create: {
      userId: user.id,
      tier,
      quotaLimit: quotaLimitForTier(tier),
      quotaUsed: 0,
      periodStart: new Date(),
      periodEnd,
      stripeCustomerId: customerId ?? null,
      stripeSubscriptionId: subscriptionId ?? null,
    },
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const ourSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!ourSub) return;
  const priceId = sub.items.data[0]?.price?.id;
  const tier = priceId ? tierForPriceId(priceId) : null;
  await prisma.subscription.update({
    where: { id: ourSub.id },
    data: {
      ...(tier ? { tier, quotaLimit: quotaLimitForTier(tier) } : {}),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      stripeSubscriptionId: sub.id,
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const ourSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!ourSub) return;
  await prisma.subscription.update({
    where: { id: ourSub.id },
    data: { tier: "FREE", quotaLimit: 1, canceledAt: new Date() },
  });
}

async function handleInvoicePaid(
  inv: Stripe.Invoice & { period_start?: number; period_end?: number }
): Promise<void> {
  const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
  if (!customerId) return;
  const ourSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!ourSub) return;
  const periodStart = inv.period_start ? new Date(inv.period_start * 1000) : new Date();
  const periodEnd = inv.period_end
    ? new Date(inv.period_end * 1000)
    : new Date(Date.now() + 30 * 86_400_000);
  await prisma.subscription.update({
    where: { id: ourSub.id },
    data: { quotaUsed: 0, periodStart, periodEnd, cancelAtPeriodEnd: false },
  });
}

async function handlePaymentFailed(inv: Stripe.Invoice): Promise<void> {
  const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
  if (!customerId) return;
  const ourSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!ourSub) return;
  await prisma.subscription.update({
    where: { id: ourSub.id },
    data: { cancelAtPeriodEnd: true },
  });
}
