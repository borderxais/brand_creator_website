# AI Video Fulfillment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual fulfillment workflow on top of the existing `AiVideoTask` model — Storyclaw operators upload an output video to Supabase, mark the task DELIVERED, and the originating creator sees a working "View output" link.

**Architecture:** New `outputPath String?` column on `AiVideoTask`. New `POST /api/storyclaw-admin/tasks/[id]/output` multipart endpoint uploads to existing `ai-video-tasks` bucket and persists `outputPath`. PATCH route's "DELIVERED requires output" rule moves from Zod schema into the route handler so it can consider the existing DB row's `outputPath`. Admin UI gains an upload affordance per row. Creator tasks list signs `outputPath` server-side and prefers it over the external `outputUrl`.

**Tech Stack:** Next.js 15 App Router, Prisma (Postgres), Supabase Storage (service role), Zod, Vitest, Playwright.

**Spec:** [`docs/superpowers/specs/2026-05-09-ai-video-fulfillment-design.md`](../specs/2026-05-09-ai-video-fulfillment-design.md)

---

## File Map

### Created

- `prisma/migrations/<timestamp>_add_ai_video_task_output_path/migration.sql` — Prisma-generated migration adding `outputPath` column.
- `src/app/api/storyclaw-admin/tasks/[id]/output/route.ts` — POST multipart upload handler.
- `e2e/ai-video-fulfillment.spec.ts` — chained creator→admin→creator e2e.

### Modified

- `prisma/schema.prisma` — `AiVideoTask` gains `outputPath String?`.
- `src/lib/ai-video-task.ts` — new `VIDEO_MIME_TO_EXT`, `VideoMime`, `OUTPUT_MAX_BYTES`, `validateOutputFile`, `buildOutputPath`. `patchTaskSchema` relaxed (DELIVERED no longer requires outputUrl in payload).
- `src/lib/__tests__/ai-video-task.test.ts` — tests for new helpers; updated `patchTaskSchema` tests reflecting relaxed rule.
- `src/app/api/storyclaw-admin/tasks/[id]/route.ts` — PATCH route fetches task, enforces "DELIVERED requires `outputPath` OR final `outputUrl`" against post-merge state.
- `src/app/storyclaw-admin/page.tsx` — selects `outputPath`, batch-signs alongside portrait/voice, passes to `TaskAdminRow`.
- `src/app/storyclaw-admin/TaskAdminRow.tsx` — new "Output upload" section, "Output uploaded ✓" indicator, hint on `outputUrl` field.
- `src/app/creatorportal/ai-video/tasks/page.tsx` — selects `outputPath`, signs alongside portrait paths, passes `outputSignedUrl` to `TaskRow`.
- `src/app/creatorportal/ai-video/tasks/TaskRow.tsx` — renders "View output" link only when `status === DELIVERED`, prefers `outputSignedUrl` over `outputUrl`.

---

## Task 0: Pre-flight — verify dev auth works

**Why:** User reported `Unauthorized` on `POST /api/ai-videos/tasks` from a logged-in browser session. Resolve before adding new admin upload behavior so e2e and manual testing reflect the real state.

**Files:**

- Read-only inspection of: `.env.local`, `.env`, `src/lib/auth.ts`

- [ ] **Step 1: Inspect env precedence**

Run: `grep -n "NEXTAUTH_URL" .env.local .env`
Expected: `.env.local` has `NEXTAUTH_URL=http://localhost:12000`. `.env` may have other values but Next.js loads `.env.local` last for development, overriding `.env`.

- [ ] **Step 2: Restart dev server cleanly**

```bash
# kill any running next dev
pkill -f "next dev" 2>/dev/null || true
# then start fresh in the background of your terminal:
npm run dev
```

Expected: server reports `Local: http://localhost:12000`.

- [ ] **Step 3: Manual reproduction**

In a private/incognito browser:

1. Visit `http://localhost:12000/auth/signin`
2. Sign in as a creator
3. Open `/creatorportal/ai-video/generate`, fill prompt, attach a portrait, click Generate
4. Confirm "Task queued" banner appears

Expected: 200 from `/api/ai-videos/tasks`. If still 401, do not proceed — capture cookies + server logs and stop.

- [ ] **Step 4: Run existing creator e2e**

Run: `npx playwright test e2e/ai-video-tasks.spec.ts`
Expected: PASS.

If green, the auth path is healthy and we can proceed. **Do not commit anything in this task.**

---

## Task 1: Add `outputPath` column and migration

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_ai_video_task_output_path/migration.sql` (Prisma-generated)

- [ ] **Step 1: Edit `prisma/schema.prisma`**

Locate the `AiVideoTask` model. Add a new `outputPath` field above the existing `outputUrl` field:

```prisma
model AiVideoTask {
  // ... existing fields above ...
  outputPath   String?           // Supabase Storage object path; set when admin uploads file
  outputUrl    String?           // External URL; kept for non-uploaded deliveries
  // ... rest of existing fields ...
}
```

- [ ] **Step 2: Generate the migration**

Run: `npx prisma migrate dev --name add_ai_video_task_output_path`
Expected: a new migration directory under `prisma/migrations/` containing a `migration.sql` that adds the `outputPath` column. Prisma client regenerates automatically.

- [ ] **Step 3: Verify schema state**

Run: `npx prisma format` then `npx prisma validate`
Expected: both succeed with no diff.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(ai-video): add outputPath column to AiVideoTask"
```

---

## Task 2: Add output-file helpers (with tests)

**Files:**

- Modify: `src/lib/ai-video-task.ts`
- Modify: `src/lib/__tests__/ai-video-task.test.ts`

- [ ] **Step 1: Write failing tests for output helpers**

Append to `src/lib/__tests__/ai-video-task.test.ts` (the file already imports from `@/lib/ai-video-task` — extend that import with the new exports below):

```typescript
// Update the existing import at the top:
import {
  PORTRAIT_MIME_TO_EXT,
  VOICE_MIME_TO_EXT,
  VIDEO_MIME_TO_EXT,
  PORTRAIT_MAX_BYTES,
  VOICE_MAX_BYTES,
  OUTPUT_MAX_BYTES,
  buildPortraitPath,
  buildVoicePath,
  buildOutputPath,
  validatePortraitFile,
  validateVoiceFile,
  validateOutputFile,
  promptSchema,
  patchTaskSchema,
  STATUS_DISPLAY,
} from "@/lib/ai-video-task";

// Append these describe blocks:

describe("buildOutputPath", () => {
  it("uses creatorId, taskId and the correct extension", () => {
    expect(buildOutputPath("c", "t", "video/mp4")).toBe("c/t/output.mp4");
    expect(buildOutputPath("c", "t", "video/webm")).toBe("c/t/output.webm");
    expect(buildOutputPath("c", "t", "video/quicktime")).toBe("c/t/output.mov");
  });
});

describe("validateOutputFile", () => {
  it("rejects null", () => {
    expect(validateOutputFile(null)).toEqual({
      ok: false,
      status: 400,
      error: "Output file required",
    });
  });
  it("accepts a small mp4", () => {
    const f = new File(["x"], "out.mp4", { type: "video/mp4" });
    expect(validateOutputFile(f)).toEqual({ ok: true });
  });
  it("rejects an unsupported MIME", () => {
    const f = new File(["x"], "out.avi", { type: "video/x-msvideo" });
    expect(validateOutputFile(f)).toEqual({
      ok: false,
      status: 400,
      error: "Unsupported output file type",
    });
  });
  it("rejects an oversize file", () => {
    const big = new File([new Uint8Array(OUTPUT_MAX_BYTES + 1)], "out.mp4", {
      type: "video/mp4",
    });
    expect(validateOutputFile(big)).toEqual({
      ok: false,
      status: 413,
      error: "Output file exceeds size limit",
    });
  });
});

it("VIDEO_MIME_TO_EXT exports the expected keys", () => {
  expect(Object.keys(VIDEO_MIME_TO_EXT).sort()).toEqual([
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/ai-video-task.test.ts`
Expected: FAIL with errors about missing exports `VIDEO_MIME_TO_EXT`, `OUTPUT_MAX_BYTES`, `buildOutputPath`, `validateOutputFile`.

- [ ] **Step 3: Implement helpers in `src/lib/ai-video-task.ts`**

Add the following block immediately after the existing `VOICE_MIME_TO_EXT` constant (before `PortraitMime`/`VoiceMime` types):

```typescript
export const OUTPUT_MAX_BYTES = 200 * 1024 * 1024;

export const VIDEO_MIME_TO_EXT = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
} as const;
```

Then add `VideoMime` to the existing type-export block:

```typescript
export type VideoMime = keyof typeof VIDEO_MIME_TO_EXT;
```

Add `validateOutputFile` after `validateVoiceFile`:

```typescript
export function validateOutputFile(file: File | null): FileValidationResult {
  if (file === null || file.size === 0) {
    return { ok: false, status: 400, error: "Output file required" };
  }
  if (!(file.type in VIDEO_MIME_TO_EXT)) {
    return { ok: false, status: 400, error: "Unsupported output file type" };
  }
  if (file.size > OUTPUT_MAX_BYTES) {
    return { ok: false, status: 413, error: "Output file exceeds size limit" };
  }
  return { ok: true };
}
```

Add `buildOutputPath` after `buildVoicePath`:

```typescript
export function buildOutputPath(creatorId: string, taskId: string, mime: VideoMime): string {
  return `${creatorId}/${taskId}/output.${VIDEO_MIME_TO_EXT[mime]}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/ai-video-task.test.ts`
Expected: PASS for all describe blocks (existing + new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai-video-task.ts src/lib/__tests__/ai-video-task.test.ts
git commit -m "feat(ai-video): add output file helpers and validators"
```

---

## Task 3: Relax `patchTaskSchema` (DELIVERED no longer requires outputUrl in payload)

**Why:** The "DELIVERED requires output" rule must consider the post-merge row state — the row might already have an `outputPath` set from a prior upload. Zod cannot see DB rows. We move the rule into the route handler in Task 5, and relax the schema here.

**Files:**

- Modify: `src/lib/ai-video-task.ts`
- Modify: `src/lib/__tests__/ai-video-task.test.ts`

- [ ] **Step 1: Update tests to express the relaxed rule**

In `src/lib/__tests__/ai-video-task.test.ts`, replace the existing `describe("patchTaskSchema", ...)` block with:

```typescript
describe("patchTaskSchema", () => {
  it("accepts DELIVERED without an outputUrl (route handler enforces output presence)", () => {
    expect(patchTaskSchema.parse({ status: "DELIVERED" })).toEqual({ status: "DELIVERED" });
  });
  it("accepts DELIVERED with a valid outputUrl", () => {
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
  it("rejects an outputUrl that is not a valid URL", () => {
    expect(() => patchTaskSchema.parse({ status: "DELIVERED", outputUrl: "not a url" })).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify the new spec fails**

Run: `npx vitest run src/lib/__tests__/ai-video-task.test.ts -t patchTaskSchema`
Expected: FAIL — current `.refine(...)` rule rejects DELIVERED without outputUrl.

- [ ] **Step 3: Update `patchTaskSchema` in `src/lib/ai-video-task.ts`**

Replace the existing schema definition (lines around 60-69) with:

```typescript
export const patchTaskSchema = z.object({
  status: baseStatusSchema,
  outputUrl: z.string().url().optional(),
  notes: z.string().optional(),
});
```

(Drop the trailing `.refine(...)`. The "DELIVERED needs an output" check moves into the route handler in Task 5.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/ai-video-task.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai-video-task.ts src/lib/__tests__/ai-video-task.test.ts
git commit -m "refactor(ai-video): relax patchTaskSchema; route handler will enforce DELIVERED output"
```

---

## Task 4: Implement output upload route

**Files:**

- Create: `src/app/api/storyclaw-admin/tasks/[id]/output/route.ts`

This route is verified end-to-end via the e2e test in Task 9. We do not add a unit test here because the handler is mostly orchestration over Supabase + Prisma; mocking would test the mocks. The TDD signal lives in the e2e and in the helper tests already added.

- [ ] **Step 1: Create the route file**

Create `src/app/api/storyclaw-admin/tasks/[id]/output/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildOutputPath, validateOutputFile, type VideoMime } from "@/lib/ai-video-task";
import {
  SupabaseConfigError,
  SupabaseUploadError,
  deleteFromBucket,
  uploadToBucket,
} from "@/lib/supabase-admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const task = await prisma.aiVideoTask.findUnique({
    where: { id },
    select: { id: true, creatorId: true, outputPath: true },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileRaw = formData.get("file");
  const file = fileRaw instanceof File && fileRaw.size > 0 ? fileRaw : null;
  const check = validateOutputFile(file);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  // Type narrowed by validateOutputFile — file is a File and the mime is a VideoMime key
  const validFile = file as File;
  const newPath = buildOutputPath(task.creatorId, task.id, validFile.type as VideoMime);

  const previousPath = task.outputPath;
  const samePath = previousPath === newPath;

  // Best-effort cleanup of an existing output blob when the path differs.
  if (previousPath && !samePath) {
    await deleteFromBucket([previousPath]);
  }

  let uploadedNew = false;
  try {
    await uploadToBucket(newPath, validFile, validFile.type);
    uploadedNew = true;

    const updated = await prisma.aiVideoTask.update({
      where: { id: task.id },
      data: { outputPath: newPath, outputUrl: null },
      select: { outputPath: true },
    });

    return NextResponse.json({ outputPath: updated.outputPath });
  } catch (error) {
    if (uploadedNew) {
      await deleteFromBucket([newPath]);
    }
    if (error instanceof SupabaseConfigError) {
      console.error("[storyclaw-admin/tasks/output] supabase not configured");
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }
    if (error instanceof SupabaseUploadError) {
      console.error("[storyclaw-admin/tasks/output] upload error", {
        path: error.path,
        message: error.message,
      });
      return NextResponse.json({ error: "Storage upload failed" }, { status: 502 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    console.error("[storyclaw-admin/tasks/output] db error", error);
    return NextResponse.json({ error: "Failed to record output" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/storyclaw-admin/tasks/[id]/output/route.ts
git commit -m "feat(storyclaw-admin): POST output upload route persists outputPath"
```

---

## Task 5: PATCH route enforces DELIVERED output via merged row state

**Files:**

- Modify: `src/app/api/storyclaw-admin/tasks/[id]/route.ts`

- [ ] **Step 1: Replace the route body**

Open `src/app/api/storyclaw-admin/tasks/[id]/route.ts` and replace the entire `PATCH` function with:

```typescript
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

  const existing = await prisma.aiVideoTask.findUnique({
    where: { id },
    select: { outputPath: true, outputUrl: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // outputUrl: payload value if provided, otherwise existing value.
  const finalOutputUrl =
    parsed.data.outputUrl !== undefined ? parsed.data.outputUrl : existing.outputUrl;

  if (parsed.data.status === "DELIVERED") {
    const hasOutput =
      (typeof finalOutputUrl === "string" && finalOutputUrl.length > 0) ||
      (typeof existing.outputPath === "string" && existing.outputPath.length > 0);
    if (!hasOutput) {
      return NextResponse.json(
        { error: "outputUrl or uploaded output required when status is DELIVERED" },
        { status: 400 }
      );
    }
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
        outputPath: true,
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

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/storyclaw-admin/tasks/[id]/route.ts
git commit -m "feat(storyclaw-admin): PATCH enforces DELIVERED output against merged row state"
```

---

## Task 6: Surface `outputPath` on the admin page (server)

**Files:**

- Modify: `src/app/storyclaw-admin/page.tsx`
- Modify: `src/app/storyclaw-admin/TaskAdminRow.tsx` (extend `TaskAdminRowData` only — UI changes land in Task 7)

- [ ] **Step 1: Extend `TaskAdminRowData`**

In `src/app/storyclaw-admin/TaskAdminRow.tsx`, extend the exported type:

```typescript
export type TaskAdminRowData = {
  id: string;
  creatorLabel: string;
  prompt: string;
  status: AiVideoTaskStatus;
  outputUrl: string | null;
  outputPath: string | null;
  outputSignedUrl: string | null;
  notes: string | null;
  voiceSignedUrl: string | null;
  portraitSignedUrl: string | null;
  createdAt: string;
};
```

(Do not change UI yet. Existing render path is fine — new fields are unused until Task 7.)

- [ ] **Step 2: Update `page.tsx` to select and sign `outputPath`**

In `src/app/storyclaw-admin/page.tsx`, replace the body so it reads:

```typescript
import { prisma } from "@/lib/prisma";
import { createSignedUrls } from "@/lib/supabase-admin";
import TaskAdminRow, { type TaskAdminRowData } from "./TaskAdminRow";

export const dynamic = "force-dynamic";

export default async function StoryclawAdminPage() {
  const rows = await prisma.aiVideoTask.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      prompt: true,
      status: true,
      outputUrl: true,
      outputPath: true,
      notes: true,
      voicePath: true,
      portraitPath: true,
      createdAt: true,
      updatedAt: true,
      creatorId: true,
      creator: { select: { id: true, email: true, name: true } },
    },
  });

  const portraitPaths = rows.map((r) => r.portraitPath);
  const voicePaths = rows.map((r) => r.voicePath).filter((p): p is string => p !== null);
  const outputPaths = rows.map((r) => r.outputPath).filter((p): p is string => p !== null);

  const [portraitMap, voiceMap, outputMap] = await Promise.all([
    createSignedUrls(portraitPaths),
    createSignedUrls(voicePaths),
    createSignedUrls(outputPaths),
  ]);

  const tasks: Array<TaskAdminRowData & { rowKey: string }> = rows.map((r) => ({
    id: r.id,
    creatorLabel: r.creator?.name ?? r.creator?.email ?? r.creatorId,
    prompt: r.prompt,
    status: r.status,
    outputUrl: r.outputUrl,
    outputPath: r.outputPath,
    outputSignedUrl: r.outputPath ? (outputMap.get(r.outputPath) ?? null) : null,
    notes: r.notes,
    voiceSignedUrl: r.voicePath ? (voiceMap.get(r.voicePath) ?? null) : null,
    portraitSignedUrl: portraitMap.get(r.portraitPath) ?? null,
    createdAt: r.createdAt.toISOString(),
    rowKey: `${r.id}-${r.updatedAt.toISOString()}`,
  }));

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
              <TaskAdminRow key={task.rowKey} task={task} />
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/storyclaw-admin/page.tsx src/app/storyclaw-admin/TaskAdminRow.tsx
git commit -m "feat(storyclaw-admin): include outputPath and signed URL in row data"
```

---

## Task 7: Admin row UI — output upload section

**Files:**

- Modify: `src/app/storyclaw-admin/TaskAdminRow.tsx`

- [ ] **Step 1: Replace the row component**

Replace the entire contents of `src/app/storyclaw-admin/TaskAdminRow.tsx` with:

```typescript
"use client";

import { ChangeEvent, FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AiVideoTaskStatus } from "@prisma/client";

export type TaskAdminRowData = {
  id: string;
  creatorLabel: string;
  prompt: string;
  status: AiVideoTaskStatus;
  outputUrl: string | null;
  outputPath: string | null;
  outputSignedUrl: string | null;
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
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [outputFile, setOutputFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onUpload = async () => {
    if (!outputFile || isUploading) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", outputFile);
      const response = await fetch(`/api/storyclaw-admin/tasks/${task.id}/output`, {
        method: "POST",
        body: fd,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setUploadError(data?.error ?? "Failed to upload output");
        return;
      }
      setOutputFile(null);
      startTransition(() => router.refresh());
    } catch {
      setUploadError("Network error — please try again");
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOutputFile(event.target.files?.[0] ?? null);
    setUploadError(null);
  };

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
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
      const payload = (await response.json().catch(() => null)) as {
        task: { status: AiVideoTaskStatus; outputUrl: string | null; notes: string | null };
      } | null;
      if (payload?.task) {
        setStatus(payload.task.status);
        setOutputUrl(payload.task.outputUrl ?? "");
        setNotes(payload.task.notes ?? "");
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || isPending;
  const uploaded = task.outputPath !== null;

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
        <div className="flex flex-col gap-3 text-xs">
          <div className="rounded border border-slate-200 p-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Output upload
            </p>
            {uploaded ? (
              <p className="mt-1 flex items-center gap-2 text-emerald-700">
                <span aria-hidden>✓</span>
                <span>Output uploaded</span>
                {task.outputSignedUrl ? (
                  <a
                    href={task.outputSignedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Preview
                  </a>
                ) : null}
              </p>
            ) : (
              <p className="mt-1 text-slate-500">No file uploaded yet.</p>
            )}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={onFileChange}
              disabled={isUploading || busy}
              className="mt-2 block w-full text-xs"
            />
            {uploadError ? <p className="mt-1 text-rose-600">{uploadError}</p> : null}
            <button
              type="button"
              onClick={onUpload}
              disabled={!outputFile || isUploading || busy}
              className="mt-2 rounded bg-indigo-600 px-3 py-1 text-white disabled:opacity-50"
            >
              {isUploading ? "Uploading…" : uploaded ? "Replace" : "Upload"}
            </button>
          </div>

          <form onSubmit={onSave} className="flex flex-col gap-2">
            <select
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AiVideoTaskStatus)}
              className="rounded border border-slate-200 px-2 py-1"
              disabled={busy}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="url"
              placeholder="External URL (leave empty if uploading file)"
              value={outputUrl}
              onChange={(e) => setOutputUrl(e.target.value)}
              className="rounded border border-slate-200 px-2 py-1"
              disabled={busy}
            />
            <textarea
              placeholder="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="rounded border border-slate-200 px-2 py-1"
              disabled={busy}
            />
            {error ? <p className="text-rose-600">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-slate-900 px-3 py-1 text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
```

Notable choices:

- `<select aria-label="Status">` — gives the e2e a stable `getByLabel(/Status/i)` target.
- "Upload" button stays disabled when no file selected; flips to "Replace" once `outputPath` is set.
- The `<input type="file">` lives at the row level (not inside the form). Selectors in the e2e target it by `accept` attribute.

- [ ] **Step 2: Type-check + lint**

Run: `npx tsc --noEmit && npx eslint src/app/storyclaw-admin/TaskAdminRow.tsx`
Expected: no errors.

- [ ] **Step 3: Manual smoke**

Start the dev server (`npm run dev`), open `/storyclaw-admin`, pick a task, choose a small mp4 (e.g., `e2e/fixtures/output-sample.mp4`), click Upload. Reload → row shows "Output uploaded ✓". Then pick status `DELIVERED` + Save → request succeeds (200).

Expected: row shows uploaded indicator and status updates without filling the URL field.

- [ ] **Step 4: Commit**

```bash
git add src/app/storyclaw-admin/TaskAdminRow.tsx
git commit -m "feat(storyclaw-admin): output upload UI per row"
```

---

## Task 8: Creator tasks page surfaces signed output URL

**Files:**

- Modify: `src/app/creatorportal/ai-video/tasks/page.tsx`
- Modify: `src/app/creatorportal/ai-video/tasks/TaskRow.tsx`

- [ ] **Step 1: Extend `TaskRowData` and rendering**

Replace the contents of `src/app/creatorportal/ai-video/tasks/TaskRow.tsx` with:

```typescript
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
  outputSignedUrl: string | null;
  hasVoice: boolean;
  portraitSignedUrl: string | null;
  createdAt: string;
};

export default function TaskRow({ task }: { task: TaskRowData }) {
  const display = STATUS_DISPLAY[task.status];
  const created = formatDistanceToNow(new Date(task.createdAt), { addSuffix: true });
  const promptPreview = task.prompt.length > 80 ? `${task.prompt.slice(0, 80)}…` : task.prompt;

  const viewOutputHref =
    task.status === "DELIVERED" ? (task.outputSignedUrl ?? task.outputUrl ?? null) : null;

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
      {viewOutputHref ? (
        <Link
          href={viewOutputHref}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline"
        >
          View output
        </Link>
      ) : null}
    </li>
  );
}
```

- [ ] **Step 2: Wire `outputPath` through `page.tsx`**

Replace the contents of `src/app/creatorportal/ai-video/tasks/page.tsx` with:

```typescript
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSignedUrls } from "@/lib/supabase-admin";
import TaskRow, { type TaskRowData } from "./TaskRow";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const PAGE_SIZE = 50;

  const rows = await prisma.aiVideoTask.findMany({
    where: { creatorId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    select: {
      id: true,
      prompt: true,
      status: true,
      outputUrl: true,
      outputPath: true,
      voicePath: true,
      portraitPath: true,
      createdAt: true,
    },
  });

  const portraitPaths = rows.map((r) => r.portraitPath);
  const outputPaths = rows.map((r) => r.outputPath).filter((p): p is string => p !== null);

  const [portraitMap, outputMap] = await Promise.all([
    createSignedUrls(portraitPaths),
    createSignedUrls(outputPaths),
  ]);

  const tasks: TaskRowData[] = rows.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    status: r.status,
    outputUrl: r.outputUrl,
    outputSignedUrl: r.outputPath ? (outputMap.get(r.outputPath) ?? null) : null,
    hasVoice: r.voicePath !== null,
    portraitSignedUrl: portraitMap.get(r.portraitPath) ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

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

- [ ] **Step 3: Type-check + lint**

Run: `npx tsc --noEmit && npx eslint src/app/creatorportal/ai-video/tasks`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/creatorportal/ai-video/tasks/
git commit -m "feat(ai-video): creator tasks list shows signed View output link"
```

---

## Task 9: End-to-end fulfillment test

**Files:**

- Create: `e2e/ai-video-fulfillment.spec.ts`

- [ ] **Step 1: Confirm the existing fixture file**

Run: `ls e2e/fixtures/output-sample.mp4 e2e/fixtures/portrait.png`
Expected: both files exist (already committed).

- [ ] **Step 2: Inspect existing fixtures helper to confirm `asCreator` signature**

Run: `grep -n "asCreator" e2e/_helpers/fixtures.ts | head -5`
Expected: confirms `asCreator` is the authed creator `Page`. (Existing creator e2e already uses it.)

- [ ] **Step 3: Create the spec file**

Create `e2e/ai-video-fulfillment.spec.ts`:

```typescript
import path from "node:path";
import { test, expect } from "./_helpers/fixtures";

test("creator submits, admin uploads output, creator sees Delivered", async ({
  asCreator,
  page,
}) => {
  const promptText = `E2E fulfillment ${Date.now()}`;

  // 1. Creator submits a task via the form.
  await asCreator.goto("/creatorportal/ai-video/generate");
  await asCreator.getByLabel(/Generation prompt/i).fill(promptText);
  await asCreator
    .locator("input#portrait")
    .setInputFiles(path.join(__dirname, "fixtures/portrait.png"));
  await asCreator.getByRole("button", { name: /Generate video/i }).click();
  await expect(asCreator.getByText(/Task queued/i)).toBeVisible({ timeout: 15_000 });

  // 2. Admin (unauthed) finds the row, uploads an output mp4, marks DELIVERED.
  await page.goto("/storyclaw-admin");
  const row = page.locator("tr", { hasText: promptText });
  await expect(row).toBeVisible({ timeout: 10_000 });

  await row
    .locator('input[type="file"][accept*="video"]')
    .setInputFiles(path.join(__dirname, "fixtures/output-sample.mp4"));
  await row.getByRole("button", { name: /^Upload$/ }).click();
  await expect(row.getByText(/Output uploaded/i)).toBeVisible({ timeout: 20_000 });

  await row.getByLabel(/Status/i).selectOption("DELIVERED");
  await row.getByRole("button", { name: /^Save$/ }).click();
  // Re-render with refreshed row data; status text persists in the dropdown
  await expect(row.getByLabel(/Status/i)).toHaveValue("DELIVERED");

  // 3. Creator returns and sees Delivered + a working "View output" link.
  await asCreator.goto("/creatorportal/ai-video/tasks");
  const taskItem = asCreator.locator("li", { hasText: promptText });
  await expect(taskItem).toBeVisible({ timeout: 10_000 });
  await expect(taskItem.getByText("Delivered")).toBeVisible();
  await expect(taskItem.getByRole("link", { name: /View output/i })).toHaveAttribute(
    "href",
    /^https?:/
  );
});
```

Notes for the implementer:

- The admin test uses the default `page` fixture (unauthed) because `/storyclaw-admin` has no auth.
- The shared prompt string is timestamped per test run to keep selectors unambiguous when multiple test runs share a database state (the test runner's `resetDb` should clear between runs anyway, but the timestamp is cheap insurance).

- [ ] **Step 4: Run the new e2e**

Run: `npx playwright test e2e/ai-video-fulfillment.spec.ts`
Expected: PASS. If the test fails on the upload step, capture the trace (`--trace on`) and inspect the network panel — common causes: missing `SUPABASE_SERVICE_KEY` in the test env, or the bucket not yet created on the local Supabase Studio.

- [ ] **Step 5: Run the full e2e suite to confirm no regressions**

Run: `npx playwright test`
Expected: all e2e tests pass.

- [ ] **Step 6: Commit**

```bash
git add e2e/ai-video-fulfillment.spec.ts
git commit -m "test(ai-video): e2e creator submit, admin fulfill, creator sees Delivered"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run unit tests**

Run: `npx vitest run`
Expected: all tests pass.

- [ ] **Step 2: Run e2e**

Run: `npx playwright test`
Expected: all tests pass.

- [ ] **Step 3: Type-check the project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `npx eslint .`
Expected: no errors.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: build succeeds.

If any step fails, fix the underlying issue (do not bypass with `--no-verify`) and re-run.

---

## Out of Scope / Deferred

- Auth on `/storyclaw-admin` and its endpoints.
- Public bucket / permanent URLs.
- Upload progress UI / resumable uploads.
- Audit log of output replacements.
- Outbound Storyclaw API submit + webhook for status updates.
