# TODO — AI Video Studio P1

Working list for the Phase 1 MVP defined in [`docs/superpowers/specs/2026-05-05-ai-video-studio-design.md`](docs/superpowers/specs/2026-05-05-ai-video-studio-design.md).

A more granular implementation plan will be produced via the writing-plans skill once this spec is approved by the user. Items below are sequenced top-down.

## Sprint 0 — Foundation & Blockers

- [ ] Resolve E2E hard blocker 1 — dev-only `/api/dev/login` route gated by `NODE_ENV !== 'production'`
- [ ] Resolve E2E hard blocker 2 — dev-only `POST /api/dev/subscription` to set tier/quota directly
- [ ] Resolve E2E hard blocker 3 — dev-only `POST /api/dev/quota/advance` for period rollover
- [ ] Resolve E2E hard blocker 4 — add `webServer` config to `playwright.config.ts`
- [ ] Add `prisma/seed.dev.js` with creator/admin test users (`creator-free@test.local`, `creator-starter@test.local`, `creator-pro@test.local`, `admin@test.local`)
- [ ] Commit `e2e/fixtures/sample-90s.mp4` (~100KB stub) and `e2e/fixtures/output-sample.mp4`
- [ ] Add `EMAIL_DEV_NOOP` env flag handling in `src/lib/email.ts` (or shim if file lives only on `feat/dev-harness`)
- [ ] Add `E2E_BYPASS_RATELIMIT` flag in `src/lib/rate-limiter.ts`
- [ ] Confirm Stripe test-mode keys + create Starter / Pro Price IDs in Stripe dashboard

## Sprint 1 — Data model & schema

- [ ] Prisma migration: add `Sample`, `VideoRequest`, `Subscription`, `StripeEventLog` models + enums (`PlanTier`, `VideoRequestStatus`, `SampleCategory`)
- [ ] Patch `User` model with new relations
- [ ] Document `STUDIO_ADMIN` allowed value in `src/features/ai-studio/types/roles.ts`
- [ ] Run migration locally; update `prisma/seed.dev.js` to backfill default `Subscription` for seeded users
- [ ] Add `prisma-drift.js` check passes

## Sprint 2 — Core services (server-side)

- [ ] `src/features/ai-studio/lib/quota.ts` — atomic deduct + refund + rollover helpers (with row lock)
- [ ] `src/features/ai-studio/lib/requests.ts` — state machine validation + transition helpers
- [ ] `src/features/ai-studio/lib/samples.ts` — Sample CRUD + signed-URL helpers
- [ ] `src/features/ai-studio/lib/storage.ts` — Supabase bucket helpers (`studio-samples`, `studio-outputs`)
- [ ] `src/features/ai-studio/lib/stripe.ts` — Stripe SDK wrapper + price lookups
- [ ] Create Supabase buckets `studio-samples` (public read) and `studio-outputs` (private + signed URL)
- [ ] Zod schemas for request submit, sample upload, deliver, reject, fail

## Sprint 3 — API routes

- [ ] `GET /api/studio/samples` (list, filter, paginate)
- [ ] `POST /api/studio/samples` (admin only)
- [ ] `GET /api/studio/samples/[id]`
- [ ] `POST /api/studio/requests` (creator) — atomic quota deduction
- [ ] `GET /api/studio/requests` (creator, own only)
- [ ] `GET /api/studio/requests/[id]`
- [ ] `POST /api/studio/requests/[id]/claim` (admin)
- [ ] `POST /api/studio/requests/[id]/deliver` (admin)
- [ ] `POST /api/studio/requests/[id]/reject` (admin)
- [ ] `POST /api/studio/requests/[id]/fail` (admin)
- [ ] `POST /api/studio/billing/checkout` — create Stripe Checkout session
- [ ] `POST /api/studio/billing/portal` — create Stripe Customer Portal session
- [ ] `POST /api/stripe/webhook` — verify signature, dedupe via `StripeEventLog`, dispatch handlers
- [ ] Shared error middleware (`HttpError` → status code mapping, request-id logging)

## Sprint 4 — Creator UI

- [ ] `src/app/(studio)/studio/layout.tsx` — quota badge, nav, auth guard
- [ ] `src/app/(studio)/studio/page.tsx` — landing with featured samples
- [ ] `src/app/(studio)/studio/samples/page.tsx` — gallery with category filter + pagination
- [ ] `src/app/(studio)/studio/samples/[id]/page.tsx` — sample detail + request CTA
- [ ] `src/features/ai-studio/components/RequestForm.tsx` — prompt + style notes form
- [ ] `src/app/(studio)/studio/requests/page.tsx` — "My Videos" with status tabs
- [ ] `src/app/(studio)/studio/requests/[id]/page.tsx` — request detail + output player
- [ ] `src/app/(studio)/studio/billing/page.tsx` — plan picker + portal link
- [ ] Shared components: `SampleCard`, `QuotaBadge`, `StatusBadge`
- [ ] Mobile responsiveness pass at 375 / 768 / 1024

## Sprint 5 — Admin UI

- [ ] `src/app/(studio)/admin/studio/layout.tsx` — STUDIO_ADMIN guard
- [ ] `src/app/(studio)/admin/studio/page.tsx` — counts dashboard
- [ ] `src/app/(studio)/admin/studio/samples/page.tsx` — sample list
- [ ] `src/app/(studio)/admin/studio/samples/new/page.tsx` — upload form (signed-URL direct upload)
- [ ] `src/app/(studio)/admin/studio/samples/[id]/edit/page.tsx` — edit + archive
- [ ] `src/app/(studio)/admin/studio/requests/page.tsx` — queue (PENDING + IN_PROGRESS by default)
- [ ] `src/app/(studio)/admin/studio/requests/[id]/page.tsx` — claim/deliver/reject/fail panel + output upload

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
