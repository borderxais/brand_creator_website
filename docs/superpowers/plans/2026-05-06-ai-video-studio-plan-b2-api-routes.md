# AI Video Studio — Plan B2: API Routes (Sprint 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Wire all `/api/studio/*` and `/api/stripe/webhook` routes against the Plan B1 services. Each route is thin: parse JSON → validate via Zod schema → check auth/role → call service → translate `HttpError` to HTTP status. End state: full creator + admin backend reachable, ready to be exercised by UI (Plan B3).

**Architecture:** App Router routes under `src/app/api/studio/**` and `src/app/api/stripe/webhook/route.ts`. A shared `withApiHandler` helper provides session lookup, role-guard variants, and `HttpError` → status code mapping in one place. Stripe webhook uses raw body + idempotency log (`StripeEventLog`).

**Tech Stack:** Next.js 15 App Router (route handlers), NextAuth (existing `auth()`), Zod, Prisma, Stripe Node SDK.

**Spec reference:** [`docs/superpowers/specs/2026-05-05-ai-video-studio-design.md`](../specs/2026-05-05-ai-video-studio-design.md) §7 (routes), §8 (billing webhook), §10 (error handling), §13 (security).

**Prereq:** Plan A + Plan B1 complete.

---

## Task 1: Shared `withApiHandler`

**Files:**

- Create: `src/features/ai-studio/lib/api-handler.ts`
- Test: `src/features/ai-studio/lib/__tests__/api-handler.test.ts`

Test file:

```ts
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
```

Implementation:

```ts
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
```

Commit: `feat(studio): shared API handler with auth + HttpError mapping`

---

## Task 2: `GET/POST /api/studio/samples`

Test file `src/app/api/studio/samples/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/features/ai-studio/lib/samples", () => ({
  listSamples: vi.fn(),
  createSample: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { listSamples, createSample } from "@/features/ai-studio/lib/samples";
import { GET, POST } from "@/app/api/studio/samples/route";

beforeEach(() => vi.clearAllMocks());

describe("GET /api/studio/samples", () => {
  it("returns samples list", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (listSamples as any).mockResolvedValue([{ id: "s1", title: "Demo" }]);
    const res = await GET(new Request("http://localhost/api/studio/samples?limit=12"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.samples).toHaveLength(1);
  });

  it("filters by category query param", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (listSamples as any).mockResolvedValue([]);
    await GET(new Request("http://localhost/api/studio/samples?category=EMOTION_STORY&limit=5"));
    const args = (listSamples as any).mock.calls[0][0];
    expect(args.category).toBe("EMOTION_STORY");
    expect(args.limit).toBe(5);
  });

  it("returns 401 when not authenticated", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/studio/samples"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/studio/samples", () => {
  it("returns 403 when not STUDIO_ADMIN", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    const res = await POST(
      new Request("http://localhost/api/studio/samples", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Demo",
          category: "VERTICAL_DRAMA",
          previewUrl: "studio-samples/s1/sample.mp4",
        }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("creates sample when admin", async () => {
    (auth as any).mockResolvedValue({ user: { id: "a1", role: "STUDIO_ADMIN" } });
    (createSample as any).mockResolvedValue({ id: "s1" });
    const res = await POST(
      new Request("http://localhost/api/studio/samples", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Demo",
          category: "VERTICAL_DRAMA",
          previewUrl: "studio-samples/s1/sample.mp4",
        }),
      })
    );
    expect(res.status).toBe(200);
    const args = (createSample as any).mock.calls[0][0];
    expect(args.uploadedById).toBe("a1");
  });

  it("returns 400 on invalid body", async () => {
    (auth as any).mockResolvedValue({ user: { id: "a1", role: "STUDIO_ADMIN" } });
    const res = await POST(
      new Request("http://localhost/api/studio/samples", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "" }),
      })
    );
    expect(res.status).toBe(400);
  });
});
```

Implementation `src/app/api/studio/samples/route.ts`:

```ts
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
```

Commit: `feat(studio): GET/POST /api/studio/samples`

---

## Task 3: `GET /api/studio/samples/[id]`

Test file `src/app/api/studio/samples/[id]/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/features/ai-studio/lib/samples", () => ({ getSample: vi.fn() }));

import { auth } from "@/lib/auth";
import { getSample } from "@/features/ai-studio/lib/samples";
import { GET } from "@/app/api/studio/samples/[id]/route";

beforeEach(() => vi.clearAllMocks());

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/studio/samples/[id]", () => {
  it("returns sample by id", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (getSample as any).mockResolvedValue({ id: "s1", title: "Demo" });
    const res = await GET(new Request("http://localhost/api/studio/samples/s1"), ctx("s1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sample.id).toBe("s1");
  });

  it("returns 404 when not found", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (getSample as any).mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/studio/samples/missing"),
      ctx("missing")
    );
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/studio/samples/s1"), ctx("s1"));
    expect(res.status).toBe(401);
  });
});
```

Implementation `src/app/api/studio/samples/[id]/route.ts`:

```ts
import { withApiHandler, requireSession } from "@/features/ai-studio/lib/api-handler";
import { getSample } from "@/features/ai-studio/lib/samples";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const GET = withApiHandler(async (_req, ctx: unknown) => {
  await requireSession();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const sample = await getSample(id);
  if (!sample) throw new HttpError(404, "sample not found");
  return { sample };
});
```

Commit: `feat(studio): GET /api/studio/samples/[id]`

---

## Task 4: `POST/GET /api/studio/requests`

Test file `src/app/api/studio/requests/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/features/ai-studio/lib/requests", () => ({
  submitRequest: vi.fn(),
  listRequestsForCreator: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { submitRequest, listRequestsForCreator } from "@/features/ai-studio/lib/requests";
import { POST, GET } from "@/app/api/studio/requests/route";
import { HttpError } from "@/features/ai-studio/lib/errors";

beforeEach(() => vi.clearAllMocks());

const validBody = {
  prompt: "A".repeat(50),
  targetCategory: "EMOTION_STORY",
  sampleId: "s1",
};

describe("POST /api/studio/requests", () => {
  it("returns 401 when no session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    expect(res.status).toBe(401);
  });

  it("submits request and returns 200", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (submitRequest as any).mockResolvedValue({ id: "r1", status: "PENDING" });
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    expect(res.status).toBe(200);
    const args = (submitRequest as any).mock.calls[0][0];
    expect(args.creatorId).toBe("u1");
  });

  it("returns 402 when quota exhausted", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (submitRequest as any).mockRejectedValue(new HttpError(402, "quota exhausted"));
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    expect(res.status).toBe(402);
  });

  it("returns 400 on invalid body", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "short", targetCategory: "EMOTION_STORY" }),
      })
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/studio/requests", () => {
  it("returns creator's requests", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (listRequestsForCreator as any).mockResolvedValue([{ id: "r1" }]);
    const res = await GET(new Request("http://localhost/x"));
    expect(res.status).toBe(200);
    const args = (listRequestsForCreator as any).mock.calls[0][0];
    expect(args.creatorId).toBe("u1");
  });
});
```

Implementation `src/app/api/studio/requests/route.ts`:

```ts
import { withApiHandler, requireSession } from "@/features/ai-studio/lib/api-handler";
import { submitRequest, listRequestsForCreator } from "@/features/ai-studio/lib/requests";
import { RequestSubmitSchema } from "@/features/ai-studio/lib/schemas";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const POST = withApiHandler(async (req) => {
  const session = await requireSession();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = RequestSubmitSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "invalid input", parsed.error.issues);
  const request = await submitRequest({ creatorId: session.user.id, input: parsed.data });
  return { request };
});

export const GET = withApiHandler(async (_req) => {
  const session = await requireSession();
  const requests = await listRequestsForCreator({ creatorId: session.user.id });
  return { requests };
});
```

Commit: `feat(studio): POST/GET /api/studio/requests`

---

## Task 5: `GET /api/studio/requests/[id]` (creator-or-admin)

Test file `src/app/api/studio/requests/[id]/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { videoRequest: { findUnique: vi.fn() } },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/studio/requests/[id]/route";

beforeEach(() => vi.clearAllMocks());

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/studio/requests/[id]", () => {
  it("returns request when creator owns it", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (prisma.videoRequest.findUnique as any).mockResolvedValue({ id: "r1", creatorId: "u1" });
    const res = await GET(new Request("http://localhost/x"), ctx("r1"));
    expect(res.status).toBe(200);
  });

  it("returns 403 when creator does not own it", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (prisma.videoRequest.findUnique as any).mockResolvedValue({ id: "r1", creatorId: "other" });
    const res = await GET(new Request("http://localhost/x"), ctx("r1"));
    expect(res.status).toBe(403);
  });

  it("allows STUDIO_ADMIN regardless of ownership", async () => {
    (auth as any).mockResolvedValue({ user: { id: "a1", role: "STUDIO_ADMIN" } });
    (prisma.videoRequest.findUnique as any).mockResolvedValue({ id: "r1", creatorId: "other" });
    const res = await GET(new Request("http://localhost/x"), ctx("r1"));
    expect(res.status).toBe(200);
  });

  it("returns 404 when not found", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (prisma.videoRequest.findUnique as any).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/x"), ctx("missing"));
    expect(res.status).toBe(404);
  });
});
```

Implementation `src/app/api/studio/requests/[id]/route.ts`:

```ts
import { prisma } from "@/lib/prisma";
import { withApiHandler, requireSession } from "@/features/ai-studio/lib/api-handler";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const GET = withApiHandler(async (_req, ctx: unknown) => {
  const session = await requireSession();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const request = await prisma.videoRequest.findUnique({
    where: { id },
    include: { sample: true },
  });
  if (!request) throw new HttpError(404, "request not found");
  const isAdmin = session.user.role === "STUDIO_ADMIN";
  const isOwner = request.creatorId === session.user.id;
  if (!isAdmin && !isOwner) throw new HttpError(403, "forbidden");
  return { request };
});
```

Commit: `feat(studio): GET /api/studio/requests/[id] with owner+admin guard`

---

## Task 6: Admin transition routes (claim/deliver/reject/fail)

Test file `src/app/api/studio/requests/[id]/__tests__/transitions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/features/ai-studio/lib/requests", () => ({
  claimRequest: vi.fn(),
  deliverRequest: vi.fn(),
  rejectRequest: vi.fn(),
  failRequest: vi.fn(),
}));

import { auth } from "@/lib/auth";
import {
  claimRequest,
  deliverRequest,
  rejectRequest,
  failRequest,
} from "@/features/ai-studio/lib/requests";
import { POST as claim } from "@/app/api/studio/requests/[id]/claim/route";
import { POST as deliver } from "@/app/api/studio/requests/[id]/deliver/route";
import { POST as reject } from "@/app/api/studio/requests/[id]/reject/route";
import { POST as fail } from "@/app/api/studio/requests/[id]/fail/route";

beforeEach(() => vi.clearAllMocks());

const adminCtx = (id: string) => ({ params: Promise.resolve({ id }) });
const adminSession = { user: { id: "a1", role: "STUDIO_ADMIN" } };
const creatorSession = { user: { id: "u1", role: "CREATOR" } };

describe("claim", () => {
  it("returns 403 for non-admin", async () => {
    (auth as any).mockResolvedValue(creatorSession);
    const res = await claim(new Request("http://localhost/x", { method: "POST" }), adminCtx("r1"));
    expect(res.status).toBe(403);
  });
  it("calls claimRequest with adminId for admin", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (claimRequest as any).mockResolvedValue({ id: "r1", status: "IN_PROGRESS" });
    await claim(new Request("http://localhost/x", { method: "POST" }), adminCtx("r1"));
    expect(claimRequest).toHaveBeenCalledWith({ requestId: "r1", adminId: "a1" });
  });
});

describe("deliver", () => {
  it("requires outputUrl + outputDurationSec", async () => {
    (auth as any).mockResolvedValue(adminSession);
    const res = await deliver(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      adminCtx("r1")
    );
    expect(res.status).toBe(400);
  });
  it("calls deliverRequest with parsed body", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (deliverRequest as any).mockResolvedValue({ id: "r1", status: "DELIVERED" });
    await deliver(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outputUrl: "studio-outputs/u1/r1.mp4", outputDurationSec: 90 }),
      }),
      adminCtx("r1")
    );
    expect(deliverRequest).toHaveBeenCalledWith({
      requestId: "r1",
      outputUrl: "studio-outputs/u1/r1.mp4",
      outputDurationSec: 90,
    });
  });
});

describe("reject", () => {
  it("requires reason >= 5 chars", async () => {
    (auth as any).mockResolvedValue(adminSession);
    const res = await reject(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "no" }),
      }),
      adminCtx("r1")
    );
    expect(res.status).toBe(400);
  });
  it("calls rejectRequest", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (rejectRequest as any).mockResolvedValue({ id: "r1", status: "REJECTED" });
    await reject(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "needs more story setup" }),
      }),
      adminCtx("r1")
    );
    expect(rejectRequest).toHaveBeenCalledWith({
      requestId: "r1",
      reason: "needs more story setup",
    });
  });
});

describe("fail", () => {
  it("calls failRequest (no body required)", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (failRequest as any).mockResolvedValue({ id: "r1", status: "FAILED" });
    await fail(new Request("http://localhost/x", { method: "POST" }), adminCtx("r1"));
    expect(failRequest).toHaveBeenCalledWith({ requestId: "r1" });
  });
});
```

`src/app/api/studio/requests/[id]/claim/route.ts`:

```ts
import { withApiHandler, requireStudioAdmin } from "@/features/ai-studio/lib/api-handler";
import { claimRequest } from "@/features/ai-studio/lib/requests";

export const POST = withApiHandler(async (_req, ctx: unknown) => {
  const session = await requireStudioAdmin();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const request = await claimRequest({ requestId: id, adminId: session.user.id });
  return { request };
});
```

`src/app/api/studio/requests/[id]/deliver/route.ts`:

```ts
import { withApiHandler, requireStudioAdmin } from "@/features/ai-studio/lib/api-handler";
import { deliverRequest } from "@/features/ai-studio/lib/requests";
import { DeliverSchema } from "@/features/ai-studio/lib/schemas";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const POST = withApiHandler(async (req, ctx: unknown) => {
  await requireStudioAdmin();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = DeliverSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "invalid input", parsed.error.issues);
  const request = await deliverRequest({
    requestId: id,
    outputUrl: parsed.data.outputUrl,
    outputDurationSec: parsed.data.outputDurationSec,
  });
  return { request };
});
```

`src/app/api/studio/requests/[id]/reject/route.ts`:

```ts
import { withApiHandler, requireStudioAdmin } from "@/features/ai-studio/lib/api-handler";
import { rejectRequest } from "@/features/ai-studio/lib/requests";
import { RejectSchema } from "@/features/ai-studio/lib/schemas";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const POST = withApiHandler(async (req, ctx: unknown) => {
  await requireStudioAdmin();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = RejectSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "invalid input", parsed.error.issues);
  const request = await rejectRequest({ requestId: id, reason: parsed.data.reason });
  return { request };
});
```

`src/app/api/studio/requests/[id]/fail/route.ts`:

```ts
import { withApiHandler, requireStudioAdmin } from "@/features/ai-studio/lib/api-handler";
import { failRequest } from "@/features/ai-studio/lib/requests";

export const POST = withApiHandler(async (_req, ctx: unknown) => {
  await requireStudioAdmin();
  const { params } = ctx as { params: Promise<{ id: string }> };
  const { id } = await params;
  const request = await failRequest({ requestId: id });
  return { request };
});
```

Commit: `feat(studio): admin transition routes (claim/deliver/reject/fail)`

---

## Task 7: `POST /api/studio/billing/checkout`

Test file `src/app/api/studio/billing/checkout/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { subscription: { findUnique: vi.fn(), update: vi.fn() } },
}));

const createSession = vi.fn();
vi.mock("@/features/ai-studio/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: createSession } },
    customers: { create: vi.fn(async () => ({ id: "cus_new" })) },
  }),
  priceIdForTier: (tier: string) => (tier === "STARTER" ? "price_starter_test" : "price_pro_test"),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/studio/billing/checkout/route";

beforeEach(() => {
  vi.clearAllMocks();
  createSession.mockResolvedValue({ id: "cs_1", url: "https://stripe.example/checkout/cs_1" });
});

describe("POST /api/studio/billing/checkout", () => {
  it("returns 401 when no session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier: "STARTER" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for FREE tier", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier: "FREE" }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("creates Stripe Checkout session for STARTER", async () => {
    (auth as any).mockResolvedValue({
      user: { id: "u1", email: "u1@example.com", role: "CREATOR" },
    });
    (prisma.subscription.findUnique as any).mockResolvedValue({
      id: "sub1",
      stripeCustomerId: "cus_existing",
    });
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier: "STARTER" }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://stripe.example/checkout/cs_1");
    const args = createSession.mock.calls[0][0];
    expect(args.mode).toBe("subscription");
    expect(args.line_items[0].price).toBe("price_starter_test");
    expect(args.customer).toBe("cus_existing");
    expect(args.client_reference_id).toBe("u1");
  });
});
```

Implementation `src/app/api/studio/billing/checkout/route.ts`:

```ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withApiHandler, requireSession } from "@/features/ai-studio/lib/api-handler";
import { getStripe, priceIdForTier } from "@/features/ai-studio/lib/stripe";
import { HttpError } from "@/features/ai-studio/lib/errors";

const Body = z.object({ tier: z.enum(["STARTER", "PRO"]) });

export const POST = withApiHandler(async (req) => {
  const session = await requireSession();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid json");
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(400, "invalid input — tier must be STARTER or PRO");
  }
  const stripe = getStripe();
  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  let customerId = sub?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    if (sub) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { stripeCustomerId: customerId },
      });
    }
  }
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: session.user.id,
    line_items: [{ price: priceIdForTier(parsed.data.tier), quantity: 1 }],
    success_url: `${baseUrl}/studio/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/studio/billing`,
    metadata: { userId: session.user.id, tier: parsed.data.tier },
  });
  return { id: checkout.id, url: checkout.url };
});
```

Commit: `feat(studio): POST /api/studio/billing/checkout`

---

## Task 8: `POST /api/studio/billing/portal`

Test file `src/app/api/studio/billing/portal/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { subscription: { findUnique: vi.fn() } },
}));

const createPortalSession = vi.fn();
vi.mock("@/features/ai-studio/lib/stripe", () => ({
  getStripe: () => ({
    billingPortal: { sessions: { create: createPortalSession } },
  }),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/studio/billing/portal/route";

beforeEach(() => {
  vi.clearAllMocks();
  createPortalSession.mockResolvedValue({ url: "https://stripe.example/portal" });
});

describe("POST /api/studio/billing/portal", () => {
  it("returns 401 when no session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(new Request("http://localhost/x", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when no Stripe customer", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (prisma.subscription.findUnique as any).mockResolvedValue({ stripeCustomerId: null });
    const res = await POST(new Request("http://localhost/x", { method: "POST" }));
    expect(res.status).toBe(404);
  });

  it("creates portal session", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (prisma.subscription.findUnique as any).mockResolvedValue({
      stripeCustomerId: "cus_x",
    });
    const res = await POST(new Request("http://localhost/x", { method: "POST" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://stripe.example/portal");
    expect(createPortalSession.mock.calls[0][0].customer).toBe("cus_x");
  });
});
```

Implementation `src/app/api/studio/billing/portal/route.ts`:

```ts
import { prisma } from "@/lib/prisma";
import { withApiHandler, requireSession } from "@/features/ai-studio/lib/api-handler";
import { getStripe } from "@/features/ai-studio/lib/stripe";
import { HttpError } from "@/features/ai-studio/lib/errors";

export const POST = withApiHandler(async (_req) => {
  const session = await requireSession();
  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  if (!sub?.stripeCustomerId) {
    throw new HttpError(404, "no Stripe customer for this user");
  }
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const portal = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/studio/billing`,
  });
  return { url: portal.url };
});
```

Commit: `feat(studio): POST /api/studio/billing/portal`

---

## Task 9: `POST /api/stripe/webhook`

Test file `src/app/api/stripe/webhook/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const verifyWebhookSignature = vi.fn();
vi.mock("@/features/ai-studio/lib/stripe", () => ({
  verifyWebhookSignature: (payload: string, sig: string) => verifyWebhookSignature(payload, sig),
  tierForPriceId: (id: string) =>
    id === "price_starter_test" ? "STARTER" : id === "price_pro_test" ? "PRO" : null,
  quotaLimitForTier: (tier: string) => (tier === "STARTER" ? 5 : tier === "PRO" ? 20 : 1),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    stripeEventLog: { findUnique: vi.fn(), create: vi.fn() },
    subscription: { upsert: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/stripe/webhook/route";

beforeEach(() => vi.clearAllMocks());

const fakeReq = (body: string, sig = "t=1,v1=fake") =>
  new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": sig },
    body,
  });

describe("POST /api/stripe/webhook", () => {
  it("returns 400 when signature verify fails", async () => {
    verifyWebhookSignature.mockImplementation(() => {
      throw new Error("invalid signature");
    });
    const res = await POST(fakeReq("{}"));
    expect(res.status).toBe(400);
  });

  it("returns 200 and skips when event already processed (idempotent)", async () => {
    verifyWebhookSignature.mockReturnValue({
      id: "evt_dup",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    (prisma.stripeEventLog.findUnique as any).mockResolvedValue({ id: "evt_dup" });
    const res = await POST(fakeReq("{}"));
    expect(res.status).toBe(200);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it("activates subscription on checkout.session.completed", async () => {
    verifyWebhookSignature.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          client_reference_id: "u1",
          customer: "cus_1",
          subscription: "sub_1",
          metadata: { tier: "STARTER" },
        },
      },
    });
    (prisma.stripeEventLog.findUnique as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1" });
    (prisma.subscription.upsert as any).mockResolvedValue({ id: "sub1" });
    const res = await POST(fakeReq("{}"));
    expect(res.status).toBe(200);
    expect(prisma.subscription.upsert).toHaveBeenCalled();
    const args = (prisma.subscription.upsert as any).mock.calls[0][0];
    expect(args.where).toEqual({ userId: "u1" });
    expect(args.update.tier).toBe("STARTER");
    expect(args.update.quotaLimit).toBe(5);
    expect(prisma.stripeEventLog.create).toHaveBeenCalledWith({
      data: { id: "evt_1", type: "checkout.session.completed", payload: expect.anything() },
    });
  });

  it("resets quotaUsed on invoice.paid", async () => {
    verifyWebhookSignature.mockReturnValue({
      id: "evt_2",
      type: "invoice.paid",
      data: {
        object: {
          customer: "cus_1",
          period_start: Math.floor(Date.now() / 1000),
          period_end: Math.floor(Date.now() / 1000) + 30 * 86_400,
        },
      },
    });
    (prisma.stripeEventLog.findUnique as any).mockResolvedValue(null);
    (prisma.subscription.findFirst as any).mockResolvedValue({ id: "sub1" });
    (prisma.subscription.update as any).mockResolvedValue({ id: "sub1" });
    const res = await POST(fakeReq("{}"));
    expect(res.status).toBe(200);
    const args = (prisma.subscription.update as any).mock.calls[0][0];
    expect(args.data.quotaUsed).toBe(0);
  });

  it("downgrades to FREE on customer.subscription.deleted", async () => {
    verifyWebhookSignature.mockReturnValue({
      id: "evt_3",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_1" } },
    });
    (prisma.stripeEventLog.findUnique as any).mockResolvedValue(null);
    (prisma.subscription.findFirst as any).mockResolvedValue({ id: "sub1" });
    (prisma.subscription.update as any).mockResolvedValue({ id: "sub1" });
    const res = await POST(fakeReq("{}"));
    expect(res.status).toBe(200);
    const args = (prisma.subscription.update as any).mock.calls[0][0];
    expect(args.data.tier).toBe("FREE");
    expect(args.data.quotaLimit).toBe(1);
  });
});
```

Implementation `src/app/api/stripe/webhook/route.ts`:

```ts
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  verifyWebhookSignature,
  tierForPriceId,
  quotaLimitForTier,
} from "@/features/ai-studio/lib/stripe";

export async function POST(req: Request): Promise<Response> {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });
  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(payload, sig);
  } catch (err) {
    console.error("[stripe-webhook] signature failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const existing = await prisma.stripeEventLog.findUnique({ where: { id: event.id } });
  if (existing) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  try {
    await dispatch(event);
    await prisma.stripeEventLog.create({
      data: {
        id: event.id,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[stripe-webhook] handler failed for ${event.type}`, err);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }
}

async function dispatch(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      break;
  }
}

async function handleCheckoutCompleted(s: Stripe.Checkout.Session): Promise<void> {
  const userId = s.client_reference_id;
  if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const tier = (s.metadata?.tier as "STARTER" | "PRO" | undefined) ?? "STARTER";
  const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
  const subscriptionId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
  const periodEnd = new Date(Date.now() + 30 * 86_400_000);

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      tier,
      quotaLimit: quotaLimitForTier(tier),
      quotaUsed: 0,
      periodStart: new Date(),
      periodEnd,
      stripeCustomerId: customerId ?? null,
      stripeSubscriptionId: subscriptionId ?? null,
    },
    create: {
      userId: user.id,
      tier,
      quotaLimit: quotaLimitForTier(tier),
      quotaUsed: 0,
      periodStart: new Date(),
      periodEnd,
      stripeCustomerId: customerId ?? null,
      stripeSubscriptionId: subscriptionId ?? null,
    },
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const ourSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!ourSub) return;
  const priceId = sub.items.data[0]?.price?.id;
  const tier = priceId ? tierForPriceId(priceId) : null;
  await prisma.subscription.update({
    where: { id: ourSub.id },
    data: {
      ...(tier ? { tier, quotaLimit: quotaLimitForTier(tier) } : {}),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      stripeSubscriptionId: sub.id,
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const ourSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!ourSub) return;
  await prisma.subscription.update({
    where: { id: ourSub.id },
    data: { tier: "FREE", quotaLimit: 1, canceledAt: new Date() },
  });
}

async function handleInvoicePaid(inv: Stripe.Invoice): Promise<void> {
  const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
  if (!customerId) return;
  const ourSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!ourSub) return;
  const periodStart = inv.period_start ? new Date(inv.period_start * 1000) : new Date();
  const periodEnd = inv.period_end
    ? new Date(inv.period_end * 1000)
    : new Date(Date.now() + 30 * 86_400_000);
  await prisma.subscription.update({
    where: { id: ourSub.id },
    data: { quotaUsed: 0, periodStart, periodEnd, cancelAtPeriodEnd: false },
  });
}

async function handlePaymentFailed(inv: Stripe.Invoice): Promise<void> {
  const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
  if (!customerId) return;
  const ourSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!ourSub) return;
  await prisma.subscription.update({
    where: { id: ourSub.id },
    data: { cancelAtPeriodEnd: true },
  });
}
```

Commit: `feat(studio): Stripe webhook with signature verify + idempotency`

---

## Task 10: Sanity check + push

- [ ] Run `npm run harness:prepush` — expect green.
- [ ] `git push origin main`.

---

## Definition of Done (Plan B2)

- [ ] All 10 tasks committed.
- [ ] `npm run harness:prepush` passes.
- [ ] All routes exposed and tested.
- [ ] Stripe webhook idempotent.

---

## Plan B3 preview

- **Plan B3 — Creator UI (Sprint 4):** `/studio` landing, `/studio/samples`, `/studio/samples/[id]`, `/studio/requests`, `/studio/requests/[id]`, `/studio/billing` pages + `SampleCard`, `QuotaBadge`, `StatusBadge`, `RequestForm` components.
