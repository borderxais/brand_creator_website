import { withApiHandler, requireSession } from "@/features/ai-studio/lib/api-handler";
import { getSample } from "@/features/ai-studio/lib/samples";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const GET = withApiHandler(async (_req, ctx: unknown) => {
  await requireSession();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const sample = await getSample(id);
  if (!sample) throw new HttpError(404, "sample not found");
  return { sample };
});
