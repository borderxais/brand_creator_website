import { withApiHandler, requireStudioAdmin } from "@/features/ai-studio/lib/api-handler";
import { deliverRequest } from "@/features/ai-studio/lib/requests";
import { DeliverSchema } from "@/features/ai-studio/lib/schemas";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const POST = withApiHandler(async (req, ctx: unknown) => {
  await requireStudioAdmin();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = DeliverSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "invalid input", parsed.error.issues);
  const request = await deliverRequest({
    requestId: id,
    outputUrl: parsed.data.outputUrl,
    outputDurationSec: parsed.data.outputDurationSec,
  });
  return { request };
});
