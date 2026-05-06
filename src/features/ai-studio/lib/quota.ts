import { prisma } from "@/lib/prisma";
import { HttpError } from "@/features/ai-studio/lib/errors";

export interface DeductResult {
  subscriptionId: string;
  quotaUsedAfter: number;
}

export async function deductQuota(args: { userId: string }): Promise<DeductResult> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{ id: string; quotaUsed: number; quotaLimit: number; periodEnd: Date }>
    >`SELECT id, "quotaUsed", "quotaLimit", "periodEnd"
        FROM "Subscription"
       WHERE "userId" = ${args.userId}
       FOR UPDATE`;

    if (rows.length === 0) {
      throw new HttpError(403, "no subscription");
    }
    const sub = rows[0];
    if (sub.periodEnd.getTime() < Date.now()) {
      throw new HttpError(409, "subscription period expired");
    }
    if (sub.quotaUsed >= sub.quotaLimit) {
      throw new HttpError(402, "quota exhausted");
    }

    const updated = await tx.subscription.update({
      where: { id: sub.id },
      data: { quotaUsed: { increment: 1 } },
    });

    return { subscriptionId: sub.id, quotaUsedAfter: updated.quotaUsed };
  });
}

export interface RefundArgs {
  subscriptionId: string;
  requestCreatedAt: Date;
  periodStartAtCreation: Date;
}

export async function refundQuota(args: RefundArgs): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string; periodStart: Date }>>`
      SELECT id, "periodStart"
        FROM "Subscription"
       WHERE id = ${args.subscriptionId}
       FOR UPDATE`;
    if (rows.length === 0) return;
    const current = rows[0];
    if (current.periodStart.getTime() !== args.periodStartAtCreation.getTime()) {
      return;
    }
    await tx.subscription.update({
      where: { id: args.subscriptionId },
      data: { quotaUsed: { decrement: 1 } },
    });
  });
}
