import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertDevOnly, DevOnlyForbiddenError } from "@/lib/dev-only";

const TIER_LIMIT: Record<string, number> = {
  FREE: 1,
  STARTER: 5,
  PRO: 20,
};

const Body = z.object({
  email: z.string().email(),
  tier: z.enum(["FREE", "STARTER", "PRO"]),
  quotaUsed: z.number().int().min(0).optional(),
  periodEndDays: z.number().int().min(0).max(3650).optional(),
});

export async function POST(req: Request) {
  try {
    assertDevOnly();
  } catch (err) {
    if (err instanceof DevOnlyForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { email, tier, quotaUsed, periodEndDays } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const quotaLimit = TIER_LIMIT[tier];
  const periodEnd =
    periodEndDays !== undefined
      ? new Date(Date.now() + periodEndDays * 86_400_000)
      : tier === "FREE"
        ? new Date("2125-01-01T00:00:00.000Z")
        : new Date(Date.now() + 30 * 86_400_000);

  const sub = await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      tier,
      quotaLimit,
      quotaUsed: quotaUsed ?? 0,
      periodStart: new Date(),
      periodEnd,
    },
    create: {
      userId: user.id,
      tier,
      quotaLimit,
      quotaUsed: quotaUsed ?? 0,
      periodStart: new Date(),
      periodEnd,
    },
  });

  return NextResponse.json({ ok: true, subscription: sub });
}
