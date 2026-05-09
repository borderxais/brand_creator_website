# AI Video Fulfillment — Design

**Date:** 2026-05-09
**Status:** Approved (brainstorming)
**Scope:** Manual fulfillment workflow for `AiVideoTask`. Adds an output-video upload path to the existing Storyclaw admin page and an end-to-end test that verifies the full creator-submit → admin-fulfill → creator-sees-Delivered flow.

**Relation to prior specs:** Extends [`2026-05-08-ai-video-task-workflow-design.md`](./2026-05-08-ai-video-task-workflow-design.md). That spec built creator submit, creator task list, admin status form, and PATCH route. This spec adds the file-based fulfillment surface — admin uploads an output video into Supabase Storage, creator sees a working "View output" link — plus the chained e2e test.

## 1. Goal

When a Storyclaw operator finishes a video for a queued task, they must be able to:

1. Open `/storyclaw-admin`, find the row, and upload the output video file.
2. Mark the task `DELIVERED`.
3. Have the originating creator see, on `/creatorportal/ai-video/tasks`, that the task is `Delivered` and a working "View output" link.

The system must also continue to accept an external URL (e.g., a hosted Storyclaw URL) as the output for tasks delivered without a file upload.

## 2. Non-Goals

- No outbound Storyclaw API integration / webhook / polling.
- No auth on `/storyclaw-admin` or its endpoints (URL-obscure only; deferred — matches prior spec).
- No upload progress bar / resumable upload.
- No output replacement audit log.
- No public bucket; all output reads use 1h signed URLs regenerated server-side per page load.
- No automatic status transition. Status is changed manually after upload.

## 3. Architecture Overview

```
Admin browser (no auth)
  │
  │ 1. POST /api/storyclaw-admin/tasks/:id/output  (multipart, video file)
  │    → validates mime + size
  │    → uploads to Supabase Storage
  │    → updates AiVideoTask.outputPath, clears outputUrl
  │
  │ 2. PATCH /api/storyclaw-admin/tasks/:id  (JSON, status: DELIVERED)
  │    → validates: DELIVERED requires outputPath OR outputUrl
  │    → updates status
  ▼
Postgres (AiVideoTask: + outputPath String?)
  ▲
  │ direct prisma reads (server components)
  │
Creator browser (authed) → /creatorportal/ai-video/tasks
  │ server component batch-signs outputPath values
  │ renders "View output" link if (outputPath || outputUrl) AND status === DELIVERED
```

Two-write fulfillment is intentional: upload and status change are separate concerns. The PATCH route accepts an existing `outputPath` on the row as fulfilling the "DELIVERED requires output" rule, so admins do not need to repeat the file in the JSON payload.

## 4. Data Model Change

Add to `AiVideoTask` in `prisma/schema.prisma`:

```prisma
model AiVideoTask {
  // ... existing fields ...
  outputPath  String?   // Supabase Storage object path; set when admin uploads file
  outputUrl   String?   // External URL (e.g., storyclaw.ai); kept for non-uploaded deliveries
  // ... existing fields ...
}
```

Both fields are nullable. They are mutually exclusive at write-time (admin form picks one) but the database does not enforce mutual exclusion — server-side handlers do.

Migration name: `add_ai_video_task_output_path`.

## 5. Supabase Storage Layout

Reuses existing `ai-video-tasks` bucket (private, service-role only).

**Object key for output:**

```
{creatorId}/{taskId}/output.{ext}
```

Where `ext` ∈ `mp4 | webm | mov`.

**File validation (server-side):**

- Mime: `video/mp4 | video/webm | video/quicktime`
- Size: ≤ 200 MB
- Reject mismatches before any Storage call.

**Replacement policy:**

If a task already has a non-null `outputPath`, the upload handler best-effort deletes the old blob before uploading the new one. If the delete fails, the upload still proceeds and the orphan is logged.

## 6. API Surface

### 6.1 New: Output upload

`POST /api/storyclaw-admin/tasks/[id]/output`

- Auth: none (matches existing admin convention).
- Body: `multipart/form-data`
  - `file` — File, video, ≤ 200 MB. Required.
- Server flow:
  1. Look up task by `id` → 404 if missing.
  2. Validate mime + size.
  3. Build path `{creatorId}/{taskId}/output.{ext}`.
  4. If `task.outputPath` is set, best-effort `deleteFromBucket([task.outputPath])`.
  5. `uploadToBucket(newPath, file, file.type)`.
  6. `prisma.aiVideoTask.update({ where: {id}, data: { outputPath: newPath, outputUrl: null } })`.
- Response: `200 { outputPath: string }`
- Errors:
  - `400` — missing or wrong-type file.
  - `404` — task not found.
  - `413` — file exceeds 200 MB.
  - `500` — Supabase env missing or DB failure.
  - `502` — Supabase upload failed (best-effort delete of just-uploaded blob attempted).

### 6.2 Modified: Status PATCH

`PATCH /api/storyclaw-admin/tasks/[id]`

Validation rule changes:

- `status === "DELIVERED"` requires `outputPath` OR `outputUrl` to be non-empty (was: `outputUrl` only).
- Source of truth: the row state after applying the patch payload. If the row already has `outputPath` set and the payload omits both fields, validation passes.
- If the payload includes both `outputPath`-clearing intent and `outputUrl`, server keeps mutual exclusion: setting `outputUrl` clears `outputPath`, and vice versa. (In practice the upload route handles `outputPath`; PATCH handles `outputUrl`.)

All other PATCH semantics unchanged.

### 6.3 Unchanged

`POST /api/ai-videos/tasks` (creator submit) and the creator-tasks server component reads remain as in the prior spec.

## 7. UI Surfaces

### 7.1 `/storyclaw-admin` — page additions

Server component (`page.tsx`) selects `outputPath` from each row and batch-signs output paths alongside portrait/voice via the existing `createSignedUrls` helper. Passes `outputPath` and `outputSignedUrl` into `TaskAdminRow`.

### 7.2 `/storyclaw-admin/TaskAdminRow` — additions

New "Output upload" section in the row form, above the existing status form:

- Hidden `<input type="file" accept="video/mp4,video/webm,video/quicktime">`.
- Visible label/button to pick file.
- "Upload" button — disabled until file is picked or while in-flight.
- On click: POST multipart to `/api/storyclaw-admin/tasks/{id}/output`, show inline error on failure, `router.refresh()` on success.
- When `outputPath` is already set: show "Output uploaded ✓" indicator, link to the signed URL ("Preview"), and a "Replace" affordance for re-upload.

Existing status form unchanged in layout, with one tweak:

- Hint text on the `outputUrl` input: "External URL (leave empty if uploading file)".
- If `outputPath` is set, the `outputUrl` input may be left empty without blocking a `DELIVERED` save.

`TaskAdminRowData` type extends with:

```typescript
type TaskAdminRowData = {
  // ... existing ...
  outputPath: string | null;
  outputSignedUrl: string | null;
};
```

### 7.3 `/creatorportal/ai-video/tasks` — link rendering

The page's server component (`page.tsx`) selects `outputPath` alongside other fields and batch-signs paths, then passes `outputSignedUrl` and `outputUrl` into the existing `TaskRow.tsx` child. Per row, compute:

```
viewOutputHref =
  outputPath  → outputSignedUrl
  outputUrl   → outputUrl
  otherwise   → null
```

Render a "View output" link only when `viewOutputHref` is non-null and `status === DELIVERED`. Open in a new tab with `target="_blank" rel="noopener noreferrer"`.

No client-side state. Signed-URL freshness is handled by re-rendering on each page visit (1h TTL is well above page-view duration).

## 8. Helpers — `src/lib/ai-video-task.ts`

Add:

```typescript
export const VIDEO_MIME_EXT = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
} as const;

export type VideoMime = keyof typeof VIDEO_MIME_EXT;

export function validateOutputFile(
  file: File | null
): { ok: true } | { ok: false; status: number; error: string };

export function buildOutputPath(creatorId: string, taskId: string, mime: VideoMime): string;
```

`validateOutputFile` enforces mime ∈ `VIDEO_MIME_EXT` keys and size ≤ 200 MB, mirroring the existing `validatePortraitFile` / `validateVoiceFile` shape.

## 9. Error Handling Summary

| Failure                                          | HTTP | Notes                                     |
| ------------------------------------------------ | ---- | ----------------------------------------- |
| Upload: missing or wrong-type file               | 400  | Validated before Supabase call.           |
| Upload: oversize                                 | 413  | Validated before Supabase call.           |
| Upload: task not found                           | 404  | DB lookup before upload.                  |
| Upload: Supabase env missing                     | 500  | Fail fast at handler entry.               |
| Upload: Supabase upload failure                  | 502  | Best-effort delete of just-uploaded blob. |
| Upload: DB update failure post-upload            | 500  | Best-effort delete of just-uploaded blob. |
| PATCH: DELIVERED without outputPath or outputUrl | 400  | Server-enforced.                          |
| PATCH: invalid status enum                       | 400  | Existing behavior.                        |

Admin-side errors render inline on the row form. Creator-side errors during link click are out of scope (browser handles 404/expired signed URL).

## 10. Files & Folders to Add / Modify

### New

- `src/app/api/storyclaw-admin/tasks/[id]/output/route.ts` — POST multipart upload handler.
- `e2e/ai-video-fulfillment.spec.ts` — chained creator-submit → admin-upload → creator-sees-Delivered test.
- `prisma/migrations/<timestamp>_add_ai_video_task_output_path/migration.sql` — Prisma-generated.

### Modified

- `prisma/schema.prisma` — add `outputPath String?` to `AiVideoTask`.
- `src/lib/ai-video-task.ts` — add `VideoMime`, `VIDEO_MIME_EXT`, `validateOutputFile`, `buildOutputPath`.
- `src/app/api/storyclaw-admin/tasks/[id]/route.ts` — PATCH validation: `DELIVERED` requires `outputPath` OR `outputUrl` (post-merge state).
- `src/app/storyclaw-admin/page.tsx` — select `outputPath`, batch-sign output URLs, pass to row.
- `src/app/storyclaw-admin/TaskAdminRow.tsx` — upload section, "Output uploaded ✓" indicator, URL-field hint.
- `src/app/creatorportal/ai-video/tasks/page.tsx` — select `outputPath`, batch-sign output URLs alongside portrait paths, pass `outputSignedUrl` + `outputUrl` to `TaskRow`.
- `src/app/creatorportal/ai-video/tasks/TaskRow.tsx` — render "View output" link with `outputPath` preferred over `outputUrl`, only when `status === DELIVERED`.

## 11. E2E Test Shape

`e2e/ai-video-fulfillment.spec.ts`:

```typescript
import path from "node:path";
import { test, expect } from "./_helpers/fixtures";

test("creator submits, admin uploads output, creator sees Delivered", async ({
  asCreator,
  page,
}) => {
  // 1. Creator submits a task via UI.
  await asCreator.goto("/creatorportal/ai-video/generate");
  await asCreator.getByLabel(/Generation prompt/i).fill("E2E fulfillment prompt");
  await asCreator
    .locator("input#portrait")
    .setInputFiles(path.join(__dirname, "fixtures/portrait.png"));
  await asCreator.getByRole("button", { name: /Generate video/i }).click();
  await expect(asCreator.getByText(/Task queued/i)).toBeVisible({ timeout: 15_000 });

  // 2. Admin (unauthed) uploads output then marks DELIVERED.
  await page.goto("/storyclaw-admin");
  const row = page.locator("tr", { hasText: "E2E fulfillment prompt" });
  await row
    .locator('input[type="file"][accept*="video"]')
    .setInputFiles(path.join(__dirname, "fixtures/output-sample.mp4"));
  await row.getByRole("button", { name: /^Upload$/i }).click();
  await expect(row.getByText(/Output uploaded/i)).toBeVisible({ timeout: 15_000 });
  await row.getByLabel(/Status/i).selectOption("DELIVERED");
  await row.getByRole("button", { name: /Save/i }).click();

  // 3. Creator returns and sees Delivered with a working link.
  await asCreator.goto("/creatorportal/ai-video/tasks");
  const taskRow = asCreator.locator(":has-text('E2E fulfillment prompt')").first();
  await expect(taskRow.getByText("Delivered")).toBeVisible();
  await expect(taskRow.getByRole("link", { name: /View output/i })).toHaveAttribute(
    "href",
    /^https?:/
  );
});
```

Notes:

- `asCreator` fixture (existing) provides an authed creator browser context.
- The default `page` fixture is used unauthed for `/storyclaw-admin` (no auth currently).
- Fixture `e2e/fixtures/output-sample.mp4` exists already.
- DB cleanup uses the existing `resetDb` helper in `e2e/_setup/`.
- Creator-row selectors use a permissive `:has-text()` because the current task list HTML is not a `<table>`. Selectors will be tightened during implementation against the real DOM.

## 12. Acceptance Criteria

1. Admin uploads an mp4 to a `QUEUED` task → row shows "Output uploaded ✓"; `outputPath` set in DB; `outputUrl` cleared if previously set.
2. Admin uploads a non-video file → 400; no DB change; no Storage write.
3. Admin uploads a >200 MB file → 413; no DB change; no Storage write.
4. Admin uploads to a non-existent task id → 404.
5. Admin marks status `DELIVERED` on a row with `outputPath` set and empty `outputUrl` → 200; row updates.
6. Admin marks status `DELIVERED` on a row with neither `outputPath` nor `outputUrl` → 400.
7. Admin replaces an existing `outputPath` by uploading a new file → old blob is deleted (best-effort), new blob exists, `outputPath` updated.
8. Creator opens `/creatorportal/ai-video/tasks` for a `DELIVERED` task with `outputPath` → "View output" link href is the Supabase signed URL.
9. Creator opens `/creatorportal/ai-video/tasks` for a `DELIVERED` task with only `outputUrl` → "View output" link href is the external URL.
10. Creator opens `/creatorportal/ai-video/tasks` for a `QUEUED` or `IN_REVIEW` task → no "View output" link is rendered, even if `outputPath` happens to be set.
11. The new e2e test (`e2e/ai-video-fulfillment.spec.ts`) passes against a freshly seeded DB.

## 13. Open Items / Deferred

- Auth on `/storyclaw-admin` and its endpoints.
- Investigation and fix for the recently observed `Unauthorized` response from `POST /api/ai-videos/tasks` in dev. Treated as a pre-flight task in the implementation plan; not part of this spec.
- Public bucket for outputs (no signed-URL expiry).
- Upload progress UI / resumable uploads for large videos.
- Audit log of output replacements.
- Outbound Storyclaw API submit + webhook for status updates.
