import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { assertDevOnly, DevOnlyForbiddenError } from "@/lib/dev-only";

const SESSION_COOKIE_NAME = "next-auth.session-token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day

export async function POST(req: Request) {
  try {
    assertDevOnly();
  } catch (err) {
    if (err instanceof DevOnlyForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body.email || typeof body.email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "NEXTAUTH_SECRET unset" }, { status: 500 });
  }

  const token = await encode({
    token: {
      id: user.id,
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
      role: user.role,
    },
    secret,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  const res = NextResponse.json({ ok: true, userId: user.id });
  res.headers.append(
    "set-cookie",
    `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`
  );
  return res;
}
