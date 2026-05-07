import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";

const ROLE_TO_USER: Record<string, { id: string; email: string; role: string }> = {
  brand: { id: "e2e-user-brand", email: "brand@e2e.test", role: "BRAND" },
  creator: { id: "e2e-user-creator", email: "creator@e2e.test", role: "CREATOR" },
  admin: { id: "e2e-user-admin", email: "admin@e2e.test", role: "STUDIO_ADMIN" },
};

export async function GET(req: Request): Promise<Response> {
  if (process.env.E2E_EXPLORE !== "1" || process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  const role = new URL(req.url).searchParams.get("role") ?? "";
  const user = ROLE_TO_USER[role];
  if (!user) {
    return NextResponse.json({ error: "unknown role" }, { status: 400 });
  }
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return NextResponse.json({ error: "no secret" }, { status: 500 });

  const token = await encode({
    token: { sub: user.id, email: user.email, role: user.role } as any,
    secret,
  });
  const res = NextResponse.json({ ok: true, role });
  res.headers.append(
    "set-cookie",
    `next-auth.session-token=${token}; Path=/; HttpOnly; SameSite=Lax`
  );
  return res;
}
