import { randomUUID } from "node:crypto";
import { z } from "zod";
import { withApiHandler, requireStudioAdmin } from "@/features/ai-studio/lib/api-handler";
import { getSampleUploadUrl } from "@/features/ai-studio/lib/storage";
import { HttpError } from "@/features/ai-studio/lib/errors";

const Body = z.object({
  ext: z.enum(["mp4", "jpg", "webp", "png"]),
  sampleId: z.string().min(1).optional(),
});

export const POST = withApiHandler(async (req) => {
  await requireStudioAdmin();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "invalid input — ext required");
  const sampleId = parsed.data.sampleId ?? randomUUID();
  const { uploadUrl, path, token } = await getSampleUploadUrl({
    sampleId,
    ext: parsed.data.ext,
  });
  return { uploadUrl, path, token, sampleId };
});
