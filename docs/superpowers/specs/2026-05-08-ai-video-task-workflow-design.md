# AI Video Task Workflow — Design

**Date:** 2026-05-08
**Status:** Approved (brainstorming)
**Scope:** Info-gathering workflow for AI video generation requests. Storyclaw integration is out of scope this iteration.

**Relation to prior specs:** This is intentionally narrower than [`2026-05-05-ai-video-studio-design.md`](./2026-05-05-ai-video-studio-design.md). That spec covers the full Studio (samples gallery, Stripe subscription, claim/deliver admin flow) on the `VideoRequest` model. This spec covers a decoupled task-submission workflow on a **new** `AiVideoTask` model, with no sample gallery, no subscription gating, and a separate Storyclaw control panel for status updates. The two are independent.

## 1. Goal

When a creator submits the `/creatorportal/ai-video/generate` form, the platform must:

1. Validate inputs (prompt required, portrait required, voice optional).
2. Upload the voice and portrait assets to Supabase Storage.
3. Persist a task row in Postgres with status `QUEUED`.
4. Surface the task in a creator-facing list page with live status.
5. Allow a separate Storyclaw control panel to advance status through `QUEUED → GENERATING → IN_REVIEW → DELIVERED`.

No outbound HTTP call to Storyclaw is made in this iteration. Status transitions are driven manually from the Storyclaw control panel.

## 2. Non-Goals

- No Storyclaw API integration / webhook / polling.
- No automated status transitions, retries, or background jobs.
- No subscription / quota integration (decoupled from existing `VideoRequest` + `Subscription` models).
- No audit log / status history table.
- No real auth on the Storyclaw control panel (URL-obscure only; auth deferred).
- No reuse of legacy `AiVideoRequest`, `AiVideo`, or `VideoRequest` models.

## 3. Architecture Overview

```
Creator browser
  │ POST multipart (prompt, portrait, voice?)
  ▼
/api/ai-videos/tasks  (Next.js Route Handler, NextAuth-gated)
  │ 1. Zod validate prompt
  │ 2. MIME + size validate files
  │ 3. Generate cuid (taskId)
  │ 4. Upload portrait → Supabase Storage
  │ 5. Upload voice (optional) → Supabase Storage
  │ 6. prisma.aiVideoTask.create({ id, paths, status: QUEUED })
  │ 7. On any post-upload failure: best-effort delete uploaded blobs
  ▼
Postgres (AiVideoTask)
  ▲
  │ direct prisma reads (server components)
  │
  ├── /creatorportal/ai-video/tasks  (creator-scoped list)
  └── /storyclaw-admin               (all-tasks list + status mutation form)
                │
                ▼
       PATCH /api/storyclaw-admin/tasks/:id
       (no auth, server validates payload)
```

Supabase Storage holds binary assets. DB stores only paths. Signed URLs (1h TTL) are generated server-side for rendering.

## 4. Data Model

New Prisma model. Add after `AiVideoRequest` block in `prisma/schema.prisma`.

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
  voicePath    String?           // Supabase Storage object path; null if not uploaded
  portraitPath String            // Supabase Storage object path

  status       AiVideoTaskStatus @default(QUEUED)
  outputUrl    String?           // populated when DELIVERED (Storyclaw or Supabase URL)
  notes        String?           @db.Text

  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  @@index([creatorId, createdAt])
  @@index([status, createdAt])
}
```

Add reverse relation on `User` model:

```prisma
aiVideoTasks AiVideoTask[] @relation("AiVideoTaskCreator")
```

Migration name: `add_ai_video_task`.

Date format: all timestamps stored as Postgres `timestamptz`, serialized to ISO 8601 strings in API responses.

## 5. Supabase Storage Layout

**Bucket:** `ai-video-tasks` (private; service-role access only)

**Object key convention:**

```
{creatorId}/{taskId}/portrait.{ext}
{creatorId}/{taskId}/voice.{ext}        (optional)
{creatorId}/{taskId}/output.{ext}       (admin uploads later if needed)
```

Notes:

- `taskId` is generated upfront via `cuid()` so paths are known before DB insert.
- Single DB write: insert row with paths after both uploads succeed.
- Bucket creation is a one-time manual setup step (documented in implementation plan, not run via migration).

**Required env vars:**

- `NEXT_PUBLIC_SUPABASE_URL` — already used by frontend banner check.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; never exposed to client.

**File validation (server-side):**

- Portrait: `image/jpeg | image/png | image/webp`, ≤ 10 MB.
- Voice: `audio/mpeg | audio/wav | audio/mp4 | audio/x-m4a`, ≤ 25 MB.
- Reject mismatches before any Storage call.

## 6. API Surface

### 6.1 Creator: create task

`POST /api/ai-videos/tasks`

- Auth: NextAuth session required (`session.user.id`).
- Body: `multipart/form-data`
  - `prompt` — string, 1–5000 chars (Zod-validated).
  - `portrait` — File, image, ≤ 10 MB. Required.
  - `voice` — File, audio, ≤ 25 MB. Optional.
- Response: `200 { id: string, status: "QUEUED" }`
- Error responses (JSON `{ error: string }`):
  - `400` — missing/invalid prompt or portrait, unsupported MIME.
  - `401` — no session.
  - `413` — file exceeds size limit.
  - `500` — DB insert failure or Supabase env not configured.
  - `502` — Supabase Storage upload failed.
- On post-upload failure: best-effort delete of any uploaded blobs before returning error.

### 6.2 Creator: list tasks

No dedicated endpoint. `/creatorportal/ai-video/tasks` is a server component that calls Prisma directly, scoped by `session.user.id`.

### 6.3 Storyclaw admin: update task

`PATCH /api/storyclaw-admin/tasks/:id`

- Auth: none (URL-obscure only). Documented as temporary.
- Body (JSON):
  ```ts
  {
    status: "QUEUED" | "GENERATING" | "IN_REVIEW" | "DELIVERED",
    outputUrl?: string,
    notes?: string
  }
  ```
- Validation:
  - Status must be a valid enum value.
  - If `status === "DELIVERED"`, `outputUrl` must be a non-empty string.
  - Transitions are permissive (any → any).
- Response: `200 { task: AiVideoTask }`
- Errors:
  - `400` — invalid payload.
  - `404` — task not found.
  - `500` — DB failure.

### 6.4 Storyclaw admin: list tasks

No dedicated endpoint. `/storyclaw-admin` is a server component that calls Prisma directly across all creators.

## 7. UI Surfaces

### 7.1 `/creatorportal/ai-video/generate` (existing — minor edits)

- Replace fetch target from `/api/ai-videos/generate` → `/api/ai-videos/tasks`.
- Field name changes to match new endpoint: `voice_sample` → `voice`, `reference_image` → `portrait`. Remove `creator_id` field (server reads from session).
- On success: show "Task queued" banner with link to `/creatorportal/ai-video/tasks`.
- Reset form state.
- Remove "Supabase client not configured" banner once env vars are wired.

### 7.2 `/creatorportal/ai-video/tasks` (new — server component)

- Header: "Your AI video tasks" + button → `/creatorportal/ai-video/generate`.
- List rows (most recent first):
  - Created date (relative: "2h ago").
  - Prompt preview (truncated 80 chars).
  - Portrait thumbnail rendered via 1h signed URL.
  - Voice indicator icon when `voicePath` is set.
  - Status pill: `Queued` / `Generating` / `In Review` / `Delivered`.
  - "View output" link when `outputUrl` is set.
- Empty state: "No tasks yet" + CTA to generate page.

**Status pill colors:**

| Status     | Color (Tailwind) |
| ---------- | ---------------- |
| Queued     | slate            |
| Generating | indigo           |
| In Review  | amber            |
| Delivered  | emerald          |

### 7.3 `/storyclaw-admin` (new — server component, no auth)

- Top banner: warning text — "Internal control panel. Not authentication-protected. Do not share this URL."
- Filter dropdown by status (optional; nice-to-have).
- Table of all tasks (most recent first):
  - Creator name / email.
  - Prompt (truncated, expandable).
  - Portrait thumbnail (signed URL).
  - Voice link (signed URL) when present.
  - Current status.
  - Created at.
  - Inline form: status dropdown, `outputUrl` text input, `notes` textarea, Save button.
  - Save submits to `PATCH /api/storyclaw-admin/tasks/:id`, then revalidates the path.

## 8. Status Transitions

Permissive: any status may transition to any other status. The form is operated by humans; no machine enforcement is needed this iteration.

Server enforces only:

- Status value is a valid enum.
- `DELIVERED` requires `outputUrl` to be non-empty.

`updatedAt` records the last change. No history table.

## 9. Error Handling Summary

| Failure                            | HTTP | Notes                                          |
| ---------------------------------- | ---- | ---------------------------------------------- |
| No session                         | 401  | Creator endpoint only.                         |
| Empty / missing prompt             | 400  | Zod-validated.                                 |
| Missing portrait                   | 400  | Required.                                      |
| Bad MIME                           | 400  | Reject before upload.                          |
| Oversize file                      | 413  | Reject before upload.                          |
| Supabase env missing               | 500  | Fail fast at handler entry; log.               |
| Supabase upload failure            | 502  | Best-effort cleanup of any uploaded blob; log. |
| DB insert failure after upload     | 500  | Best-effort delete of both blobs; log.         |
| Admin: invalid status              | 400  | Enum check.                                    |
| Admin: DELIVERED without outputUrl | 400  | Server-enforced.                               |
| Admin: task not found              | 404  |                                                |

Client renders `error` field inline on the existing form. Submit is disabled during the request.

## 10. Files & Folders to Add / Modify

### New

- `src/app/api/ai-videos/tasks/route.ts` — POST handler.
- `src/app/api/storyclaw-admin/tasks/[id]/route.ts` — PATCH handler.
- `src/app/creatorportal/ai-video/tasks/page.tsx` — server component list.
- `src/app/creatorportal/ai-video/tasks/TaskList.tsx` — list rendering (client where needed for thumbnails).
- `src/app/storyclaw-admin/page.tsx` — server component list + form.
- `src/app/storyclaw-admin/TaskAdminRow.tsx` — inline form per row.
- `src/lib/supabase-storage.ts` — service-role client + upload / signed-URL helpers.
- `src/lib/ai-video-task.ts` — task validation schemas + path helpers.
- `prisma/migrations/<timestamp>_add_ai_video_task/migration.sql` — Prisma-generated.

### Modified

- `prisma/schema.prisma` — add `AiVideoTaskStatus` enum, `AiVideoTask` model, `User.aiVideoTasks` relation.
- `src/app/creatorportal/ai-video/generate/GenerateVideoForm.tsx` — repoint to new endpoint, field rename, success-state link.
- `.env.local` (and `.env.example` if present) — document `SUPABASE_SERVICE_ROLE_KEY`.

## 11. Open Items / Deferred

- Storyclaw API integration (outbound submit; webhook for status updates).
- Real auth on `/storyclaw-admin`.
- Subscription / quota gating per creator.
- Status transition history / audit log.
- Resumable / chunked uploads for large voice files.
- Background cleanup job for orphaned Supabase blobs.

## 12. Acceptance Criteria

1. Creator submits the form with prompt + portrait → row appears in `AiVideoTask` with status `QUEUED`, files exist in Supabase Storage at the documented paths.
2. Creator submits without voice → row created, `voicePath` is null, no voice blob.
3. Creator visits `/creatorportal/ai-video/tasks` → sees their own tasks, sorted newest first, with portrait thumbnail and status pill.
4. Creator does NOT see other creators' tasks.
5. Storyclaw admin opens `/storyclaw-admin` → sees all tasks across creators.
6. Admin changes status to `DELIVERED` without `outputUrl` → request rejected with 400.
7. Admin changes status to `DELIVERED` with `outputUrl` → row updates, creator's tasks page reflects the new status and shows "View output".
8. Server returns 401 when an unauthenticated client hits `POST /api/ai-videos/tasks`.
9. Oversize portrait or unsupported MIME is rejected before any Supabase call.
10. If Supabase upload fails after the portrait was uploaded but before the voice succeeds, the portrait blob is deleted.
