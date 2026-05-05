import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertDevOnly, DevOnlyForbiddenError } from "@/lib/dev-only";

const Body = z.object({
  email: z.string().email(),
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

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const newPeriodStart = new Date();
  const newPeriodEnd = new Date(Date.now() + 30 * 86_400_000);

  const sub = await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      periodStart: newPeriodStart,
      periodEnd: newPeriodEnd,
      quotaUsed: 0,
    },
  });

  return NextResponse.json({ ok: true, subscription: sub });
}
