import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withApiHandler, requireStudioAdmin } from "@/features/ai-studio/lib/api-handler";
import { getOutputUploadUrl } from "@/features/ai-studio/lib/storage";
import { HttpError } from "@/features/ai-studio/lib/errors";

const Body = z.object({ requestId: z.string().min(1) });

export const POST = withApiHandler(async (req) => {
  await requireStudioAdmin();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "invalid input — requestId required");

  const reqRow = await prisma.videoRequest.findUnique({
    where: { id: parsed.data.requestId },
    select: { id: true, creatorId: true, status: true },
  });
  if (!reqRow) throw new HttpError(404, "request not found");
  if (reqRow.status !== "IN_PROGRESS") {
    throw new HttpError(409, `cannot upload output while status is ${reqRow.status}`);
  }

  const { uploadUrl, path, token } = await getOutputUploadUrl({
    userId: reqRow.creatorId,
    requestId: reqRow.id,
  });
  return { uploadUrl, path, token };
});
