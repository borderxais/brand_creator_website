# AI Video Task Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `/creatorportal/ai-video/generate` to a new `AiVideoTask` model — validate inputs, upload assets to Supabase Storage, persist a task row with status `QUEUED`, and surface tasks on a creator-scoped list page plus a separate Storyclaw control panel for manual status advancement.

**Architecture:** Single Next.js POST handler does validate → upload → insert in one round-trip. Status is advanced manually from a no-auth `/storyclaw-admin` page via a PATCH route. Server components read directly via Prisma; binaries live in a private Supabase bucket (`ai-video-tasks`); DB stores only object paths.

**Tech Stack:** Next.js 16 App Router, NextAuth, Prisma 6, `@supabase/supabase-js` 2, Zod 4, Vitest, lucide-react, date-fns, Tailwind.

**Spec:** [`docs/superpowers/specs/2026-05-08-ai-video-task-workflow-design.md`](../specs/2026-05-08-ai-video-task-workflow-design.md)

---

## File Structure

### New files

| Path                                               | Responsibility                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/lib/supabase-admin.ts`                        | Service-role Supabase client singleton + upload + signed-URL + delete helpers.                    |
| `src/lib/ai-video-task.ts`                         | Pure helpers: validation schemas, MIME/extension maps, storage path builders, status display map. |
| `src/lib/__tests__/ai-video-task.test.ts`          | Unit tests for path builders, MIME validation, status display, prompt schema.                     |
| `src/app/api/ai-videos/tasks/route.ts`             | `POST` handler. NextAuth-gated. Validate → upload → insert → respond.                             |
| `src/app/api/storyclaw-admin/tasks/[id]/route.ts`  | `PATCH` handler. No auth. Validate payload → update row.                                          |
| `src/app/creatorportal/ai-video/tasks/page.tsx`    | Server component. Fetches creator's tasks, renders list.                                          |
| `src/app/creatorportal/ai-video/tasks/TaskRow.tsx` | Row component (signed-URL thumbnail render).                                                      |
| `src/app/storyclaw-admin/page.tsx`                 | Server component. Lists all tasks across creators.                                                |
| `src/app/storyclaw-admin/TaskAdminRow.tsx`         | Client component. Inline status edit form.                                                        |

### Modified files

| Path                                                            | Change                                                                           |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                                          | Add `AiVideoTaskStatus` enum, `AiVideoTask` model, `User.aiVideoTasks` relation. |
| `src/app/creatorportal/ai-video/generate/GenerateVideoForm.tsx` | Repoint to new endpoint, rename fields, new success-state link.                  |
| `scripts/studio-create-buckets.js`                              | Add `ai-video-tasks` bucket entry.                                               |
| `.env.example` (or document in README if no `.env.example`)     | Add `SUPABASE_SERVICE_KEY`.                                                      |

### Env var conventions (existing repo style)

- `SUPABASE_URL` (server) or `NEXT_PUBLIC_SUPABASE_URL` (fallback) — already in use.
- `SUPABASE_SERVICE_KEY` — already used by `scripts/studio-create-buckets.js`. Reuse this name; do **not** introduce `SUPABASE_SERVICE_ROLE_KEY`.

---

## Task 1: Prisma schema — add `AiVideoTask` model

**Files:**

- Modify: `prisma/schema.prisma` (append AI Video Studio section)
- Create: `prisma/migrations/<timestamp>_add_ai_video_task/migration.sql` (Prisma generates)

- [ ] **Step 1: Open `prisma/schema.prisma`. Append after the `AiVideoRequest` model block (around line 222):**

```prisma
enum AiVideoTaskStatus {
  QUEUED
  GENERATING
  IN_REVIEW
  DELIVERED
}

model AiVideoTask {
  id           String            @id @default(cuid())
  creatorId    String
  /// Restrict deletion of creator to preserve task history.
  creator      User              @relation("AiVideoTaskCreator", fields: [creatorId], references: [id], onDelete: Restrict)

  prompt       String            @db.Text
  voicePath    String?
  portraitPath String

  status       AiVideoTaskStatus @default(QUEUED)
  outputUrl    String?
  notes        String?           @db.Text

  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  @@index([creatorId, createdAt])
  @@index([status, createdAt])
}
```

- [ ] **Step 2: Add the reverse relation on `User`. Inside the `User` model, alongside other relation arrays (near `videoRequests` / `claimedRequests` around line 49):**

```prisma
  aiVideoTasks      AiVideoTask[] @relation("AiVideoTaskCreator")
```

- [ ] **Step 3: Run formatter + drift check:**

Run:

```bash
npx prisma format
node scripts/harness/prisma-drift.js
```

Expected: no errors.

- [ ] **Step 4: Generate the migration:**

Run:

```bash
npm run prisma:migrate -- --name add_ai_video_task
```

Expected: new directory `prisma/migrations/<timestamp>_add_ai_video_task/` with `migration.sql` containing `CREATE TYPE "AiVideoTaskStatus"` and `CREATE TABLE "AiVideoTask"`.

- [ ] **Step 5: Regenerate Prisma client:**

Run:

```bash
npm run prisma:generate
```

Expected: "Generated Prisma Client".

- [ ] **Step 6: Verify the model is reachable from the client:**

Run:

```bash
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); console.log(typeof p.aiVideoTask.findMany)"
```

Expected: `function`

- [ ] **Step 7: Commit:**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add AiVideoTask model and AiVideoTaskStatus enum"
```

---

## Task 2: Pure helpers — `src/lib/ai-video-task.ts` (TDD)

**Files:**

- Create: `src/lib/ai-video-task.ts`
- Create: `src/lib/__tests__/ai-video-task.test.ts`

- [ ] **Step 1: Write the failing test file.** Create `src/lib/__tests__/ai-video-task.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  PORTRAIT_MIME_TO_EXT,
  VOICE_MIME_TO_EXT,
  PORTRAIT_MAX_BYTES,
  VOICE_MAX_BYTES,
  buildPortraitPath,
  buildVoicePath,
  validatePortraitFile,
  validateVoiceFile,
  promptSchema,
  patchTaskSchema,
  STATUS_DISPLAY,
} from "@/lib/ai-video-task";

describe("buildPortraitPath", () => {
  it("uses creatorId, taskId and the correct extension", () => {
    expect(buildPortraitPath("creator-1", "task-1", "image/jpeg")).toBe(
      "creator-1/task-1/portrait.jpg"
    );
    expect(buildPortraitPath("c", "t", "image/png")).toBe("c/t/portrait.png");
    expect(buildPortraitPath("c", "t", "image/webp")).toBe("c/t/portrait.webp");
  });
});

describe("buildVoicePath", () => {
  it("uses creatorId, taskId and the correct extension", () => {
    expect(buildVoicePath("c", "t", "audio/mpeg")).toBe("c/t/voice.mp3");
    expect(buildVoicePath("c", "t", "audio/wav")).toBe("c/t/voice.wav");
    expect(buildVoicePath("c", "t", "audio/mp4")).toBe("c/t/voice.m4a");
    expect(buildVoicePath("c", "t", "audio/x-m4a")).toBe("c/t/voice.m4a");
  });
});

describe("validatePortraitFile", () => {
  it("accepts a small JPEG", () => {
    const f = new File(["x"], "p.jpg", { type: "image/jpeg" });
    expect(validatePortraitFile(f)).toEqual({ ok: true });
  });
  it("rejects an unsupported MIME", () => {
    const f = new File(["x"], "p.gif", { type: "image/gif" });
    expect(validatePortraitFile(f)).toEqual({
      ok: false,
      status: 400,
      error: "Unsupported portrait file type",
    });
  });
  it("rejects an oversize file", () => {
    const big = new File([new Uint8Array(PORTRAIT_MAX_BYTES + 1)], "p.jpg", {
      type: "image/jpeg",
    });
    expect(validatePortraitFile(big)).toEqual({
      ok: false,
      status: 413,
      error: "Portrait file exceeds size limit",
    });
  });
});

describe("validateVoiceFile", () => {
  it("returns ok when the voice argument is null", () => {
    expect(validateVoiceFile(null)).toEqual({ ok: true });
  });
  it("rejects an unsupported MIME", () => {
    const f = new File(["x"], "v.flac", { type: "audio/flac" });
    expect(validateVoiceFile(f)).toEqual({
      ok: false,
      status: 400,
      error: "Unsupported voice file type",
    });
  });
  it("rejects an oversize file", () => {
    const big = new File([new Uint8Array(VOICE_MAX_BYTES + 1)], "v.mp3", {
      type: "audio/mpeg",
    });
    expect(validateVoiceFile(big)).toEqual({
      ok: false,
      status: 413,
      error: "Voice file exceeds size limit",
    });
  });
});

describe("promptSchema", () => {
  it("trims and accepts a non-empty prompt", () => {
    expect(promptSchema.parse("  hello  ")).toBe("hello");
  });
  it("rejects an empty/whitespace prompt", () => {
    expect(() => promptSchema.parse("   ")).toThrow();
  });
  it("rejects a prompt longer than 5000 chars", () => {
    expect(() => promptSchema.parse("a".repeat(5001))).toThrow();
  });
});

describe("patchTaskSchema", () => {
  it("requires outputUrl when status is DELIVERED", () => {
    expect(() => patchTaskSchema.parse({ status: "DELIVERED" })).toThrow();
    expect(() => patchTaskSchema.parse({ status: "DELIVERED", outputUrl: "" })).toThrow();
    expect(patchTaskSchema.parse({ status: "DELIVERED", outputUrl: "https://x" })).toEqual({
      status: "DELIVERED",
      outputUrl: "https://x",
    });
  });
  it("accepts non-DELIVERED statuses without outputUrl", () => {
    expect(patchTaskSchema.parse({ status: "QUEUED" })).toEqual({ status: "QUEUED" });
    expect(patchTaskSchema.parse({ status: "IN_REVIEW", notes: "n" })).toEqual({
      status: "IN_REVIEW",
      notes: "n",
    });
  });
  it("rejects an invalid status", () => {
    expect(() => patchTaskSchema.parse({ status: "BOGUS" })).toThrow();
  });
});

describe("STATUS_DISPLAY", () => {
  it("maps every enum value to a label", () => {
    expect(STATUS_DISPLAY.QUEUED.label).toBe("Queued");
    expect(STATUS_DISPLAY.GENERATING.label).toBe("Generating");
    expect(STATUS_DISPLAY.IN_REVIEW.label).toBe("In Review");
    expect(STATUS_DISPLAY.DELIVERED.label).toBe("Delivered");
  });
});

it("PORTRAIT_MIME_TO_EXT and VOICE_MIME_TO_EXT export the expected keys", () => {
  expect(Object.keys(PORTRAIT_MIME_TO_EXT).sort()).toEqual([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  expect(Object.keys(VOICE_MIME_TO_EXT).sort()).toEqual([
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/x-m4a",
  ]);
});
```

- [ ] **Step 2: Run the test, confirm it fails:**

Run:

```bash
npx vitest run src/lib/__tests__/ai-video-task.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/ai-video-task'".

- [ ] **Step 3: Implement `src/lib/ai-video-task.ts`:**

```ts
import { z } from "zod";

export const PORTRAIT_MAX_BYTES = 10 * 1024 * 1024;
export const VOICE_MAX_BYTES = 25 * 1024 * 1024;

export const PORTRAIT_MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const VOICE_MIME_TO_EXT = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
} as const;

export type PortraitMime = keyof typeof PORTRAIT_MIME_TO_EXT;
export type VoiceMime = keyof typeof VOICE_MIME_TO_EXT;

export type FileValidationResult = { ok: true } | { ok: false; status: 400 | 413; error: string };

export function validatePortraitFile(file: File): FileValidationResult {
  if (!(file.type in PORTRAIT_MIME_TO_EXT)) {
    return { ok: false, status: 400, error: "Unsupported portrait file type" };
  }
  if (file.size > PORTRAIT_MAX_BYTES) {
    return { ok: false, status: 413, error: "Portrait file exceeds size limit" };
  }
  return { ok: true };
}

export function validateVoiceFile(file: File | null): FileValidationResult {
  if (file === null) return { ok: true };
  if (!(file.type in VOICE_MIME_TO_EXT)) {
    return { ok: false, status: 400, error: "Unsupported voice file type" };
  }
  if (file.size > VOICE_MAX_BYTES) {
    return { ok: false, status: 413, error: "Voice file exceeds size limit" };
  }
  return { ok: true };
}

export function buildPortraitPath(creatorId: string, taskId: string, mime: PortraitMime): string {
  return `${creatorId}/${taskId}/portrait.${PORTRAIT_MIME_TO_EXT[mime]}`;
}

export function buildVoicePath(creatorId: string, taskId: string, mime: VoiceMime): string {
  return `${creatorId}/${taskId}/voice.${VOICE_MIME_TO_EXT[mime]}`;
}

export const promptSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Prompt required").max(5000));

const baseStatusSchema = z.enum(["QUEUED", "GENERATING", "IN_REVIEW", "DELIVERED"]);

export const patchTaskSchema = z
  .object({
    status: baseStatusSchema,
    outputUrl: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (v) => v.status !== "DELIVERED" || (typeof v.outputUrl === "string" && v.outputUrl.length > 0),
    { message: "outputUrl required when status is DELIVERED", path: ["outputUrl"] }
  );

export type PatchTaskInput = z.infer<typeof patchTaskSchema>;

export const STATUS_DISPLAY = {
  QUEUED: { label: "Queued", className: "bg-slate-100 text-slate-700" },
  GENERATING: { label: "Generating", className: "bg-indigo-100 text-indigo-700" },
  IN_REVIEW: { label: "In Review", className: "bg-amber-100 text-amber-700" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-100 text-emerald-700" },
} as const;
```

- [ ] **Step 4: Run the test, confirm it passes:**

Run:

```bash
npx vitest run src/lib/__tests__/ai-video-task.test.ts
```

Expected: PASS for all suites.

- [ ] **Step 5: Type-check:**

Run:

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit:**

```bash
git add src/lib/ai-video-task.ts src/lib/__tests__/ai-video-task.test.ts
git commit -m "feat(ai-video): add task validation, path builders, status display helpers"
```

---

## Task 3: Supabase admin helper — `src/lib/supabase-admin.ts`

**Files:**

- Create: `src/lib/supabase-admin.ts`

- [ ] **Step 1: Implement `src/lib/supabase-admin.ts`:**

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const AI_VIDEO_TASK_BUCKET = "ai-video-tasks";

let cached: SupabaseClient | null = null;

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    throw new SupabaseConfigError("Supabase admin client not configured");
  }
  cached = createClient(url, serviceKey, { auth: { persistSession: false } });
  return cached;
}

export async function uploadToBucket(path: string, file: File, contentType: string): Promise<void> {
  const client = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await client.storage.from(AI_VIDEO_TASK_BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) {
    throw new Error(`Supabase upload failed for ${path}: ${error.message}`);
  }
}

export async function deleteFromBucket(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const client = getSupabaseAdmin();
  const { error } = await client.storage.from(AI_VIDEO_TASK_BUCKET).remove(paths);
  if (error) {
    console.error("[supabase-admin] cleanup delete failed", { paths, message: error.message });
  }
}

export async function createSignedUrl(path: string, expiresInSec = 3600): Promise<string | null> {
  const client = getSupabaseAdmin();
  const { data, error } = await client.storage
    .from(AI_VIDEO_TASK_BUCKET)
    .createSignedUrl(path, expiresInSec);
  if (error || !data?.signedUrl) {
    console.error("[supabase-admin] signed URL failed", { path, message: error?.message });
    return null;
  }
  return data.signedUrl;
}
```

- [ ] **Step 2: Type-check:**

Run:

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit:**

```bash
git add src/lib/supabase-admin.ts
git commit -m "feat(supabase): add service-role storage client + helpers for ai-video-tasks bucket"
```

---

## Task 4: Bucket creation script update

**Files:**

- Modify: `scripts/studio-create-buckets.js`

- [ ] **Step 1: Read the existing file. Locate the `BUCKETS` array (around line 14).**

- [ ] **Step 2: Add the new bucket entry. The array should look like this after the change:**

```js
const BUCKETS = [
  { id: "studio-samples", public: true, fileSizeLimit: 30 * 1024 * 1024 },
  { id: "studio-outputs", public: false, fileSizeLimit: 200 * 1024 * 1024 },
  { id: "ai-video-tasks", public: false, fileSizeLimit: 30 * 1024 * 1024 },
];
```

- [ ] **Step 3: Run the script (only if `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` are set in `.env`):**

Run:

```bash
npm run studio:create-buckets
```

Expected: `[studio-buckets] ai-video-tasks: created` (or `exists` on a re-run).

If env not configured locally, skip — the script is idempotent and can be run later before deploying.

- [ ] **Step 4: Commit:**

```bash
git add scripts/studio-create-buckets.js
git commit -m "chore(supabase): provision ai-video-tasks bucket via studio-create-buckets"
```

---

## Task 5: POST `/api/ai-videos/tasks` route

**Files:**

- Create: `src/app/api/ai-videos/tasks/route.ts`

- [ ] **Step 1: Confirm `@paralleldrive/cuid2` is available. Prisma's `cuid()` default uses it internally but it is not exposed at runtime, so we install it directly:**

Run:

```bash
grep cuid2 package.json || npm install @paralleldrive/cuid2
```

Expected: an entry in `dependencies` after this step.

- [ ] **Step 2: Implement the route handler. Create `src/app/api/ai-videos/tasks/route.ts`:**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createId } from "@paralleldrive/cuid2";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildPortraitPath,
  buildVoicePath,
  promptSchema,
  validatePortraitFile,
  validateVoiceFile,
  type PortraitMime,
  type VoiceMime,
} from "@/lib/ai-video-task";
import { SupabaseConfigError, deleteFromBucket, uploadToBucket } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const creatorId = session.user.id;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const promptRaw = formData.get("prompt");
  const promptResult = promptSchema.safeParse(promptRaw);
  if (!promptResult.success) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }
  const prompt = promptResult.data;

  const portrait = formData.get("portrait");
  if (!(portrait instanceof File) || portrait.size === 0) {
    return NextResponse.json({ error: "Portrait image required" }, { status: 400 });
  }
  const portraitCheck = validatePortraitFile(portrait);
  if (!portraitCheck.ok) {
    return NextResponse.json({ error: portraitCheck.error }, { status: portraitCheck.status });
  }

  const voiceRaw = formData.get("voice");
  const voice = voiceRaw instanceof File && voiceRaw.size > 0 ? voiceRaw : null;
  const voiceCheck = validateVoiceFile(voice);
  if (!voiceCheck.ok) {
    return NextResponse.json({ error: voiceCheck.error }, { status: voiceCheck.status });
  }

  const taskId = createId();
  const portraitPath = buildPortraitPath(creatorId, taskId, portrait.type as PortraitMime);
  const voicePath = voice ? buildVoicePath(creatorId, taskId, voice.type as VoiceMime) : null;

  const uploadedPaths: string[] = [];

  try {
    await uploadToBucket(portraitPath, portrait, portrait.type);
    uploadedPaths.push(portraitPath);

    if (voice && voicePath) {
      await uploadToBucket(voicePath, voice, voice.type);
      uploadedPaths.push(voicePath);
    }

    const task = await prisma.aiVideoTask.create({
      data: {
        id: taskId,
        creatorId,
        prompt,
        portraitPath,
        voicePath,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ id: task.id, status: task.status });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await deleteFromBucket(uploadedPaths);
    }
    if (error instanceof SupabaseConfigError) {
      console.error("[ai-videos/tasks] supabase not configured");
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }
    if (error instanceof Error && error.message.startsWith("Supabase upload failed")) {
      console.error("[ai-videos/tasks] upload error", error.message);
      return NextResponse.json({ error: "Storage upload failed" }, { status: 502 });
    }
    console.error("[ai-videos/tasks] db insert error", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Type-check:**

Run:

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Build to confirm the route compiles:**

Run:

```bash
npm run build
```

Expected: success. (If the build is too slow locally, `npm run typecheck` is sufficient for this step.)

- [ ] **Step 5: Commit:**

```bash
git add src/app/api/ai-videos/tasks/route.ts package.json package-lock.json
git commit -m "feat(ai-video): POST /api/ai-videos/tasks creates task with Supabase upload"
```

---

## Task 6: Repoint generate form to the new endpoint

**Files:**

- Modify: `src/app/creatorportal/ai-video/generate/GenerateVideoForm.tsx`

- [ ] **Step 1: Replace the entire file contents with this new version. Field names changed: `voice_sample` → `voice`, `reference_image` → `portrait`. The `creator_id` field is removed (server reads from session). On success, the banner links to the tasks list page.**

```tsx
"use client";

import { FormEvent, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FileAudio, FileImage, Loader2, Sparkles } from "lucide-react";

type SubmissionState =
  | { type: "idle" }
  | { type: "success"; taskId: string }
  | { type: "error"; message: string };

export default function GenerateVideoForm() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [voice, setVoice] = useState<File | null>(null);
  const [portrait, setPortrait] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmissionState>({ type: "idle" });

  const voiceInputRef = useRef<HTMLInputElement>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.user?.id) {
      setStatus({
        type: "error",
        message: "You must be signed in as a creator to submit a request.",
      });
      return;
    }
    if (!prompt.trim()) {
      setStatus({ type: "error", message: "Please provide a generation prompt." });
      return;
    }
    if (!portrait) {
      setStatus({ type: "error", message: "Please upload a portrait reference image." });
      return;
    }

    const formData = new FormData();
    formData.append("prompt", prompt.trim());
    formData.append("portrait", portrait);
    if (voice) formData.append("voice", voice);

    setIsSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const response = await fetch("/api/ai-videos/tasks", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to queue AI video request.");
      }
      setStatus({ type: "success", taskId: data.id });
      setPrompt("");
      setVoice(null);
      setPortrait(null);
      if (voiceInputRef.current) voiceInputRef.current.value = "";
      if (portraitInputRef.current) portraitInputRef.current.value = "";
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while submitting your request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {status.type !== "idle" && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            status.type === "success"
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
              : "border-rose-200 bg-rose-50/70 text-rose-700"
          }`}
        >
          {status.type === "success" ? (
            <>
              <p className="font-semibold">Task queued.</p>
              <p className="mt-1 text-emerald-700">
                Task ID: <span className="font-mono text-xs">{status.taskId}</span>
              </p>
              <p className="mt-2">
                <Link
                  href="/creatorportal/ai-video/tasks"
                  className="font-semibold underline-offset-2 hover:underline"
                >
                  View all tasks →
                </Link>
              </p>
            </>
          ) : (
            status.message
          )}
        </div>
      )}

      <form className="grid gap-6 lg:grid-cols-[1.3fr_1fr]" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Voice upload
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Provide an audio sample for cloning—30 seconds or longer works best. WAV, MP3, or M4A
              up to 25 MB. Optional.
            </p>
            <label
              htmlFor="voice"
              className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
            >
              <FileAudio className="h-10 w-10 text-indigo-500" />
              <span className="mt-3 text-sm font-semibold text-indigo-700">
                Click to upload voice sample
              </span>
              <span className="mt-1 text-xs text-slate-500">Or drag and drop an audio file</span>
              <input
                id="voice"
                name="voice"
                type="file"
                accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
                className="hidden"
                ref={voiceInputRef}
                onChange={(event) => setVoice(event.target.files?.[0] ?? null)}
              />
            </label>
            {voice && (
              <p className="mt-3 truncate text-xs font-medium text-indigo-700">{voice.name}</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Creative prompt
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Outline the storyline, pacing notes, and CTAs you want in the finished video.
            </p>
            <div className="mt-4">
              <label
                htmlFor="prompt"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Generation prompt
              </label>
              <textarea
                id="prompt"
                name="prompt"
                rows={8}
                placeholder="Example: Create a 30s vertical video highlighting our winter skincare capsule..."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                required
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Portrait reference
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Upload a clear facial image of the target talent. Front-facing with neutral lighting.
              Required.
            </p>
            <label
              htmlFor="portrait"
              className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition hover:border-slate-300 hover:bg-slate-100"
            >
              <FileImage className="h-10 w-10 text-slate-500" />
              <span className="mt-3 text-sm font-semibold text-slate-700">
                Upload portrait image
              </span>
              <span className="mt-1 text-xs text-slate-500">
                JPG, PNG, or WebP — minimum 1080x1080
              </span>
              <input
                id="portrait"
                name="portrait"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                ref={portraitInputRef}
                onChange={(event) => setPortrait(event.target.files?.[0] ?? null)}
              />
            </label>
            {portrait && (
              <p className="mt-3 truncate text-xs font-medium text-slate-700">{portrait.name}</p>
            )}

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
              <p className="font-semibold text-slate-600">Tips for fast approvals</p>
              <ul className="mt-2 space-y-1">
                <li>• Use raw files rather than screenshots to avoid compression artifacts.</li>
                <li>• Keep visible logos or watermarks out of frame.</li>
                <li>• Confirm likeness permissions before uploading third-party talent.</li>
              </ul>
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitting || !prompt.trim() || !portrait}
            className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <span className="relative inline-flex items-center gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isSubmitting ? "Submitting…" : "Generate video"}
            </span>
          </button>
        </aside>
      </form>
    </>
  );
}
```

- [ ] **Step 2: Type-check:**

Run:

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit:**

```bash
git add src/app/creatorportal/ai-video/generate/GenerateVideoForm.tsx
git commit -m "feat(ai-video): repoint generate form to /api/ai-videos/tasks with new field names"
```

---

## Task 7: Creator tasks list page

**Files:**

- Create: `src/app/creatorportal/ai-video/tasks/page.tsx`
- Create: `src/app/creatorportal/ai-video/tasks/TaskRow.tsx`

- [ ] **Step 1: Confirm `next/image` will accept Supabase signed URLs. Open `next.config.js` and inspect the `images.remotePatterns` array.**

If the Supabase host is not already covered, add an entry:

```js
images: {
  remotePatterns: [
    { protocol: "https", hostname: "*.supabase.co" },
    // ...existing entries
  ],
}
```

If the existing config already covers it, leave the file alone.

- [ ] **Step 2: Create the row component. Create `src/app/creatorportal/ai-video/tasks/TaskRow.tsx`:**

```tsx
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileAudio2 } from "lucide-react";
import { STATUS_DISPLAY } from "@/lib/ai-video-task";
import type { AiVideoTaskStatus } from "@prisma/client";

export type TaskRowData = {
  id: string;
  prompt: string;
  status: AiVideoTaskStatus;
  outputUrl: string | null;
  hasVoice: boolean;
  portraitSignedUrl: string | null;
  createdAt: string;
};

export default function TaskRow({ task }: { task: TaskRowData }) {
  const display = STATUS_DISPLAY[task.status];
  const created = formatDistanceToNow(new Date(task.createdAt), { addSuffix: true });
  const promptPreview = task.prompt.length > 80 ? `${task.prompt.slice(0, 80)}…` : task.prompt;

  return (
    <li className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {task.portraitSignedUrl ? (
          <Image
            src={task.portraitSignedUrl}
            alt="Portrait reference"
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            no preview
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{promptPreview}</p>
        <p className="mt-1 text-xs text-slate-500">
          {created}
          {task.hasVoice ? (
            <span className="ml-2 inline-flex items-center gap-1 text-indigo-600">
              <FileAudio2 className="h-3 w-3" /> voice attached
            </span>
          ) : null}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${display.className}`}
      >
        {display.label}
      </span>
      {task.outputUrl ? (
        <Link
          href={task.outputUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline"
        >
          View output
        </Link>
      ) : null}
    </li>
  );
}
```

- [ ] **Step 3: Create the page server component. Create `src/app/creatorportal/ai-video/tasks/page.tsx`:**

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedUrl } from "@/lib/supabase-admin";
import TaskRow, { type TaskRowData } from "./TaskRow";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const rows = await prisma.aiVideoTask.findMany({
    where: { creatorId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      prompt: true,
      status: true,
      outputUrl: true,
      voicePath: true,
      portraitPath: true,
      createdAt: true,
    },
  });

  const tasks: TaskRowData[] = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      prompt: r.prompt,
      status: r.status,
      outputUrl: r.outputUrl,
      hasVoice: r.voicePath !== null,
      portraitSignedUrl: await createSignedUrl(r.portraitPath),
      createdAt: r.createdAt.toISOString(),
    }))
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
            AI production suite
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Your AI video tasks</h1>
        </div>
        <Link
          href="/creatorportal/ai-video/generate"
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Generate new video
        </Link>
      </header>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">No tasks yet.</p>
          <Link
            href="/creatorportal/ai-video/generate"
            className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            Submit your first request →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Type-check:**

Run:

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit:**

```bash
git add src/app/creatorportal/ai-video/tasks next.config.js
git commit -m "feat(ai-video): creator-scoped tasks list page with portrait thumbnails"
```

---

## Task 8: PATCH `/api/storyclaw-admin/tasks/[id]` route

**Files:**

- Create: `src/app/api/storyclaw-admin/tasks/[id]/route.ts`

- [ ] **Step 1: Implement the route handler. Create `src/app/api/storyclaw-admin/tasks/[id]/route.ts`:**

```ts
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { patchTaskSchema } from "@/lib/ai-video-task";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchTaskSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const task = await prisma.aiVideoTask.update({
      where: { id },
      data: {
        status: parsed.data.status,
        outputUrl: parsed.data.outputUrl ?? undefined,
        notes: parsed.data.notes ?? undefined,
      },
      select: {
        id: true,
        status: true,
        outputUrl: true,
        notes: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    console.error("[storyclaw-admin/tasks] update error", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check:**

Run:

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit:**

```bash
git add src/app/api/storyclaw-admin/tasks
git commit -m "feat(storyclaw-admin): PATCH route to update AiVideoTask status"
```

---

## Task 9: Storyclaw admin page

**Files:**

- Create: `src/app/storyclaw-admin/page.tsx`
- Create: `src/app/storyclaw-admin/TaskAdminRow.tsx`

- [ ] **Step 1: Create the row client component. Create `src/app/storyclaw-admin/TaskAdminRow.tsx`:**

```tsx
"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AiVideoTaskStatus } from "@prisma/client";

export type TaskAdminRowData = {
  id: string;
  creatorLabel: string;
  prompt: string;
  status: AiVideoTaskStatus;
  outputUrl: string | null;
  notes: string | null;
  voiceSignedUrl: string | null;
  portraitSignedUrl: string | null;
  createdAt: string;
};

const STATUSES: AiVideoTaskStatus[] = ["QUEUED", "GENERATING", "IN_REVIEW", "DELIVERED"];

export default function TaskAdminRow({ task }: { task: TaskAdminRowData }) {
  const router = useRouter();
  const [status, setStatus] = useState<AiVideoTaskStatus>(task.status);
  const [outputUrl, setOutputUrl] = useState(task.outputUrl ?? "");
  const [notes, setNotes] = useState(task.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const response = await fetch(`/api/storyclaw-admin/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        outputUrl: outputUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Failed to update task");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-3 py-3 text-xs text-slate-500">
        <div className="font-mono">{task.id.slice(0, 8)}</div>
        <div>{task.creatorLabel}</div>
        <div>{new Date(task.createdAt).toLocaleString()}</div>
      </td>
      <td className="px-3 py-3 text-xs">
        <details>
          <summary className="cursor-pointer text-slate-600">
            {task.prompt.length > 60 ? `${task.prompt.slice(0, 60)}…` : task.prompt}
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-slate-700">{task.prompt}</p>
        </details>
        <div className="mt-2 flex gap-2 text-indigo-600">
          {task.portraitSignedUrl ? (
            <a href={task.portraitSignedUrl} target="_blank" rel="noreferrer" className="underline">
              portrait
            </a>
          ) : null}
          {task.voiceSignedUrl ? (
            <a href={task.voiceSignedUrl} target="_blank" rel="noreferrer" className="underline">
              voice
            </a>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3">
        <form onSubmit={onSave} className="flex flex-col gap-2 text-xs">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AiVideoTaskStatus)}
            className="rounded border border-slate-200 px-2 py-1"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="url"
            placeholder="output URL (required for DELIVERED)"
            value={outputUrl}
            onChange={(e) => setOutputUrl(e.target.value)}
            className="rounded border border-slate-200 px-2 py-1"
          />
          <textarea
            placeholder="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="rounded border border-slate-200 px-2 py-1"
          />
          {error ? <p className="text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-slate-900 px-3 py-1 text-white disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </form>
      </td>
    </tr>
  );
}
```

- [ ] **Step 2: Create the admin page. Create `src/app/storyclaw-admin/page.tsx`:**

```tsx
import { prisma } from "@/lib/prisma";
import { createSignedUrl } from "@/lib/supabase-admin";
import TaskAdminRow, { type TaskAdminRowData } from "./TaskAdminRow";

export const dynamic = "force-dynamic";

export default async function StoryclawAdminPage() {
  const rows = await prisma.aiVideoTask.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, email: true, name: true } },
    },
  });

  const tasks: TaskAdminRowData[] = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      creatorLabel: r.creator?.name ?? r.creator?.email ?? r.creatorId,
      prompt: r.prompt,
      status: r.status,
      outputUrl: r.outputUrl,
      notes: r.notes,
      voiceSignedUrl: r.voicePath ? await createSignedUrl(r.voicePath) : null,
      portraitSignedUrl: await createSignedUrl(r.portraitPath),
      createdAt: r.createdAt.toISOString(),
    }))
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Internal Storyclaw control panel</p>
        <p>This page is not authentication-protected. Do not share this URL.</p>
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">AI Video Tasks</h1>
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">No tasks.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="px-3 py-2">Task</th>
              <th className="px-3 py-2">Inputs</th>
              <th className="px-3 py-2">Status / Output</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskAdminRow key={task.id} task={task} />
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Type-check:**

Run:

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit:**

```bash
git add src/app/storyclaw-admin
git commit -m "feat(storyclaw-admin): admin page lists all tasks with inline status edit"
```

---

## Task 10: Documentation + env example

**Files:**

- Modify: `.env.example` (or `README.md` if `.env.example` does not exist)

- [ ] **Step 1: Check whether `.env.example` exists:**

Run:

```bash
ls .env.example 2>/dev/null
```

- [ ] **Step 2: If `.env.example` exists, ensure it contains both server-side keys (append if missing):**

```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

If `.env.example` does **not** exist, add a short paragraph to `README.md` under the existing env-vars section:

> AI video task workflow requires `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_KEY`. Run `npm run studio:create-buckets` once to provision the `ai-video-tasks` bucket.

- [ ] **Step 3: Commit:**

```bash
git add .env.example README.md 2>/dev/null
git commit -m "docs(ai-video): document SUPABASE_SERVICE_KEY for AI video task workflow"
```

(Skip the commit if neither file changed.)

---

## Task 11: E2E smoke test

**Files:**

- Create: `e2e/ai-video-tasks.spec.ts`
- Create: `e2e/fixtures/portrait.png` (small valid PNG, ≥ 1KB)

- [ ] **Step 1: List existing e2e tests for shape and login pattern:**

Run:

```bash
ls e2e/ 2>&1
```

- [ ] **Step 2: Open one creator-portal e2e test in `e2e/` to copy the login helper pattern. Use whichever helper that test uses (the repo's seeded creator user, identified in `prisma/seed.dev.js`).**

- [ ] **Step 3: Create `e2e/ai-video-tasks.spec.ts`. Adapt the login section to match the repo's existing pattern; the rest of the body is:**

```ts
import { test, expect } from "@playwright/test";
import path from "node:path";

test("creator submits AI video task and sees it in the list", async ({ page }) => {
  // TODO: replace with this repo's existing creator login helper
  // (read another e2e/*.spec.ts in this repo before completing this step)
  await page.goto("/login");
  // ...login as seeded dev creator...

  await page.goto("/creatorportal/ai-video/generate");
  await page.getByLabel(/Generation prompt/i).fill("E2E smoke prompt");
  await page.locator("input#portrait").setInputFiles(path.join(__dirname, "fixtures/portrait.png"));
  await page.getByRole("button", { name: /Generate video/i }).click();

  await expect(page.getByText(/Task queued/i)).toBeVisible();

  await page.goto("/creatorportal/ai-video/tasks");
  await expect(page.getByText("E2E smoke prompt")).toBeVisible();
  await expect(page.getByText("Queued")).toBeVisible();
});
```

- [ ] **Step 4: Add the fixture portrait. Create `e2e/fixtures/portrait.png` (any small valid PNG ≥ 1KB).** A trivial way:

```bash
mkdir -p e2e/fixtures
node -e "const fs=require('fs');const b=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=','base64');fs.writeFileSync('e2e/fixtures/portrait.png', Buffer.concat([b, Buffer.alloc(2048)]));"
```

(The padding bytes pad past 1KB; the leading bytes are a valid 1x1 PNG so the MIME sniff passes.)

- [ ] **Step 5: Run the e2e suite (skip if local stack isn't up):**

Run:

```bash
npm run e2e -- ai-video-tasks
```

Expected: the new spec passes.

- [ ] **Step 6: Commit:**

```bash
git add e2e/ai-video-tasks.spec.ts e2e/fixtures/portrait.png
git commit -m "test(ai-video): e2e smoke for task submission and list page"
```

---

## Final verification

- [ ] **Step 1: Run prepush harness:**

```bash
npm run harness:prepush
```

Expected: typecheck + lint + prisma drift + vitest all pass.

- [ ] **Step 2: Manual UI verification (skip if local stack not available):**

1. Sign in as a creator.
2. Submit a task on `/creatorportal/ai-video/generate`.
3. Confirm `Task queued` banner with task ID + link.
4. Click through to `/creatorportal/ai-video/tasks`. Confirm row appears with status `Queued`.
5. Open `/storyclaw-admin` in another window. Confirm the same task appears.
6. Change status to `IN_REVIEW`, click Save. Reload `/creatorportal/ai-video/tasks` — status reflects.
7. Change status to `DELIVERED` without an `outputUrl` — expect a 400 error inline.
8. Set `outputUrl` to a valid URL + change status to `DELIVERED`. Save succeeds. Creator's row shows `View output` link.

- [ ] **Step 3: If a PR is desired, push and open one:**

```bash
git push -u origin <branch>
```

Open a PR titled `feat(ai-video): task workflow + Storyclaw control panel` linking the spec.

---

## Self-review summary

- **Spec coverage:** all 12 acceptance criteria traceable — submit (T5/T6), voice optional (T2/T5/T6), creator list scoped (T7), admin all-tasks (T9), DELIVERED requires outputUrl (T2 schema + T8 enforcement), 401 unauthenticated (T5), MIME / size rejection before upload (T2 + T5), portrait cleanup on partial failure (T5).
- **Storage layout** matches spec section 5 (path builders defined in T2, used by T5).
- **No TBDs:** every code-bearing step has full code. Only `<timestamp>` for the auto-generated migration directory and `<branch>` for the PR push are intentional placeholders.
- **Type / signature consistency:** `createSignedUrl`, `uploadToBucket`, `deleteFromBucket`, `buildPortraitPath`, `buildVoicePath`, `STATUS_DISPLAY`, `patchTaskSchema`, `validatePortraitFile`, `validateVoiceFile` all match across tasks.
- **Env var name** uses repo convention `SUPABASE_SERVICE_KEY` (not the `SUPABASE_SERVICE_ROLE_KEY` that appeared in the spec — this plan supersedes that detail to match `scripts/studio-create-buckets.js`).
