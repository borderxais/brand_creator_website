import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import {
  withApiHandler,
  requireSession,
  requireStudioAdmin,
} from "@/features/ai-studio/lib/api-handler";
import { HttpError } from "@/features/ai-studio/lib/errors";

beforeEach(() => vi.clearAllMocks());

describe("withApiHandler", () => {
  it("returns handler result as JSON 200", async () => {
    const handler = withApiHandler(async () => ({ ok: true, value: 42 }));
    const res = await handler(new Request("http://localhost/x", { method: "POST" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, value: 42 });
  });

  it("maps HttpError to its status code", async () => {
    const handler = withApiHandler(async () => {
      throw new HttpError(402, "quota exhausted");
    });
    const res = await handler(new Request("http://localhost/x"));
    expect(res.status).toBe(402);
    expect(await res.json()).toEqual({ error: "quota exhausted" });
  });

  it("maps unknown errors to 500", async () => {
    const handler = withApiHandler(async () => {
      throw new Error("boom");
    });
    const res = await handler(new Request("http://localhost/x"));
    expect(res.status).toBe(500);
  });
});

describe("requireSession", () => {
  it("throws 401 when no session", async () => {
    (auth as any).mockResolvedValue(null);
    await expect(requireSession()).rejects.toMatchObject({ status: 401 });
  });

  it("returns session when present", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    const s = await requireSession();
    expect(s.user.id).toBe("u1");
  });
});

describe("requireStudioAdmin", () => {
  it("throws 403 when role is not STUDIO_ADMIN", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    await expect(requireStudioAdmin()).rejects.toMatchObject({ status: 403 });
  });

  it("returns session when role is STUDIO_ADMIN", async () => {
    (auth as any).mockResolvedValue({ user: { id: "a1", role: "STUDIO_ADMIN" } });
    const s = await requireStudioAdmin();
    expect(s.user.role).toBe("STUDIO_ADMIN");
  });
});
