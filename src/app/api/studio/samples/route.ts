import {
  withApiHandler,
  requireSession,
  requireStudioAdmin,
} from "@/features/ai-studio/lib/api-handler";
import { listSamples, createSample } from "@/features/ai-studio/lib/samples";
import { SampleCreateSchema, CategoryEnum } from "@/features/ai-studio/lib/schemas";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const GET = withApiHandler(async (req) => {
  await requireSession();
  const url = new URL(req.url);
  const categoryParam = url.searchParams.get("category");
  const limitParam = url.searchParams.get("limit");
  const cursorParam = url.searchParams.get("cursor");

  const category = categoryParam ? CategoryEnum.safeParse(categoryParam) : null;
  if (categoryParam && !category?.success) throw new HttpError(400, "invalid category");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const samples = await listSamples({
    category: category?.success ? category.data : undefined,
    limit,
    cursorId: cursorParam ?? undefined,
  });
  return { samples };
});

export const POST = withApiHandler(async (req) => {
  const session = await requireStudioAdmin();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = SampleCreateSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "invalid input", parsed.error.issues);
  const sample = await createSample({ input: parsed.data, uploadedById: session.user.id });
  return { sample };
});
