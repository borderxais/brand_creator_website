import {
  withApiHandler,
  requireSession,
  requireStudioAdmin,
} from "@/features/ai-studio/lib/api-handler";
import { getSample, updateSample } from "@/features/ai-studio/lib/samples";
import { SampleUpdateSchema } from "@/features/ai-studio/lib/schemas";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const GET = withApiHandler(async (_req, ctx: unknown) => {
  await requireSession();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const sample = await getSample(id);
  if (!sample) throw new HttpError(404, "sample not found");
  return { sample };
});

export const PATCH = withApiHandler(async (req: Request, ctx: unknown) => {
  await requireStudioAdmin();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  if (!id) throw new HttpError(400, "missing sample id");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = SampleUpdateSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "invalid input");

  const sample = await updateSample({ id, input: parsed.data });
  return { sample };
});
