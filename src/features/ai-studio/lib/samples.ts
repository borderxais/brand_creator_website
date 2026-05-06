import { prisma } from "@/lib/prisma";
import type { SampleCategory } from "@prisma/client";
import type { SampleCreateInput } from "@/features/ai-studio/lib/schemas";

export interface ListSamplesArgs {
  category?: SampleCategory;
  limit?: number;
  cursorId?: string;
  includeInactive?: boolean;
}

export async function listSamples(args: ListSamplesArgs) {
  const limit = args.limit ?? 12;
  return prisma.sample.findMany({
    where: {
      ...(args.category ? { category: args.category } : {}),
      ...(args.includeInactive ? {} : { isActive: true }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(args.cursorId ? { skip: 1, cursor: { id: args.cursorId } } : {}),
  });
}

export async function getSample(id: string) {
  return prisma.sample.findUnique({ where: { id } });
}

export async function createSample(args: { input: SampleCreateInput; uploadedById: string }) {
  return prisma.sample.create({
    data: {
      title: args.input.title,
      description: args.input.description,
      category: args.input.category,
      hook: args.input.hook,
      previewUrl: args.input.previewUrl,
      thumbnailUrl: args.input.thumbnailUrl,
      durationSec: args.input.durationSec,
      uploadedById: args.uploadedById,
    },
  });
}

export async function archiveSample(id: string) {
  return prisma.sample.update({
    where: { id },
    data: { isActive: false },
  });
}
