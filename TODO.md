# TODO — AI Video Studio P1

Working list for the Phase 1 MVP defined in [`docs/superpowers/specs/2026-05-05-ai-video-studio-design.md`](docs/superpowers/specs/2026-05-05-ai-video-studio-design.md).

A more granular implementation plan will be produced via the writing-plans skill once this spec is approved by the user. Items below are sequenced top-down.

## Sprint 0 — Foundation & Blockers

- [x] Resolve E2E hard blocker 1 — dev-only `/api/dev/login` route gated by `NODE_ENV !== 'production'` (`6ef6634`)
- [x] Resolve E2E hard blocker 2 — dev-only `POST /api/dev/subscription` to set tier/quota directly (`7169cec`)
- [x] Resolve E2E hard blocker 3 — dev-only `POST /api/dev/quota/advance` for period rollover (`bc55fe0`)
- [x] Resolve E2E hard blocker 4 — add `webServer` config to `playwright.config.ts` + Mobile Safari + Pixel 5 projects (`79ec0dc`)
- [x] Add `prisma/seed.dev.js` with creator/admin test users (`df84503`)
- [x] Commit `e2e/fixtures/sample-90s.mp4` and `e2e/fixtures/output-sample.mp4` (`590558d`)
- [x] Add `EMAIL_DEV_NOOP` env flag handling in `src/lib/email.ts` (`54864b2`)
- [x] Add `E2E_BYPASS_RATELIMIT` flag in `src/lib/rate-limiter.ts` (`5de812e`)
- [ ] Confirm Stripe test-mode keys + create Starter / Pro Price IDs in Stripe dashboard (deferred to Plan B)

## Sprint 1 — Data model & schema

- [x] Prisma migration: add `Sample`, `VideoRequest`, `Subscription`, `StripeEventLog` models + enums (`PlanTier`, `VideoRequestStatus`, `SampleCategory`) — committed `1f2ba04`, **NOT applied to DB yet** (see follow-ups)
- [x] Patch `User` model with new relations
- [x] Document `STUDIO_ADMIN` allowed value in `src/features/ai-studio/types/roles.ts`
- [ ] Run migration locally; update `prisma/seed.dev.js` to backfill default `Subscription` for seeded users
- [ ] Add `prisma-drift.js` check passes

### Sprint 1 follow-ups (deferred from Task 3)

- [x] **Apply migration `20260505131009_add_ai_video_studio` to dev DB.** Old Supabase project `ldlxyyctxylgmstfqlzh` was paused (>90 days). Backup `db_cluster-02-01-2026@07-56-36.backup.gz` restored (public schema only, 26 tables, 2560 rows including User=58, CreatorProfile=54, CreatorPlatform=306, avocadata=1000, creator_test=1000) into NEW Supabase project `loesykbqlhynbjmqxfxc` (region `us-east-2`). New `DATABASE_URL` / `DIRECT_URL` set in `.env`. `npx prisma migrate deploy` succeeded — Studio schema (Sample, VideoRequest, Subscription, StripeEventLog + 3 enums) live on new DB.
- [x] **Cascade refactor (code-review follow-up).** Schema annotations + migration `20260506180000_studio_cascade_rules` applied. `Subscription.user` flipped RESTRICT → CASCADE on dev DB; remaining FKs (`Sample.uploadedBy` Restrict, `VideoRequest.creator` Restrict, `VideoRequest.{sample,claimedBy,subscription}` SetNull) already matched intended policy in DB — only schema annotations added.
- [x] **Schema intent comments** added on `VideoRequest.subscriptionId`, `VideoRequest.quotaConsumed`, `StripeEventLog.id`.
- [x] **Restore Supabase service role key** in `.env` (`SUPABASE_SERVICE_KEY`) — set 2026-05-06.
- [ ] **Storage buckets recreation** — old project had 7 storage buckets with 148 file objects. Original blob files gone. Studio buckets (`studio-samples`, `studio-outputs`) created on new project. Other buckets (TikTok uploads, profile images) recreate as use-cases re-emerge.

## Sprint 2 — Core services (server-side) ✅ Plan B1 complete

- [x] `src/features/ai-studio/lib/quota.ts` — atomic deduct + refund + rollover helpers (`063da13`)
- [x] `src/features/ai-studio/lib/requests.ts` — state machine validation + transition helpers (`42645a5`)
- [x] `src/features/ai-studio/lib/samples.ts` — Sample CRUD (`66d3875`)
- [x] `src/features/ai-studio/lib/storage.ts` — Supabase bucket helpers (`7b51c73`)
- [x] `src/features/ai-studio/lib/stripe.ts` — Stripe SDK wrapper (`1f8df5b`, stripe@22.1.0)
- [x] Create Supabase buckets `studio-samples` (public 30MB) + `studio-outputs` (private 200MB) — live on `loesykbqlhynbjmqxfxc`; idempotent `npm run studio:create-buckets` script
- [x] Zod schemas (`ac6a9da`) + shared `HttpError` (`920d863`)

## Sprint 3 — API routes ✅ Plan B2 complete

- [x] `withApiHandler` shared wrapper (`11dc3e5`)
- [x] `GET /api/studio/samples`, `POST /api/studio/samples` (`4a1d754`)
- [x] `GET /api/studio/samples/[id]` (`3ea309c`)
- [x] `POST /api/studio/requests`, `GET /api/studio/requests` (`8085506`)
- [x] `GET /api/studio/requests/[id]` with owner+admin guard (`1253c5b`)
- [x] `POST /api/studio/requests/[id]/claim`, `deliver`, `reject`, `fail` (`6da651d`)
- [x] `POST /api/studio/billing/checkout` (`7102109`)
- [x] `POST /api/studio/billing/portal` (`fe88e1d`)
- [x] `POST /api/stripe/webhook` — signature verify + idempotency (`a6401ac`)

## Sprint 4 — Creator UI ✅ Plan B3 complete

- [x] `src/app/(studio)/studio/layout.tsx` (`786f0ba`)
- [x] `src/app/(studio)/studio/page.tsx` landing (`39faf1b`)
- [x] `src/app/(studio)/studio/samples/page.tsx` gallery (`4eb5f05`)
- [x] `src/app/(studio)/studio/samples/[id]/page.tsx` (`bc536dc`)
- [x] `src/features/ai-studio/components/RequestForm.tsx` (`4d518e0`)
- [x] `src/app/(studio)/studio/requests/page.tsx` + `[id]/page.tsx` (`5bbd095`)
- [x] `src/app/(studio)/studio/billing/page.tsx` + `BillingActions` (`1a532cf`)
- [x] Shared components: `SampleCard` (`761f861`), `QuotaBadge` (`786f0ba`), `StatusBadge` (`0183bd9`)
- [ ] Mobile responsiveness pass at 375 / 768 / 1024 (deferred to Plan C polish)
- [ ] Manual UI smoke test against `npm run dev` with seeded `creator-starter@test.local`

## Sprint 5 — Admin UI ✅ Plan C1 complete

- [x] `src/app/(studio)/admin/studio/layout.tsx` — STUDIO_ADMIN guard (`ffba426`)
- [x] `src/app/(studio)/admin/studio/page.tsx` — counts dashboard (`fd26d61`)
- [x] `src/app/(studio)/admin/studio/samples/page.tsx` — sample list (`7590b19`)
- [x] `src/app/(studio)/admin/studio/samples/new/page.tsx` — upload form (signed-URL direct upload) (`0141ea5`)
- [x] `src/app/(studio)/admin/studio/samples/[id]/edit/page.tsx` — edit + archive (`6be92b7`)
- [x] `src/app/(studio)/admin/studio/requests/page.tsx` — queue (PENDING + IN_PROGRESS by default) (`556e72d`)
- [x] `src/app/(studio)/admin/studio/requests/[id]/page.tsx` — claim/deliver/reject/fail/release panel + output upload (`9e2ce54`)
- Supporting services + APIs: stats (`d03261b`), sample-upload-URL (`ab58757`), output-upload-URL (`ac1ba0f`), sample PATCH + archive (`4c6e98d`), release route inside `9e2ce54`.

## Sprint 6 — Notifications

- [ ] Email templates: delivered, rejected, failed, upgraded, payment-failed
- [ ] Wire email sends into request transitions and Stripe webhook handlers
- [ ] In-app dot indicator on `/studio/requests` nav tab when undelivered DELIVERED unread

## Sprint 7 — Tests

- [ ] Unit: `quota.ts`, `requests.ts`, `stripe.ts` mappers, all Zod schemas
- [ ] Integration: 10-concurrent quota race, invalid state transitions, Stripe webhook idempotency
- [ ] E2E happy paths (8 scenarios from spec §11)
- [ ] Add Mobile Safari + Pixel 5 projects to `playwright.config.ts`

## Sprint 8 — Polish & launch prep

- [ ] Lighthouse run on `/studio` + `/studio/samples`; meet LCP < 2.5s, INP < 200ms, JS budget ≤ 150KB gzip
- [ ] Bundle audit (`@next/bundle-analyzer`) for studio routes
- [ ] CSP review for Stripe Checkout iframe
- [ ] README / `docs/architecture.md` updated with studio module reference
- [ ] If on `feat/dev-harness`-merged main: update `docs/harness.md` with studio E2E entry
- [ ] Deploy to staging, smoke-test all 8 critical paths manually before tagging release

## Out of P1 (parking lot)

- [ ] Real StoryClaw API integration (push request, callback delivery) — P2
- [ ] One-click multi-platform publish (TikTok/Reels/Shorts) — P2
- [ ] Partner Creator Platform opportunity feed + commission tracking — P2
- [ ] Distribution network revenue share — P3
- [ ] FAST TV onboarding — P3
- [ ] Bulk admin operations — P1.5
- [ ] Visual regression baselines — P1.5
- [ ] Quota refund reconciliation cron — P1.5
- [ ] FTC compliance watermark generator — P2
- [ ] AI-Generated content auto-tag injection on publish — P2

---

## Open questions to resolve before Sprint 0

- Stripe already in repo? — verify `package.json` and existing webhook endpoints; if absent, add as part of Sprint 0.
- `src/lib/email.ts` on `main`? — verify; may live only on `feat/dev-harness`.
- Merge order: should `feat/dev-harness` land before or after Studio P1? — preferred: harness lands first to provide CI infra.
