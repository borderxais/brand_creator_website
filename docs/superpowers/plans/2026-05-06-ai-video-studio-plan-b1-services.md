# AI Video Studio — Plan B1: Services (Sprint 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the server-side service layer for AI Video Studio: storage helpers, Stripe wrapper, sample CRUD, atomic quota deduction/refund, and request state machine. End state: services are individually unit-tested with mocked Prisma, ready to be called by API routes (Plan B2) without further refactoring.

**Architecture:** Pure server-only modules under `src/features/ai-studio/lib/`. Prisma is the single transactional store; Supabase Storage for binary assets; Stripe SDK for billing. Each module has one clear responsibility and a small, well-typed interface. Zod schemas live alongside each service for input validation reuse from API routes.

**Tech Stack:** Next.js 15 (server-only), Prisma 6, PostgreSQL 17 (Supabase), Stripe Node SDK, `@supabase/supabase-js`, Zod, Vitest.

**Spec reference:** [`docs/superpowers/specs/2026-05-05-ai-video-studio-design.md`](../specs/2026-05-05-ai-video-studio-design.md) §4 (architecture), §6 (request lifecycle), §8 (billing/quota).

**Prereq:** Plan A complete (Studio Prisma schema applied, dev seams in place).

---

## File Map

### New files

| Path                                             | Responsibility                                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `src/features/ai-studio/lib/storage.ts`          | Supabase Storage bucket helpers — get/sign URLs, upload paths                             |
| `src/features/ai-studio/lib/stripe.ts`           | Stripe SDK singleton + price ID lookup + webhook signature verify                         |
| `src/features/ai-studio/lib/samples.ts`          | Sample CRUD: list (cursor-paginated), getById, create, archive                            |
| `src/features/ai-studio/lib/quota.ts`            | Atomic deduct + refund + period-rollover, row-locked transaction                          |
| `src/features/ai-studio/lib/requests.ts`         | Request state machine: validate transitions, perform transitions in tx                    |
| `src/features/ai-studio/lib/errors.ts`           | Shared `HttpError` class for status-code mapping                                          |
| `src/features/ai-studio/lib/schemas.ts`          | Zod schemas: `RequestSubmitSchema`, `SampleCreateSchema`, `DeliverSchema`, `RejectSchema` |
| `src/features/ai-studio/lib/__tests__/*.test.ts` | Vitest unit tests for each service                                                        |
| `scripts/studio-create-buckets.js`               | One-shot script to create `studio-samples` + `studio-outputs` Supabase buckets            |

### Modified files

None — all additive in `src/features/ai-studio/lib/`.

---

## Task 1: HttpError shared error class

**Files:**

- Create: `src/features/ai-studio/lib/errors.ts`
- Test: `src/features/ai-studio/lib/__tests__/errors.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/ai-studio/lib/__tests__/errors.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { HttpError, isHttpError } from "@/features/ai-studio/lib/errors";

describe("HttpError", () => {
  it("captures status and message", () => {
    const e = new HttpError(402, "quota exhausted");
    expect(e.status).toBe(402);
    expect(e.message).toBe("quota exhausted");
    expect(e.name).toBe("HttpError");
  });

  it("isHttpError narrows the type", () => {
    const e = new HttpError(403, "forbidden");
    expect(isHttpError(e)).toBe(true);
    expect(isHttpError(new Error("plain"))).toBe(false);
    expect(isHttpError(null)).toBe(false);
    expect(isHttpError(undefined)).toBe(false);
  });

  it("preserves an optional details payload", () => {
    const issues = [{ path: ["email"], message: "required" }];
    const e = new HttpError(400, "bad input", issues);
    expect(e.details).toEqual(issues);
  });
});
```

- [ ] **Step 2: Run (expect fail)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/errors.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement**

Create `src/features/ai-studio/lib/errors.ts`:

```ts
export class HttpError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export function isHttpError(e: unknown): e is HttpError {
  return e instanceof HttpError;
}
```

- [ ] **Step 4: Run (expect pass)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/errors.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-studio/lib/errors.ts src/features/ai-studio/lib/__tests__/errors.test.ts
git commit -m "feat(studio): add HttpError shared error class"
```

---

## Task 2: Zod schemas

**Files:**

- Create: `src/features/ai-studio/lib/schemas.ts`
- Test: `src/features/ai-studio/lib/__tests__/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/ai-studio/lib/__tests__/schemas.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  RequestSubmitSchema,
  SampleCreateSchema,
  DeliverSchema,
  RejectSchema,
  CategoryEnum,
} from "@/features/ai-studio/lib/schemas";

describe("studio Zod schemas", () => {
  it("RequestSubmitSchema accepts valid input", () => {
    const ok = RequestSubmitSchema.safeParse({
      sampleId: "cuid123",
      prompt: "A short story about a cat finding its home in 90 seconds.",
      styleNotes: "Warm tone, slow pacing.",
      targetCategory: "EMOTION_STORY",
    });
    expect(ok.success).toBe(true);
  });

  it("RequestSubmitSchema rejects too-short prompt", () => {
    const result = RequestSubmitSchema.safeParse({
      sampleId: "cuid123",
      prompt: "too short",
      targetCategory: "EMOTION_STORY",
    });
    expect(result.success).toBe(false);
  });

  it("RequestSubmitSchema rejects invalid category", () => {
    const result = RequestSubmitSchema.safeParse({
      sampleId: "cuid123",
      prompt: "A".repeat(50),
      targetCategory: "BOGUS",
    });
    expect(result.success).toBe(false);
  });

  it("SampleCreateSchema requires preview URL", () => {
    const result = SampleCreateSchema.safeParse({
      title: "Demo",
      category: "VERTICAL_DRAMA",
    });
    expect(result.success).toBe(false);
  });

  it("DeliverSchema requires outputUrl + duration", () => {
    const ok = DeliverSchema.safeParse({
      outputUrl: "studio-outputs/u1/r1.mp4",
      outputDurationSec: 90,
    });
    expect(ok.success).toBe(true);
  });

  it("RejectSchema requires reason >= 5 chars", () => {
    expect(RejectSchema.safeParse({ reason: "no" }).success).toBe(false);
    expect(RejectSchema.safeParse({ reason: "needs more story setup" }).success).toBe(true);
  });

  it("CategoryEnum exposes 5 values matching Prisma enum", () => {
    expect(CategoryEnum.options).toEqual([
      "VERTICAL_DRAMA",
      "EMOTION_STORY",
      "LIFESTYLE_VLOG",
      "SUSPENSE_THRILLER",
      "OTHER",
    ]);
  });
});
```

- [ ] **Step 2: Run (expect fail)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/schemas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/ai-studio/lib/schemas.ts`:

```ts
import { z } from "zod";

export const CategoryEnum = z.enum([
  "VERTICAL_DRAMA",
  "EMOTION_STORY",
  "LIFESTYLE_VLOG",
  "SUSPENSE_THRILLER",
  "OTHER",
]);

export const RequestSubmitSchema = z.object({
  sampleId: z.string().min(1).optional(),
  prompt: z.string().min(30).max(1500),
  styleNotes: z.string().max(500).optional(),
  targetCategory: CategoryEnum,
});

export type RequestSubmitInput = z.infer<typeof RequestSubmitSchema>;

export const SampleCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: CategoryEnum,
  hook: z.string().max(200).optional(),
  previewUrl: z.string().min(1),
  thumbnailUrl: z.string().min(1).optional(),
  durationSec: z.number().int().positive().max(600).default(90),
});

export type SampleCreateInput = z.infer<typeof SampleCreateSchema>;

export const DeliverSchema = z.object({
  outputUrl: z.string().min(1),
  outputDurationSec: z.number().int().positive().max(600),
});

export type DeliverInput = z.infer<typeof DeliverSchema>;

export const RejectSchema = z.object({
  reason: z.string().min(5).max(500),
});

export type RejectInput = z.infer<typeof RejectSchema>;
```

- [ ] **Step 4: Run (expect pass)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/schemas.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-studio/lib/schemas.ts src/features/ai-studio/lib/__tests__/schemas.test.ts
git commit -m "feat(studio): add Zod schemas for studio inputs"
```

---

## Task 3: Storage helpers

**Files:**

- Create: `src/features/ai-studio/lib/storage.ts`
- Test: `src/features/ai-studio/lib/__tests__/storage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/ai-studio/lib/__tests__/storage.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: vi.fn(async (path: string, ttl: number) => ({
          data: { signedUrl: `https://signed.example/${bucket}/${path}?ttl=${ttl}` },
          error: null,
        })),
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://public.example/${bucket}/${path}` },
        })),
      }),
    },
  }),
}));

import {
  outputPathFor,
  samplePathFor,
  getSampleSignedUrl,
  getOutputSignedUrl,
  STUDIO_SAMPLES_BUCKET,
  STUDIO_OUTPUTS_BUCKET,
} from "@/features/ai-studio/lib/storage";

describe("storage helpers", () => {
  it("outputPathFor includes userId and requestId", () => {
    expect(outputPathFor({ userId: "u1", requestId: "r1" })).toBe("u1/r1.mp4");
  });

  it("samplePathFor includes sampleId and ext", () => {
    expect(samplePathFor({ sampleId: "s1", ext: "mp4" })).toBe("s1/sample.mp4");
    expect(samplePathFor({ sampleId: "s1", ext: "jpg" })).toBe("s1/thumb.jpg");
  });

  it("STUDIO_SAMPLES_BUCKET and STUDIO_OUTPUTS_BUCKET are correct constants", () => {
    expect(STUDIO_SAMPLES_BUCKET).toBe("studio-samples");
    expect(STUDIO_OUTPUTS_BUCKET).toBe("studio-outputs");
  });

  it("getSampleSignedUrl returns signed URL for samples bucket", async () => {
    const url = await getSampleSignedUrl("s1/sample.mp4");
    expect(url).toContain("studio-samples/s1/sample.mp4");
  });

  it("getOutputSignedUrl returns 7-day signed URL for outputs bucket", async () => {
    const url = await getOutputSignedUrl("u1/r1.mp4");
    expect(url).toContain("studio-outputs/u1/r1.mp4");
    expect(url).toContain(`ttl=${60 * 60 * 24 * 7}`);
  });
});
```

- [ ] **Step 2: Run (expect fail)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/storage.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/ai-studio/lib/storage.ts`:

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const STUDIO_SAMPLES_BUCKET = "studio-samples";
export const STUDIO_OUTPUTS_BUCKET = "studio-outputs";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_KEY missing");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function outputPathFor(args: { userId: string; requestId: string }): string {
  return `${args.userId}/${args.requestId}.mp4`;
}

export function samplePathFor(args: {
  sampleId: string;
  ext: "mp4" | "jpg" | "webp" | "png";
}): string {
  if (args.ext === "mp4") return `${args.sampleId}/sample.mp4`;
  return `${args.sampleId}/thumb.${args.ext}`;
}

export async function getSampleSignedUrl(path: string): Promise<string> {
  const { data, error } = await getClient()
    .storage.from(STUDIO_SAMPLES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) throw new Error(`signed URL failed for ${path}: ${error?.message}`);
  return data.signedUrl;
}

export async function getOutputSignedUrl(path: string): Promise<string> {
  const { data, error } = await getClient()
    .storage.from(STUDIO_OUTPUTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) throw new Error(`signed URL failed for ${path}: ${error?.message}`);
  return data.signedUrl;
}

export function getSamplePublicUrl(path: string): string {
  const { data } = getClient().storage.from(STUDIO_SAMPLES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
```

- [ ] **Step 4: Run (expect pass)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/storage.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-studio/lib/storage.ts src/features/ai-studio/lib/__tests__/storage.test.ts
git commit -m "feat(studio): add Supabase Storage helpers for samples + outputs"
```

---

## Task 4: Bucket creation script

**Files:**

- Create: `scripts/studio-create-buckets.js`
- Modify: `package.json` (add `studio:create-buckets` script)

This is a one-shot operational script — not a service module. No Vitest test (it's idempotent + verified by running it).

- [ ] **Step 1: Create the script**

Create `scripts/studio-create-buckets.js`:

```js
#!/usr/bin/env node
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[studio-buckets] SUPABASE_URL and SUPABASE_SERVICE_KEY required");
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const BUCKETS = [
  { id: "studio-samples", public: true, fileSizeLimit: 30 * 1024 * 1024 }, // 30MB
  { id: "studio-outputs", public: false, fileSizeLimit: 200 * 1024 * 1024 }, // 200MB
];

(async () => {
  for (const b of BUCKETS) {
    const { error } = await client.storage.createBucket(b.id, {
      public: b.public,
      fileSizeLimit: b.fileSizeLimit,
    });
    if (error && !error.message.includes("already exists")) {
      console.error(`[studio-buckets] failed to create ${b.id}: ${error.message}`);
      process.exit(1);
    }
    console.log(`[studio-buckets] ${b.id}: ${error ? "exists" : "created"}`);
  }
  console.log("[studio-buckets] done");
})();
```

- [ ] **Step 2: Add npm script**

Open `package.json`. Inside `"scripts"` add this line after `"db:seed:dev"`:

```json
    "studio:create-buckets": "node scripts/studio-create-buckets.js",
```

- [ ] **Step 3: Run the script (deferred if SUPABASE_SERVICE_KEY unset)**

The user may not have set `SUPABASE_SERVICE_KEY` yet. If unset, this step is **deferred** — note in commit message and TODO. If set, run:

```bash
npm run studio:create-buckets
```

Expected: stdout `[studio-buckets] studio-samples: created` (or `: exists`), `[studio-buckets] studio-outputs: created`, `[studio-buckets] done`.

- [ ] **Step 4: Commit**

```bash
git add scripts/studio-create-buckets.js package.json
git commit -m "feat(studio): add bucket creation script for studio-samples + studio-outputs"
```

---

## Task 5: Stripe SDK wrapper

**Files:**

- Create: `src/features/ai-studio/lib/stripe.ts`
- Test: `src/features/ai-studio/lib/__tests__/stripe.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/ai-studio/lib/__tests__/stripe.test.ts`:

```ts
import { describe, it, expect, afterEach, vi } from "vitest";

describe("stripe wrapper", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
    vi.resetModules();
  });

  it("priceIdForTier returns the env-configured ID", async () => {
    (process.env as Record<string, string | undefined>).STRIPE_PRICE_STARTER = "price_starter_test";
    (process.env as Record<string, string | undefined>).STRIPE_PRICE_PRO = "price_pro_test";
    (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY = "sk_test_x";
    const mod = await import("@/features/ai-studio/lib/stripe");
    expect(mod.priceIdForTier("STARTER")).toBe("price_starter_test");
    expect(mod.priceIdForTier("PRO")).toBe("price_pro_test");
  });

  it("priceIdForTier throws for FREE tier", async () => {
    (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY = "sk_test_x";
    const mod = await import("@/features/ai-studio/lib/stripe");
    expect(() => mod.priceIdForTier("FREE")).toThrow(/no price/i);
  });

  it("priceIdForTier throws when env var unset", async () => {
    (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY = "sk_test_x";
    delete (process.env as Record<string, string | undefined>).STRIPE_PRICE_STARTER;
    const mod = await import("@/features/ai-studio/lib/stripe");
    expect(() => mod.priceIdForTier("STARTER")).toThrow(/STRIPE_PRICE_STARTER/);
  });

  it("tierForPriceId returns matching tier", async () => {
    (process.env as Record<string, string | undefined>).STRIPE_PRICE_STARTER = "price_starter_test";
    (process.env as Record<string, string | undefined>).STRIPE_PRICE_PRO = "price_pro_test";
    (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY = "sk_test_x";
    const mod = await import("@/features/ai-studio/lib/stripe");
    expect(mod.tierForPriceId("price_starter_test")).toBe("STARTER");
    expect(mod.tierForPriceId("price_pro_test")).toBe("PRO");
    expect(mod.tierForPriceId("price_unknown")).toBe(null);
  });

  it("quotaLimitForTier returns spec'd limits", async () => {
    (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY = "sk_test_x";
    const mod = await import("@/features/ai-studio/lib/stripe");
    expect(mod.quotaLimitForTier("FREE")).toBe(1);
    expect(mod.quotaLimitForTier("STARTER")).toBe(5);
    expect(mod.quotaLimitForTier("PRO")).toBe(20);
  });
});
```

- [ ] **Step 2: Run (expect fail)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/stripe.test.ts`
Expected: FAIL.

- [ ] **Step 3: Install Stripe SDK if not present**

Run: `npm ls stripe 2>&1 | head -5`. If `stripe` is not installed, run `npm install stripe`. Otherwise skip.

- [ ] **Step 4: Implement**

Create `src/features/ai-studio/lib/stripe.ts`:

```ts
import Stripe from "stripe";

export type StudioTier = "FREE" | "STARTER" | "PRO";

const QUOTA_LIMITS: Record<StudioTier, number> = {
  FREE: 1,
  STARTER: 5,
  PRO: 20,
};

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY not set");
  client = new Stripe(secret);
  return client;
}

export function priceIdForTier(tier: StudioTier): string {
  if (tier === "FREE") {
    throw new Error("no price ID for FREE tier");
  }
  const envName = tier === "STARTER" ? "STRIPE_PRICE_STARTER" : "STRIPE_PRICE_PRO";
  const id = process.env[envName];
  if (!id) throw new Error(`${envName} not set`);
  return id;
}

export function tierForPriceId(priceId: string): StudioTier | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "STARTER";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  return null;
}

export function quotaLimitForTier(tier: StudioTier): number {
  return QUOTA_LIMITS[tier];
}

export function verifyWebhookSignature(payload: string, sigHeader: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  return getStripe().webhooks.constructEvent(payload, sigHeader, secret);
}
```

- [ ] **Step 5: Run (expect pass)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/stripe.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck` from repo root. Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/features/ai-studio/lib/stripe.ts src/features/ai-studio/lib/__tests__/stripe.test.ts package.json package-lock.json
git commit -m "feat(studio): add Stripe SDK wrapper with tier/price helpers"
```

---

## Task 6: Sample CRUD service

**Files:**

- Create: `src/features/ai-studio/lib/samples.ts`
- Test: `src/features/ai-studio/lib/__tests__/samples.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/ai-studio/lib/__tests__/samples.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sample: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  listSamples,
  getSample,
  createSample,
  archiveSample,
} from "@/features/ai-studio/lib/samples";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("samples service", () => {
  it("listSamples filters by category and isActive=true by default", async () => {
    (prisma.sample.findMany as any).mockResolvedValue([]);
    await listSamples({ category: "EMOTION_STORY", limit: 12 });
    const args = (prisma.sample.findMany as any).mock.calls[0][0];
    expect(args.where).toEqual({ category: "EMOTION_STORY", isActive: true });
    expect(args.take).toBe(12);
    expect(args.orderBy).toEqual({ createdAt: "desc" });
  });

  it("listSamples cursor-paginates with cursorId", async () => {
    (prisma.sample.findMany as any).mockResolvedValue([]);
    await listSamples({ limit: 12, cursorId: "abc123" });
    const args = (prisma.sample.findMany as any).mock.calls[0][0];
    expect(args.skip).toBe(1);
    expect(args.cursor).toEqual({ id: "abc123" });
  });

  it("getSample returns row by id", async () => {
    (prisma.sample.findUnique as any).mockResolvedValue({ id: "s1", title: "Demo" });
    const result = await getSample("s1");
    expect(result?.id).toBe("s1");
  });

  it("createSample writes uploadedBy and defaults durationSec=90", async () => {
    (prisma.sample.create as any).mockResolvedValue({ id: "s1" });
    await createSample({
      input: {
        title: "Demo",
        category: "VERTICAL_DRAMA",
        previewUrl: "studio-samples/s1/sample.mp4",
        durationSec: 90,
      },
      uploadedById: "admin-1",
    });
    const args = (prisma.sample.create as any).mock.calls[0][0];
    expect(args.data.uploadedById).toBe("admin-1");
    expect(args.data.durationSec).toBe(90);
    expect(args.data.title).toBe("Demo");
  });

  it("archiveSample sets isActive=false", async () => {
    (prisma.sample.update as any).mockResolvedValue({ id: "s1", isActive: false });
    await archiveSample("s1");
    const args = (prisma.sample.update as any).mock.calls[0][0];
    expect(args.where).toEqual({ id: "s1" });
    expect(args.data).toEqual({ isActive: false });
  });
});
```

- [ ] **Step 2: Run (expect fail)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/samples.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/ai-studio/lib/samples.ts`:

```ts
import { prisma } from "@/lib/prisma";
import type { SampleCategory } from "@prisma/client";
import type { SampleCreateInput } from "@/features/ai-studio/lib/schemas";

export interface ListSamplesArgs {
  category?: SampleCategory;
  limit?: number;
  cursorId?: string;
  includeInactive?: boolean;
}

export async function listSamples(args: ListSamplesArgs) {
  const limit = args.limit ?? 12;
  return prisma.sample.findMany({
    where: {
      ...(args.category ? { category: args.category } : {}),
      ...(args.includeInactive ? {} : { isActive: true }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(args.cursorId ? { skip: 1, cursor: { id: args.cursorId } } : {}),
  });
}

export async function getSample(id: string) {
  return prisma.sample.findUnique({ where: { id } });
}

export async function createSample(args: { input: SampleCreateInput; uploadedById: string }) {
  return prisma.sample.create({
    data: {
      title: args.input.title,
      description: args.input.description,
      category: args.input.category,
      hook: args.input.hook,
      previewUrl: args.input.previewUrl,
      thumbnailUrl: args.input.thumbnailUrl,
      durationSec: args.input.durationSec,
      uploadedById: args.uploadedById,
    },
  });
}

export async function archiveSample(id: string) {
  return prisma.sample.update({
    where: { id },
    data: { isActive: false },
  });
}
```

- [ ] **Step 4: Run (expect pass)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/samples.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-studio/lib/samples.ts src/features/ai-studio/lib/__tests__/samples.test.ts
git commit -m "feat(studio): add sample CRUD service"
```

---

## Task 7: Quota service (atomic deduct + refund)

**Files:**

- Create: `src/features/ai-studio/lib/quota.ts`
- Test: `src/features/ai-studio/lib/__tests__/quota.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/ai-studio/lib/__tests__/quota.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const txMock = {
  $queryRaw: vi.fn(),
  subscription: {
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (tx: typeof txMock) => unknown) => cb(txMock)),
  },
}));

import { deductQuota, refundQuota } from "@/features/ai-studio/lib/quota";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deductQuota", () => {
  it("throws 402 when quota exhausted", async () => {
    txMock.$queryRaw.mockResolvedValue([
      {
        id: "sub1",
        quotaUsed: 5,
        quotaLimit: 5,
        periodEnd: new Date(Date.now() + 86_400_000),
      },
    ]);
    await expect(deductQuota({ userId: "u1" })).rejects.toMatchObject({
      status: 402,
    });
  });

  it("throws 403 when no subscription", async () => {
    txMock.$queryRaw.mockResolvedValue([]);
    await expect(deductQuota({ userId: "u1" })).rejects.toMatchObject({
      status: 403,
    });
  });

  it("throws 409 when period expired", async () => {
    txMock.$queryRaw.mockResolvedValue([
      {
        id: "sub1",
        quotaUsed: 0,
        quotaLimit: 5,
        periodEnd: new Date(Date.now() - 86_400_000),
      },
    ]);
    await expect(deductQuota({ userId: "u1" })).rejects.toMatchObject({
      status: 409,
    });
  });

  it("increments quotaUsed and returns subscriptionId on success", async () => {
    txMock.$queryRaw.mockResolvedValue([
      {
        id: "sub1",
        quotaUsed: 2,
        quotaLimit: 5,
        periodEnd: new Date(Date.now() + 86_400_000),
      },
    ]);
    txMock.subscription.update.mockResolvedValue({ id: "sub1", quotaUsed: 3 });
    const result = await deductQuota({ userId: "u1" });
    expect(result.subscriptionId).toBe("sub1");
    expect(txMock.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub1" },
      data: { quotaUsed: { increment: 1 } },
    });
  });
});

describe("refundQuota", () => {
  it("decrements quotaUsed when subscription period unchanged", async () => {
    const periodStart = new Date(Date.now() - 2000);
    txMock.$queryRaw.mockResolvedValue([
      {
        id: "sub1",
        periodStart,
      },
    ]);
    await refundQuota({
      subscriptionId: "sub1",
      requestCreatedAt: new Date(Date.now() - 1000),
      periodStartAtCreation: periodStart,
    });
    expect(txMock.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub1" },
      data: { quotaUsed: { decrement: 1 } },
    });
  });

  it("does NOT decrement when period rolled over since request", async () => {
    const oldPeriodStart = new Date(Date.now() - 60 * 86_400_000);
    txMock.$queryRaw.mockResolvedValue([
      {
        id: "sub1",
        periodStart: new Date(),
      },
    ]);
    await refundQuota({
      subscriptionId: "sub1",
      requestCreatedAt: new Date(Date.now() - 60 * 86_400_000),
      periodStartAtCreation: oldPeriodStart,
    });
    expect(txMock.subscription.update).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run (expect fail)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/quota.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/ai-studio/lib/quota.ts`:

```ts
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/features/ai-studio/lib/errors";

export interface DeductResult {
  subscriptionId: string;
  quotaUsedAfter: number;
}

export async function deductQuota(args: { userId: string }): Promise<DeductResult> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{ id: string; quotaUsed: number; quotaLimit: number; periodEnd: Date }>
    >`SELECT id, "quotaUsed", "quotaLimit", "periodEnd"
        FROM "Subscription"
       WHERE "userId" = ${args.userId}
       FOR UPDATE`;

    if (rows.length === 0) {
      throw new HttpError(403, "no subscription");
    }
    const sub = rows[0];
    if (sub.periodEnd.getTime() < Date.now()) {
      throw new HttpError(409, "subscription period expired");
    }
    if (sub.quotaUsed >= sub.quotaLimit) {
      throw new HttpError(402, "quota exhausted");
    }

    const updated = await tx.subscription.update({
      where: { id: sub.id },
      data: { quotaUsed: { increment: 1 } },
    });

    return { subscriptionId: sub.id, quotaUsedAfter: updated.quotaUsed };
  });
}

export interface RefundArgs {
  subscriptionId: string;
  requestCreatedAt: Date;
  periodStartAtCreation: Date;
}

export async function refundQuota(args: RefundArgs): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string; periodStart: Date }>>`
      SELECT id, "periodStart"
        FROM "Subscription"
       WHERE id = ${args.subscriptionId}
       FOR UPDATE`;
    if (rows.length === 0) return;
    const current = rows[0];
    if (current.periodStart.getTime() !== args.periodStartAtCreation.getTime()) {
      return;
    }
    await tx.subscription.update({
      where: { id: args.subscriptionId },
      data: { quotaUsed: { decrement: 1 } },
    });
  });
}
```

- [ ] **Step 4: Run (expect pass)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/quota.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-studio/lib/quota.ts src/features/ai-studio/lib/__tests__/quota.test.ts
git commit -m "feat(studio): atomic quota deduct + refund with row lock"
```

---

## Task 8: Request state machine

**Files:**

- Create: `src/features/ai-studio/lib/requests.ts`
- Test: `src/features/ai-studio/lib/__tests__/requests.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/ai-studio/lib/__tests__/requests.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    videoRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/features/ai-studio/lib/quota", () => ({
  deductQuota: vi.fn(),
  refundQuota: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { deductQuota, refundQuota } from "@/features/ai-studio/lib/quota";
import {
  isValidTransition,
  submitRequest,
  claimRequest,
  deliverRequest,
  rejectRequest,
  failRequest,
} from "@/features/ai-studio/lib/requests";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isValidTransition", () => {
  it("allows PENDING → IN_PROGRESS", () => {
    expect(isValidTransition("PENDING", "IN_PROGRESS")).toBe(true);
  });
  it("allows IN_PROGRESS → DELIVERED|REJECTED|FAILED|PENDING", () => {
    expect(isValidTransition("IN_PROGRESS", "DELIVERED")).toBe(true);
    expect(isValidTransition("IN_PROGRESS", "REJECTED")).toBe(true);
    expect(isValidTransition("IN_PROGRESS", "FAILED")).toBe(true);
    expect(isValidTransition("IN_PROGRESS", "PENDING")).toBe(true);
  });
  it("rejects DELIVERED → anything", () => {
    expect(isValidTransition("DELIVERED", "REJECTED")).toBe(false);
    expect(isValidTransition("DELIVERED", "DELIVERED")).toBe(false);
  });
  it("rejects PENDING → DELIVERED (must claim first)", () => {
    expect(isValidTransition("PENDING", "DELIVERED")).toBe(false);
  });
});

describe("submitRequest", () => {
  it("deducts quota and creates request", async () => {
    (deductQuota as any).mockResolvedValue({ subscriptionId: "sub1", quotaUsedAfter: 1 });
    (prisma.videoRequest.create as any).mockResolvedValue({ id: "r1", status: "PENDING" });
    const result = await submitRequest({
      creatorId: "u1",
      input: {
        prompt: "A".repeat(50),
        targetCategory: "EMOTION_STORY",
        sampleId: "s1",
      },
    });
    expect(deductQuota).toHaveBeenCalledWith({ userId: "u1" });
    expect(result.id).toBe("r1");
  });
});

describe("claimRequest", () => {
  it("requires status PENDING", async () => {
    (prisma.videoRequest.findUnique as any).mockResolvedValue({
      id: "r1",
      status: "DELIVERED",
    });
    await expect(claimRequest({ requestId: "r1", adminId: "a1" })).rejects.toMatchObject({
      status: 409,
    });
  });
  it("transitions PENDING → IN_PROGRESS with claimedBy/claimedAt", async () => {
    (prisma.videoRequest.findUnique as any).mockResolvedValue({ id: "r1", status: "PENDING" });
    (prisma.videoRequest.update as any).mockResolvedValue({
      id: "r1",
      status: "IN_PROGRESS",
    });
    await claimRequest({ requestId: "r1", adminId: "a1" });
    const args = (prisma.videoRequest.update as any).mock.calls[0][0];
    expect(args.data.status).toBe("IN_PROGRESS");
    expect(args.data.claimedById).toBe("a1");
    expect(args.data.claimedAt).toBeInstanceOf(Date);
  });
});

describe("deliverRequest", () => {
  it("requires status IN_PROGRESS", async () => {
    (prisma.videoRequest.findUnique as any).mockResolvedValue({
      id: "r1",
      status: "PENDING",
    });
    await expect(
      deliverRequest({
        requestId: "r1",
        outputUrl: "studio-outputs/u1/r1.mp4",
        outputDurationSec: 90,
      })
    ).rejects.toMatchObject({ status: 409 });
  });
  it("transitions IN_PROGRESS → DELIVERED with output fields", async () => {
    (prisma.videoRequest.findUnique as any).mockResolvedValue({
      id: "r1",
      status: "IN_PROGRESS",
    });
    (prisma.videoRequest.update as any).mockResolvedValue({
      id: "r1",
      status: "DELIVERED",
    });
    await deliverRequest({
      requestId: "r1",
      outputUrl: "studio-outputs/u1/r1.mp4",
      outputDurationSec: 90,
    });
    const args = (prisma.videoRequest.update as any).mock.calls[0][0];
    expect(args.data.status).toBe("DELIVERED");
    expect(args.data.outputUrl).toBe("studio-outputs/u1/r1.mp4");
    expect(args.data.deliveredAt).toBeInstanceOf(Date);
  });
});

describe("rejectRequest", () => {
  it("refunds quota and sets rejectionReason", async () => {
    (prisma.videoRequest.findUnique as any)
      .mockResolvedValueOnce({ id: "r1", status: "IN_PROGRESS" })
      .mockResolvedValueOnce({
        id: "r1",
        subscriptionId: "sub1",
        createdAt: new Date(),
        subscription: { periodStart: new Date() },
      });
    (prisma.videoRequest.update as any).mockResolvedValue({ id: "r1", status: "REJECTED" });
    await rejectRequest({ requestId: "r1", reason: "needs more story setup" });
    expect(refundQuota).toHaveBeenCalled();
    const args = (prisma.videoRequest.update as any).mock.calls[0][0];
    expect(args.data.status).toBe("REJECTED");
    expect(args.data.rejectionReason).toBe("needs more story setup");
    expect(args.data.quotaConsumed).toBe(false);
  });
});

describe("failRequest", () => {
  it("refunds quota and sets canned reason", async () => {
    (prisma.videoRequest.findUnique as any)
      .mockResolvedValueOnce({ id: "r1", status: "IN_PROGRESS" })
      .mockResolvedValueOnce({
        id: "r1",
        subscriptionId: "sub1",
        createdAt: new Date(),
        subscription: { periodStart: new Date() },
      });
    (prisma.videoRequest.update as any).mockResolvedValue({ id: "r1", status: "FAILED" });
    await failRequest({ requestId: "r1" });
    const args = (prisma.videoRequest.update as any).mock.calls[0][0];
    expect(args.data.status).toBe("FAILED");
    expect(args.data.rejectionReason).toMatch(/generation failed/i);
  });
});
```

- [ ] **Step 2: Run (expect fail)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/requests.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/features/ai-studio/lib/requests.ts`:

```ts
import { prisma } from "@/lib/prisma";
import type { VideoRequestStatus } from "@prisma/client";
import { HttpError } from "@/features/ai-studio/lib/errors";
import { deductQuota, refundQuota } from "@/features/ai-studio/lib/quota";
import type { RequestSubmitInput } from "@/features/ai-studio/lib/schemas";

const TRANSITIONS: Record<VideoRequestStatus, ReadonlySet<VideoRequestStatus>> = {
  PENDING: new Set(["IN_PROGRESS"]),
  IN_PROGRESS: new Set(["DELIVERED", "REJECTED", "FAILED", "PENDING"]),
  DELIVERED: new Set([]),
  REJECTED: new Set([]),
  FAILED: new Set([]),
};

export function isValidTransition(from: VideoRequestStatus, to: VideoRequestStatus): boolean {
  return TRANSITIONS[from].has(to);
}

export async function submitRequest(args: { creatorId: string; input: RequestSubmitInput }) {
  const deduction = await deductQuota({ userId: args.creatorId });

  return prisma.videoRequest.create({
    data: {
      creatorId: args.creatorId,
      sampleId: args.input.sampleId,
      prompt: args.input.prompt,
      styleNotes: args.input.styleNotes,
      targetCategory: args.input.targetCategory,
      status: "PENDING",
      subscriptionId: deduction.subscriptionId,
      quotaConsumed: true,
    },
  });
}

async function assertCurrentStatus(requestId: string, expected: VideoRequestStatus) {
  const row = await prisma.videoRequest.findUnique({ where: { id: requestId } });
  if (!row) throw new HttpError(404, "request not found");
  if (row.status !== expected) {
    throw new HttpError(409, `cannot transition from ${row.status}`);
  }
  return row;
}

export async function claimRequest(args: { requestId: string; adminId: string }) {
  await assertCurrentStatus(args.requestId, "PENDING");
  return prisma.videoRequest.update({
    where: { id: args.requestId },
    data: {
      status: "IN_PROGRESS",
      claimedById: args.adminId,
      claimedAt: new Date(),
    },
  });
}

export async function deliverRequest(args: {
  requestId: string;
  outputUrl: string;
  outputDurationSec: number;
}) {
  await assertCurrentStatus(args.requestId, "IN_PROGRESS");
  return prisma.videoRequest.update({
    where: { id: args.requestId },
    data: {
      status: "DELIVERED",
      outputUrl: args.outputUrl,
      outputDurationSec: args.outputDurationSec,
      deliveredAt: new Date(),
    },
  });
}

async function refundIfApplicable(requestId: string) {
  const row = await prisma.videoRequest.findUnique({
    where: { id: requestId },
    include: { subscription: true },
  });
  if (!row?.subscriptionId || !row.subscription) return;
  await refundQuota({
    subscriptionId: row.subscriptionId,
    requestCreatedAt: row.createdAt,
    periodStartAtCreation: row.subscription.periodStart,
  });
}

export async function rejectRequest(args: { requestId: string; reason: string }) {
  await assertCurrentStatus(args.requestId, "IN_PROGRESS");
  await refundIfApplicable(args.requestId);
  return prisma.videoRequest.update({
    where: { id: args.requestId },
    data: {
      status: "REJECTED",
      rejectionReason: args.reason,
      quotaConsumed: false,
    },
  });
}

export async function failRequest(args: { requestId: string }) {
  await assertCurrentStatus(args.requestId, "IN_PROGRESS");
  await refundIfApplicable(args.requestId);
  return prisma.videoRequest.update({
    where: { id: args.requestId },
    data: {
      status: "FAILED",
      rejectionReason: "generation failed",
      quotaConsumed: false,
    },
  });
}

export async function listRequestsForCreator(args: { creatorId: string; limit?: number }) {
  return prisma.videoRequest.findMany({
    where: { creatorId: args.creatorId },
    orderBy: { createdAt: "desc" },
    take: args.limit ?? 50,
    include: { sample: true },
  });
}

export async function listAdminQueue(args: { limit?: number }) {
  return prisma.videoRequest.findMany({
    where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    orderBy: { createdAt: "asc" },
    take: args.limit ?? 50,
    include: { sample: true, creator: true },
  });
}
```

- [ ] **Step 4: Run (expect pass)**

Run: `npx vitest run src/features/ai-studio/lib/__tests__/requests.test.ts`
Expected: PASS, all tests.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`. Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/ai-studio/lib/requests.ts src/features/ai-studio/lib/__tests__/requests.test.ts
git commit -m "feat(studio): request state machine + transitions"
```

---

## Task 9: Sanity check + push

- [ ] **Step 1: Run full pre-push harness**

Run: `npm run harness:prepush`
Expected: typecheck + lint + all vitest tests pass; ruff + mypy clean.

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

Expected: pre-push hook reruns harness:prepush; push succeeds.

---

## Definition of Done (Plan B1)

- [ ] All 9 tasks committed.
- [ ] `npm run harness:prepush` passes.
- [ ] All new vitest tests under `src/features/ai-studio/lib/__tests__/` pass.
- [ ] `src/features/ai-studio/lib/` exports: `HttpError`, `isHttpError`, `RequestSubmitSchema`, `SampleCreateSchema`, `DeliverSchema`, `RejectSchema`, `CategoryEnum`, storage helpers (constants + path generators + signed URL functions), Stripe wrapper (`getStripe`, `priceIdForTier`, `tierForPriceId`, `quotaLimitForTier`, `verifyWebhookSignature`), sample CRUD (`listSamples`, `getSample`, `createSample`, `archiveSample`), quota helpers (`deductQuota`, `refundQuota`), request state machine (`isValidTransition`, `submitRequest`, `claimRequest`, `deliverRequest`, `rejectRequest`, `failRequest`, `listRequestsForCreator`, `listAdminQueue`).
- [ ] Bucket creation script committed; runs cleanly when `SUPABASE_SERVICE_KEY` is set.

---

## Self-review

- **Spec coverage:** Plan B1 implements spec §4 (lib/ structure), §5 (Prisma model usage — already created in Plan A), §6 (state machine), §8 (quota atomicity).
- **Placeholder scan:** No TBD/TODO/"add appropriate". All test bodies + implementation complete.
- **Type consistency:** `HttpError.status` is `number` everywhere. `VideoRequestStatus` from Prisma is the same type used in transitions map and `claimRequest`/`deliverRequest` checks. `RequestSubmitInput` exported from schemas.ts and used by `submitRequest`. `SampleCreateInput` similarly.
- **Module isolation:** Each lib file imports only Prisma client + schemas + errors. No cross-coupling between samples/quota/requests except `requests.ts` → `quota.ts` (necessary).

---

## Plan B2/B3 preview

- **Plan B2 — API routes (Sprint 3):** `/api/studio/samples`, `/api/studio/requests`, claim/deliver/reject/fail endpoints, billing checkout/portal, Stripe webhook with idempotency. All routes thin: validate via Zod schemas → call service → map `HttpError` to status codes.
- **Plan B3 — Creator UI (Sprint 4):** `/studio` landing, gallery, sample detail, "My Videos", billing page, plus shared components (`SampleCard`, `QuotaBadge`, `StatusBadge`, `RequestForm`).
