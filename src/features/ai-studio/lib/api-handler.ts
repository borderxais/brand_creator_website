import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { HttpError, isHttpError } from "@/features/ai-studio/lib/errors";

export type StudioHandler = (req: Request, ctx?: unknown) => Promise<unknown>;

export function withApiHandler(handler: StudioHandler) {
  return async (req: Request, ctx?: unknown): Promise<Response> => {
    try {
      const result = await handler(req, ctx);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      if (isHttpError(err)) {
        return NextResponse.json(
          { error: err.message, ...(err.details ? { details: err.details } : {}) },
          { status: err.status }
        );
      }
      console.error("[studio-api] unhandled", err);
      return NextResponse.json({ error: "internal error" }, { status: 500 });
    }
  };
}

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "authentication required");
  return session;
}

export async function requireStudioAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "STUDIO_ADMIN") throw new HttpError(403, "studio admin required");
  return session;
}
