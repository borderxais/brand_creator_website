import { prisma } from "@/lib/prisma";
import { withApiHandler, requireSession } from "@/features/ai-studio/lib/api-handler";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const GET = withApiHandler(async (_req, ctx: unknown) => {
  const session = await requireSession();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const request = await prisma.videoRequest.findUnique({
    where: { id },
    include: { sample: true },
  });
  if (!request) throw new HttpError(404, "request not found");
  const isAdmin = session.user.role === "STUDIO_ADMIN";
  const isOwner = request.creatorId === session.user.id;
  if (!isAdmin && !isOwner) throw new HttpError(403, "forbidden");
  return { request };
});
