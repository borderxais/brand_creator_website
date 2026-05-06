import { withApiHandler, requireSession } from "@/features/ai-studio/lib/api-handler";
import { submitRequest, listRequestsForCreator } from "@/features/ai-studio/lib/requests";
import { RequestSubmitSchema } from "@/features/ai-studio/lib/schemas";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const POST = withApiHandler(async (req) => {
  const session = await requireSession();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = RequestSubmitSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "invalid input", parsed.error.issues);
  const request = await submitRequest({ creatorId: session.user.id, input: parsed.data });
  return { request };
});

export const GET = withApiHandler(async (_req) => {
  const session = await requireSession();
  const requests = await listRequestsForCreator({ creatorId: session.user.id });
  return { requests };
});
