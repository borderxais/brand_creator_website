import { withApiHandler, requireStudioAdmin } from "@/features/ai-studio/lib/api-handler";
import { releaseRequest } from "@/features/ai-studio/lib/requests";

export const POST = withApiHandler(async (_req, ctx: unknown) => {
  await requireStudioAdmin();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const request = await releaseRequest({ requestId: id });
  return { request };
});
