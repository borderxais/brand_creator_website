import { withApiHandler, requireStudioAdmin } from "@/features/ai-studio/lib/api-handler";
import { claimRequest } from "@/features/ai-studio/lib/requests";

export const POST = withApiHandler(async (_req, ctx: unknown) => {
  const session = await requireStudioAdmin();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const request = await claimRequest({ requestId: id, adminId: session.user.id });
  return { request };
});
