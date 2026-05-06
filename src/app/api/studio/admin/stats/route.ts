import { withApiHandler, requireStudioAdmin } from "@/features/ai-studio/lib/api-handler";
import { getAdminStats } from "@/features/ai-studio/lib/requests";

export const GET = withApiHandler(async () => {
  await requireStudioAdmin();
  return getAdminStats();
});
