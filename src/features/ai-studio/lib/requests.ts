import { prisma } from "@/lib/prisma";
import type { VideoRequestStatus } from "@prisma/client";
import { HttpError } from "@/features/ai-studio/lib/errors";
import { deductQuota, refundQuota } from "@/features/ai-studio/lib/quota";
import type { RequestSubmitInput } from "@/features/ai-studio/lib/schemas";

const TRANSITIONS: Record<VideoRequestStatus, ReadonlySet<VideoRequestStatus>> = {
  PENDING: new Set(["IN_PROGRESS"]),
  IN_PROGRESS: new Set(["DELIVERED", "REJECTED", "FAILED", "PENDING"]),
  DELIVERED: new Set([]),
  REJECTED: new Set([]),
  FAILED: new Set([]),
};

export function isValidTransition(from: VideoRequestStatus, to: VideoRequestStatus): boolean {
  return TRANSITIONS[from].has(to);
}

export async function submitRequest(args: { creatorId: string; input: RequestSubmitInput }) {
  const deduction = await deductQuota({ userId: args.creatorId });

  return prisma.videoRequest.create({
    data: {
      creatorId: args.creatorId,
      sampleId: args.input.sampleId,
      prompt: args.input.prompt,
      styleNotes: args.input.styleNotes,
      targetCategory: args.input.targetCategory,
      status: "PENDING",
      subscriptionId: deduction.subscriptionId,
      quotaConsumed: true,
    },
  });
}

async function assertCurrentStatus(requestId: string, expected: VideoRequestStatus) {
  const row = await prisma.videoRequest.findUnique({ where: { id: requestId } });
  if (!row) throw new HttpError(404, "request not found");
  if (row.status !== expected) {
    throw new HttpError(409, `cannot transition from ${row.status}`);
  }
  return row;
}

export async function claimRequest(args: { requestId: string; adminId: string }) {
  await assertCurrentStatus(args.requestId, "PENDING");
  return prisma.videoRequest.update({
    where: { id: args.requestId },
    data: {
      status: "IN_PROGRESS",
      claimedById: args.adminId,
      claimedAt: new Date(),
    },
  });
}

export async function deliverRequest(args: {
  requestId: string;
  outputUrl: string;
  outputDurationSec: number;
}) {
  await assertCurrentStatus(args.requestId, "IN_PROGRESS");
  return prisma.videoRequest.update({
    where: { id: args.requestId },
    data: {
      status: "DELIVERED",
      outputUrl: args.outputUrl,
      outputDurationSec: args.outputDurationSec,
      deliveredAt: new Date(),
    },
  });
}

async function refundIfApplicable(requestId: string) {
  const row = await prisma.videoRequest.findUnique({
    where: { id: requestId },
    include: { subscription: true },
  });
  if (!row?.subscriptionId || !row.subscription) return;
  await refundQuota({
    subscriptionId: row.subscriptionId,
    requestCreatedAt: row.createdAt,
    periodStartAtCreation: row.subscription.periodStart,
  });
}

export async function rejectRequest(args: { requestId: string; reason: string }) {
  await assertCurrentStatus(args.requestId, "IN_PROGRESS");
  await refundIfApplicable(args.requestId);
  return prisma.videoRequest.update({
    where: { id: args.requestId },
    data: {
      status: "REJECTED",
      rejectionReason: args.reason,
      quotaConsumed: false,
    },
  });
}

export async function failRequest(args: { requestId: string }) {
  await assertCurrentStatus(args.requestId, "IN_PROGRESS");
  await refundIfApplicable(args.requestId);
  return prisma.videoRequest.update({
    where: { id: args.requestId },
    data: {
      status: "FAILED",
      rejectionReason: "generation failed",
      quotaConsumed: false,
    },
  });
}

export async function listRequestsForCreator(args: { creatorId: string; limit?: number }) {
  return prisma.videoRequest.findMany({
    where: { creatorId: args.creatorId },
    orderBy: { createdAt: "desc" },
    take: args.limit ?? 50,
    include: { sample: true },
  });
}

export async function listAdminQueue(args: {
  limit?: number;
  status?: VideoRequestStatus | VideoRequestStatus[];
}) {
  const statusFilter = Array.isArray(args.status)
    ? { in: args.status }
    : args.status
      ? { equals: args.status }
      : { in: ["PENDING", "IN_PROGRESS"] as VideoRequestStatus[] };
  return prisma.videoRequest.findMany({
    where: { status: statusFilter },
    orderBy: { createdAt: "asc" },
    take: args.limit ?? 50,
    include: { sample: true, creator: true, claimedBy: true },
  });
}

export interface AdminStats {
  pending: number;
  inProgress: number;
  delivered7d: number;
  failed7d: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [pending, inProgress, delivered7d, failed7d] = await Promise.all([
    prisma.videoRequest.count({ where: { status: "PENDING" } }),
    prisma.videoRequest.count({ where: { status: "IN_PROGRESS" } }),
    prisma.videoRequest.count({
      where: { status: "DELIVERED", deliveredAt: { gte: sevenDaysAgo } },
    }),
    prisma.videoRequest.count({
      where: { status: "FAILED", updatedAt: { gte: sevenDaysAgo } },
    }),
  ]);
  return { pending, inProgress, delivered7d, failed7d };
}
