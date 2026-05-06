import { prisma } from "@/lib/prisma";

export interface QuotaState {
  exists: boolean;
  tier: "FREE" | "STARTER" | "PRO";
  quotaLimit: number;
  quotaUsed: number;
  remaining: number;
  periodEnd: Date | null;
}

export async function getQuotaForUser(userId: string): Promise<QuotaState> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    return {
      exists: false,
      tier: "FREE",
      quotaLimit: 1,
      quotaUsed: 0,
      remaining: 1,
      periodEnd: null,
    };
  }
  return {
    exists: true,
    tier: sub.tier,
    quotaLimit: sub.quotaLimit,
    quotaUsed: sub.quotaUsed,
    remaining: Math.max(0, sub.quotaLimit - sub.quotaUsed),
    periodEnd: sub.periodEnd,
  };
}
