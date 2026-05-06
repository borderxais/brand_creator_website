# Plan C1 — AI Video Studio Admin UI (Sprint 5)

- **Status:** Draft, awaiting user approval
- **Date:** 2026-05-06
- **Owner:** Studio team
- **Spec:** [`docs/superpowers/specs/2026-05-05-ai-video-studio-design.md`](../specs/2026-05-05-ai-video-studio-design.md) §7 Admin routes, §6 state machine, §8 quota refund
- **Predecessors:** Plans A, B1, B2, B3 (all merged to `origin/main`)
- **Successors:** C2 (notifications), C3 (E2E), C4 (polish)

---

## 1. Scope

Admin-facing surfaces of the AI Video Studio. STUDIO_ADMIN role gate at the layout level. Surfaces fulfill the request lifecycle (PENDING → IN_PROGRESS → DELIVERED / REJECTED / FAILED) and curate the sample gallery.

In scope:

1. `/admin/studio/layout.tsx` — STUDIO_ADMIN guard + admin-shell chrome.
2. `/admin/studio/page.tsx` — counts dashboard (PENDING / IN_PROGRESS / DELIVERED 7d / FAILED 7d).
3. `/admin/studio/samples/page.tsx` — paginated sample list including archived rows.
4. `/admin/studio/samples/new/page.tsx` — sample upload form (signed-URL direct upload to `studio-samples`).
5. `/admin/studio/samples/[id]/edit/page.tsx` — edit metadata + archive toggle.
6. `/admin/studio/requests/page.tsx` — admin queue (default filter: PENDING + IN_PROGRESS).
7. `/admin/studio/requests/[id]/page.tsx` — request detail + claim / deliver / reject / fail action panel + output upload.
8. `AdminQueueRow` component.
9. New API routes:
   - `POST /api/studio/admin/upload-url` — issue signed PUT URL into `studio-samples` (admin-only).
   - `POST /api/studio/admin/output-upload-url` — issue signed PUT URL into `studio-outputs` (admin-only).
   - `PATCH /api/studio/samples/[id]` — edit metadata + toggle `isActive` (admin-only).
   - `GET /api/studio/admin/stats` — counts for dashboard.
10. Service additions in `src/features/ai-studio/lib/`:
    - `samples.ts`: `updateSample`, `archiveSample` (toggle `isActive`).
    - `requests.ts`: `getAdminStats` (counts grouped by status + 7-day windows).
    - `storage.ts`: `getSampleUploadUrl`, `getOutputUploadUrl` (signed PUT URLs).

Out of scope (deferred to C2/C3/C4):

- Email sends (C2).
- E2E coverage (C3).
- Lighthouse / bundle audit / docs polish (C4).
- Bulk actions (parking lot — explicitly out of P1).

## 2. Acceptance Criteria

- All admin routes return 404 (or 403) when accessed by non-STUDIO_ADMIN sessions.
- Sample upload form uploads preview MP4 + thumbnail directly to Supabase Storage via signed PUT URL; metadata POST creates row only after upload succeeds.
- Edit form updates Sample metadata; archive button flips `isActive` (soft-delete; archived samples disappear from creator gallery but stay queryable for admins).
- Request queue page lists PENDING + IN_PROGRESS by default; status filter chips switch the view.
- Request detail page exposes the four lifecycle actions with state-aware disabling (e.g. deliver only enabled in IN_PROGRESS).
- Output upload posts MP4 to `studio-outputs/{userId}/{requestId}.mp4` via signed URL, then POSTs deliver with the resulting path.
- Reject and fail flows ask for confirmation + reason; on success the request row reflects new status and quota refund (when within current period).
- Dashboard counts populate from `/api/studio/admin/stats`.
- All new code unit-tested where it adds branching logic; pre-push (`npm run harness:prepush`) green.

## 3. File Plan

```
src/
├── app/
│   ├── (studio)/
│   │   └── admin/
│   │       └── studio/
│   │           ├── layout.tsx                 [task 1]
│   │           ├── page.tsx                   [task 2]
│   │           ├── samples/
│   │           │   ├── page.tsx               [task 4]
│   │           │   ├── new/page.tsx           [task 5]
│   │           │   └── [id]/edit/page.tsx     [task 6]
│   │           └── requests/
│   │               ├── page.tsx               [task 7]
│   │               └── [id]/page.tsx          [task 8]
│   └── api/
│       └── studio/
│           ├── admin/
│           │   ├── upload-url/route.ts        [task 3a]
│           │   ├── output-upload-url/route.ts [task 3b]
│           │   └── stats/route.ts             [task 3d]
│           └── samples/[id]/route.ts          [task 3c — extend with PATCH]
└── features/ai-studio/
    ├── components/
    │   ├── AdminQueueRow.tsx                  [task 7]
    │   └── AdminActionPanel.tsx               [task 8 — client component]
    └── lib/
        ├── samples.ts                         [task 3c — add updateSample/archiveSample]
        ├── requests.ts                        [task 3d — add getAdminStats]
        └── storage.ts                         [task 3a/3b — add upload-URL helpers]
```

## 4. Tasks

Each task is a single commit. Tests added per task. Dispatch via `superpowers:subagent-driven-development`.

### Task 1 — Admin layout + role guard

- New: `src/app/(studio)/admin/studio/layout.tsx`.
- Server component. `auth()` → if no session, redirect `/login?next=/admin/studio`. If `session.user.role !== 'STUDIO_ADMIN'`, return Next.js `notFound()` (404 to avoid leaking surface).
- Chrome: dark editorial palette consistent with `src/app/(studio)/studio/layout.tsx`. Header label "Admin" + nav links (Dashboard / Samples / Requests). No QuotaBadge.
- Test: unit-skip; manual smoke + e2e in C3.
- Commit: `feat(studio-admin): /admin/studio layout with STUDIO_ADMIN guard`.

### Task 2 — Dashboard counts page

- New: `src/app/(studio)/admin/studio/page.tsx`.
- Calls `getAdminStats()` (added in task 3d). Renders 4 stat tiles: PENDING, IN_PROGRESS, DELIVERED in last 7d, FAILED in last 7d. Plus links to queue + samples.
- Anti-template: large numerals (text-6xl), thin tracking, rule-divided tiles. Not a card grid.
- Commit: `feat(studio-admin): dashboard counts tiles`.

### Task 3 — Service + API additions

Subtasks each their own commit:

- **3a.** `storage.getSampleUploadUrl({ sampleId, ext })` — returns signed PUT URL + path. Add admin-only `POST /api/studio/admin/upload-url` that consumes `{ ext: 'mp4'|'jpg'|'webp'|'png' }`, generates a fresh sample id (cuid), returns `{ uploadUrl, path, sampleId }`. Unit test for path construction.
- **3b.** `storage.getOutputUploadUrl({ userId, requestId })` — signed PUT URL into `studio-outputs`. Add admin-only `POST /api/studio/admin/output-upload-url` that expects `{ requestId }`, looks up the request, returns `{ uploadUrl, path }`. Reject if request not in IN_PROGRESS.
- **3c.** `samples.updateSample({ id, input })` + `samples.archiveSample({ id, isActive })`. Extend `/api/studio/samples/[id]/route.ts` with `PATCH` handler (admin-only via `withApiHandler` role assertion). Unit tests for both service functions.
- **3d.** `requests.getAdminStats()` returns `{ pending, inProgress, delivered7d, failed7d }`. Add `/api/studio/admin/stats/route.ts` (admin-only). Unit test mocked Prisma.

Pre-existing `withApiHandler` already has session injection; add an `assertAdmin` helper if not present.

Commits: `feat(studio): admin upload-url + sample PATCH + stats service` (or split per subtask if diffs grow).

### Task 4 — Admin sample list

- New: `src/app/(studio)/admin/studio/samples/page.tsx`.
- Server component. Fetches `listSamples({ includeInactive: true, limit: 50 })`. Table-style layout (not card grid): title / category / status badge (Active / Archived) / created / row link "Edit".
- "Upload sample" CTA → `/admin/studio/samples/new`.
- Commit: `feat(studio-admin): sample list with archived rows`.

### Task 5 — Sample upload form

- New: `src/app/(studio)/admin/studio/samples/new/page.tsx` (server) + co-located client `SampleUploadForm.tsx`.
- Flow: client form collects metadata + selects mp4 (≤30MB) + thumbnail (≤500KB jpg/webp). On submit:
  1. POST `/api/studio/admin/upload-url` (twice — once mp4, once thumbnail) → receive signed URLs.
  2. PUT files directly to Supabase via fetch.
  3. POST `/api/studio/samples` with metadata + resulting public URLs.
  4. Redirect to `/admin/studio/samples/[id]/edit`.
- Validation: mp4 mime check, size cap, duration probe optional (skip in P1; trust 90s default).
- Commit: `feat(studio-admin): sample upload form with signed-URL direct upload`.

### Task 6 — Sample edit + archive

- New: `src/app/(studio)/admin/studio/samples/[id]/edit/page.tsx` (server) + co-located client `SampleEditForm.tsx`.
- Server fetches sample. Client form preloads fields. Submit → PATCH `/api/studio/samples/[id]`.
- Archive button: separate POST → `PATCH` with `{ isActive: false }`. Unarchive flips back.
- Commit: `feat(studio-admin): sample edit form + archive toggle`.

### Task 7 — Admin queue

- New: `src/app/(studio)/admin/studio/requests/page.tsx` (server) + `src/features/ai-studio/components/AdminQueueRow.tsx`.
- Default filter: PENDING + IN_PROGRESS. Filter chips: All / Pending / In progress / Delivered / Rejected / Failed.
- Each row shows creator handle, sample title (or "Custom prompt"), prompt excerpt, status badge, claimed-by handle, created-at relative time. Row is `<Link>` to detail.
- Commit: `feat(studio-admin): request queue with status filters`.

### Task 8 — Request detail + action panel + output upload

- New: `src/app/(studio)/admin/studio/requests/[id]/page.tsx` (server) + `src/features/ai-studio/components/AdminActionPanel.tsx` (client).
- Server fetches request with `{ creator, sample, claimedBy }`.
- Action panel shows state-aware buttons:
  - PENDING: `Claim`.
  - IN_PROGRESS (mine): `Upload output & deliver`, `Reject`, `Fail`, `Release` (back to PENDING).
  - IN_PROGRESS (other admin): "Claimed by X — release to take over".
  - Terminal states: read-only.
- Output upload: file picker → POST `/api/studio/admin/output-upload-url` → PUT mp4 → POST `/api/studio/requests/[id]/deliver` with `{ outputPath, outputDurationSec }`.
- Reject / fail open small confirm dialog with reason textarea.
- Status timeline component: PENDING → IN_PROGRESS → terminal. Show timestamps when known.
- Commit: `feat(studio-admin): request detail with action panel + output upload`.

## 5. Verification

After each task:

- `npm run harness:prepush` passes (typecheck + lint + 130+ tests).
- Manual sanity: hit the new route as admin user (`admin@test.local`).

After Task 8:

- Manual smoke walk of full lifecycle on `npm run dev`:
  1. Log in as `creator-starter@test.local`, submit a request.
  2. Log out, log in as `admin@test.local`, claim it.
  3. Upload `e2e/fixtures/output-sample.mp4`, deliver.
  4. Log back in as creator, confirm DELIVERED + signed-URL playback.
  5. Repeat with reject path; confirm quota refund.
- Lighthouse / E2E formal coverage deferred to C3/C4.

## 6. Risks

| Risk                                                               | Mitigation                                                                                                 |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Signed PUT URL CORS blocks browser upload                          | Test against Supabase project early; if CORS blocked, fall back to server-side proxy upload via API route. |
| Two-phase upload fails midway (file uploaded, metadata POST fails) | Document orphan behavior; cleanup script deferred to P1.5.                                                 |
| Admin actions race with creator viewing same request               | Optimistic UI with toast on conflict (existing 409 handling).                                              |
| `STUDIO_ADMIN` role not yet wired into NextAuth session            | Verify `auth()` exposes `session.user.role`; if not, extend session callback as part of Task 1.            |

## 7. Open Questions

- Should archive be a hard delete in P1? **Decided: no** — soft-delete via `isActive=false`.
- Should output URL be signed at upload time or at fetch time? **Decided: at fetch time** (creator detail page already re-signs on each load per spec §14).
- Multi-file upload UX: progress bars or simple loader? **P1: simple loader, polish in C4.**
