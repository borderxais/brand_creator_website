import { prisma } from "@/lib/prisma";
import { withApiHandler, requireSession } from "@/features/ai-studio/lib/api-handler";
import { getStripe } from "@/features/ai-studio/lib/stripe";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const POST = withApiHandler(async (_req) => {
  const session = await requireSession();
  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  if (!sub?.stripeCustomerId) {
    throw new HttpError(404, "no Stripe customer for this user");
  }
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const portal = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/studio/billing`,
  });
  return { url: portal.url };
});
