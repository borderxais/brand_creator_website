# AI Video Studio — Design Spec

- **Status:** Draft (brainstorming output, awaiting plan)
- **Date:** 2026-05-05
- **Owner:** Studio team
- **Related:** [PLATFORM_PURPOSE.md](../../PLATFORM_PURPOSE.md), [docs/harness.md](../../harness.md) (lives on `feat/dev-harness`)
- **Source partnership context:** `StoryClaw_Creator_Platform_Partnership_Plan.pdf` (2026, confidential, on user's desktop)

---

## 1. Summary

Add a creator-facing **AI Video Studio** to the existing brand+creator collaboration platform. Creators browse a curated gallery of 90-second AI sample videos, submit a request describing their own story/script, and receive an AI-generated video produced via the upstream **StoryClaw** vendor (manual ops in P1 — admin operator uploads result back into the platform). Access is gated by a tiered subscription (Free trial + Starter + Pro) backed by Stripe.

This spec covers the Phase 1 MVP only. Distribution network, multi-platform publishing, partner Creator Platform integration (Grin/Aspire/etc.), FAST TV channels, and the StoryClaw real-time API integration are explicitly **out of scope** for P1 and tracked as P2+.

## 2. Goals & Non-Goals

### Goals (P1)
1. Let an authenticated creator browse AI sample videos and submit a generation request.
2. Enforce per-tier monthly quota with atomic deduction and refund on failure.
3. Provide a Stripe-backed subscription flow (Free → Starter $69/mo → Pro $199/mo).
4. Provide a STUDIO_ADMIN-only ops panel for sample upload and request fulfillment (claim/deliver/reject/fail).
5. Notify creators on terminal status changes via existing transactional email.
6. Ship Playwright E2E coverage of the critical creator + admin flows.

### Non-goals (P1)
- Real-time / API-driven StoryClaw integration (P2)
- Multi-platform publish (TikTok/Reels/Shorts) — TikTok integration exists in repo but is not wired into Studio in P1
- Distribution network revenue share (P2/P3)
- Partner Creator Platform (Grin/Aspire/etc.) opportunity feed (P2)
- FAST TV (Roku/Pluto/Tubi) onboarding (P3)
- Bulk admin operations
- Visual regression baselines
- Quota refund reconciliation job

## 3. Personas

| Persona | Identifier | What they do in P1 |
|---|---|---|
| Creator (mid-tier influencer) | `User.role = CREATOR` | Browse samples, submit requests, manage subscription, view delivered videos |
| Studio admin (StoryClaw ops liaison) | `User.role = STUDIO_ADMIN` | Upload samples, claim queue items, upload generated outputs |
| Existing platform admin | `User.role = ADMIN` | Existing platform-wide admin (unchanged; not granted Studio admin powers automatically) |

## 4. High-Level Architecture

Approach **B (feature folder + route group)** chosen during brainstorming.

```
src/
├── features/ai-studio/
│   ├── components/   SampleCard, RequestForm, QuotaBadge, StatusBadge, AdminQueueRow
│   ├── hooks/        useQuota, useSubscription, useRequests
│   ├── lib/
│   │   ├── samples.ts
│   │   ├── requests.ts
│   │   ├── quota.ts
│   │   ├── stripe.ts
│   │   └── storage.ts
│   └── types/
├── app/
│   ├── (studio)/
│   │   ├── studio/                  creator-facing
│   │   │   ├── page.tsx
│   │   │   ├── samples/[id]/page.tsx
│   │   │   ├── requests/page.tsx
│   │   │   ├── requests/[id]/page.tsx
│   │   │   └── billing/page.tsx
│   │   └── admin/studio/
│   │       ├── samples/page.tsx
│   │       ├── samples/new/page.tsx
│   │       └── requests/page.tsx
│   └── api/
│       ├── studio/
│       │   ├── samples/route.ts
│       │   ├── samples/[id]/route.ts
│       │   ├── requests/route.ts
│       │   ├── requests/[id]/route.ts
│       │   ├── requests/[id]/claim/route.ts
│       │   ├── requests/[id]/deliver/route.ts
│       │   ├── requests/[id]/reject/route.ts
│       │   ├── requests/[id]/fail/route.ts
│       │   ├── billing/checkout/route.ts
│       │   └── billing/portal/route.ts
│       ├── stripe/webhook/route.ts
│       └── dev/                     dev-only test seams (NODE_ENV !== 'production')
│           ├── login/route.ts
│           ├── subscription/route.ts
│           └── quota/advance/route.ts
```

Storage:
- `studio-samples` bucket (Supabase) — public read, admin write
- `studio-outputs` bucket — signed-URL only, admin write, owner read

Auth: existing NextAuth + Prisma `User` model.

FastAPI sidecar: not used in P1.

## 5. Data Model (Prisma additions)

### Enums

```prisma
enum PlanTier {
  FREE
  STARTER
  PRO
}

enum VideoRequestStatus {
  PENDING
  IN_PROGRESS
  DELIVERED
  REJECTED
  FAILED
}

enum SampleCategory {
  VERTICAL_DRAMA
  EMOTION_STORY
  LIFESTYLE_VLOG
  SUSPENSE_THRILLER
  OTHER
}
```

### Models

```prisma
model Sample {
  id           String          @id @default(cuid())
  title        String
  description  String?
  category     SampleCategory
  hook         String?
  previewUrl   String
  thumbnailUrl String?
  durationSec  Int             @default(90)
  isActive     Boolean         @default(true)
  uploadedById String
  uploadedBy   User            @relation("SampleUploader", fields: [uploadedById], references: [id])
  requests     VideoRequest[]
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  @@index([category, isActive])
}

model VideoRequest {
  id                String              @id @default(cuid())
  creatorId         String
  creator           User                @relation("RequestCreator", fields: [creatorId], references: [id])
  sampleId          String?
  sample            Sample?             @relation(fields: [sampleId], references: [id])

  prompt            String
  styleNotes        String?
  targetCategory    SampleCategory

  status            VideoRequestStatus  @default(PENDING)
  outputUrl         String?
  outputDurationSec Int?
  rejectionReason   String?

  claimedById       String?
  claimedBy         User?               @relation("RequestClaimer", fields: [claimedById], references: [id])
  claimedAt         DateTime?
  deliveredAt       DateTime?

  subscriptionId    String?
  subscription      Subscription?       @relation(fields: [subscriptionId], references: [id])
  quotaConsumed     Boolean             @default(true)

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([creatorId, status])
  @@index([status, createdAt])
}

model Subscription {
  id                   String          @id @default(cuid())
  userId               String          @unique
  user                 User            @relation("UserSubscription", fields: [userId], references: [id])

  tier                 PlanTier        @default(FREE)
  stripeCustomerId     String?         @unique
  stripeSubscriptionId String?         @unique
  stripePriceId        String?

  periodStart          DateTime        @default(now())
  periodEnd            DateTime
  quotaLimit           Int             @default(1)
  quotaUsed            Int             @default(0)

  cancelAtPeriodEnd    Boolean         @default(false)
  canceledAt           DateTime?

  requests             VideoRequest[]
  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt

  @@index([periodEnd])
}

model StripeEventLog {
  id         String   @id   // Stripe event.id
  type       String
  receivedAt DateTime @default(now())
  payload    Json
}
```

### `User` patches

```prisma
model User {
  // existing fields preserved
  // role: extend allowed values to include "STUDIO_ADMIN"

  subscription    Subscription?  @relation("UserSubscription")
  videoRequests   VideoRequest[] @relation("RequestCreator")
  claimedRequests VideoRequest[] @relation("RequestClaimer")
  uploadedSamples Sample[]       @relation("SampleUploader")
}
```

`User.role` stays `String` for backward compatibility. Allowed values documented in `src/features/ai-studio/types/roles.ts` constant.

## 6. Request Lifecycle (state machine)

```
              ┌────────────┐
              │  PENDING   │◀──────┐
              └─────┬──────┘       │
                    │ admin claim  │ admin release
                    ▼              │
              ┌─────────────┐      │
              │ IN_PROGRESS │──────┘
              └──────┬──────┘
        ┌────────────┼─────────────┐
        ▼            ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌────────┐
   │DELIVERED│  │ REJECTED │  │ FAILED │
   └─────────┘  └──────────┘  └────────┘
```

| From | To | Actor | Side effects |
|---|---|---|---|
| — | PENDING | Creator | Tx: assert `quotaUsed < quotaLimit` → `quotaUsed++`, insert request |
| PENDING | IN_PROGRESS | Admin | Set `claimedById`, `claimedAt` |
| IN_PROGRESS | DELIVERED | Admin | Set `outputUrl`, `deliveredAt`; email creator |
| IN_PROGRESS | REJECTED | Admin | Set `rejectionReason`; refund quota; email creator |
| IN_PROGRESS | FAILED | Admin | `rejectionReason="generation failed"`; refund quota; email creator |
| IN_PROGRESS | PENDING | Admin | Release claim |

Quota deduction guarded by Postgres `SELECT … FOR UPDATE` inside `prisma.$transaction`.

Refund increments `quotaUsed--` only if Subscription period has not rolled over since the request. Otherwise audit-only (`quotaConsumed=false`, no decrement).

## 7. Pages, Routes & UX

### Creator routes

| Route | Purpose |
|---|---|
| `/studio` | Landing — featured samples, quota badge, CTA to gallery |
| `/studio/samples` | Full gallery, filter by category, paginated 12/page |
| `/studio/samples/[id]` | Sample detail + "Request video like this" CTA |
| `/studio/requests` | "My Videos" with status tabs |
| `/studio/requests/[id]` | Request detail (status timeline + output player when DELIVERED) |
| `/studio/billing` | Plan picker + Stripe portal link |

### Admin routes

| Route | Purpose |
|---|---|
| `/admin/studio` | Ops dashboard (counts) |
| `/admin/studio/samples` | Sample list |
| `/admin/studio/samples/new` | Upload form |
| `/admin/studio/samples/[id]/edit` | Edit / archive |
| `/admin/studio/requests` | Queue (default PENDING + IN_PROGRESS) |
| `/admin/studio/requests/[id]` | Detail with claim/deliver/reject/fail actions |

### Sample upload form
- Title, Description, Category, Hook, Duration, Preview file (mp4 ≤30MB), Thumbnail (jpg/webp ≤500KB).
- File upload via signed-URL POST direct to Supabase Storage; metadata write via API route.

### Output upload (admin)
- mp4 ≤200MB, 9:16 ratio (warn if not).
- Stored as `studio-outputs/{userId}/{requestId}.mp4`.
- Bucket policy: signed URLs only, TTL 7 days.

## 8. Subscription, Billing & Quota

### Plans

| Tier | Price | Stripe price env var | Quota / month | Notes |
|---|---|---|---|---|
| FREE | $0 | n/a | 1 lifetime trial | `periodEnd = +100yr` |
| STARTER | $69/mo | `STRIPE_PRICE_STARTER` | 5 | Monthly Stripe billing cycle |
| PRO | $199/mo | `STRIPE_PRICE_PRO` | 20 | Monthly Stripe billing cycle |

### Stripe webhook events handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Activate / upgrade subscription, reset quota |
| `customer.subscription.updated` | Sync tier change, period dates, `cancelAtPeriodEnd` |
| `customer.subscription.deleted` | Downgrade to FREE, keep history |
| `invoice.paid` | Reset `quotaUsed=0`, update period dates |
| `invoice.payment_failed` | Mark `cancelAtPeriodEnd=true`, email creator |

Webhook security: verify `stripe-signature` against `STRIPE_WEBHOOK_SECRET`. Idempotent via `StripeEventLog.id`.

### Quota enforcement (atomic)

```ts
await prisma.$transaction(async (tx) => {
  const sub = await tx.$queryRaw`
    SELECT * FROM "Subscription"
    WHERE "userId" = ${userId} FOR UPDATE
  `;
  if (!sub) throw new HttpError(403);
  if (sub.periodEnd < new Date()) throw new HttpError(409, "period expired");
  if (sub.quotaUsed >= sub.quotaLimit) throw new HttpError(402, "quota exhausted");

  await tx.subscription.update({
    where: { id: sub.id },
    data: { quotaUsed: { increment: 1 } },
  });
  return tx.videoRequest.create({ data: { ..., subscriptionId: sub.id } });
});
```

### Edge cases
- Race: row lock prevents concurrent over-spend.
- Webhook out-of-order: dedupe by `event.id`.
- Refund on REJECTED/FAILED: same period only.
- FREE → STARTER: lifetime trial counter discarded; new monthly window.
- Plan downgrade: only at period end (handled by Stripe portal).

## 9. Notifications & Emails

P1 transactional only, via existing `src/lib/email.ts`.

| Event | Subject | CTA |
|---|---|---|
| Request DELIVERED | "Your video is ready" | View video |
| Request REJECTED | "Update on your AI video request" | View reason / Retry |
| Request FAILED | "We couldn't complete your request" | Retry (refund noted) |
| Subscription upgraded | "Welcome to {Tier}" | Open Studio |
| Payment failed | "Payment failed" | Update card |

In-app: status badges + a single dot indicator on `/studio/requests` tab in nav.

## 10. Error Handling

| Code | Meaning | UI |
|---|---|---|
| 400 | Validation | inline field errors |
| 401 | Not signed in | redirect `/login?next=...` |
| 402 | Quota exhausted | upgrade modal |
| 403 | Forbidden | 403 page |
| 409 | State conflict | "Try again" toast |
| 429 | Rate-limited | "Slow down" toast |
| 500 | Internal | banner with request id |

Stripe webhook returns 5xx on internal failure; Stripe retries.
Storage upload failures bubble to client; request not created.
Quota refund failure on reject/fail does not block status change; logged.

## 11. Testing Strategy

### Unit (Vitest)
- `lib/quota.ts` — deduction, refund, period rollover
- `lib/requests.ts` — state transition validation
- `lib/stripe.ts` — webhook event mapping
- Zod schemas

### Integration (Vitest + Prisma)
- Quota race: 10 concurrent submits → exactly `quotaLimit` succeed
- State machine: invalid transitions rejected
- Stripe webhook idempotency

### E2E (Playwright)
Critical paths in P1:

1. Creator request happy path
2. Quota enforcement + upgrade CTA
3. Upgrade flow via dev seam
4. Quota rollover via dev seam
5. Admin claim + deliver
6. Creator sees DELIVERED + downloads
7. Admin reject (refund)
8. Admin sample upload visible in gallery

Mobile viewports: add `Mobile Safari`, `Pixel 5` projects to `playwright.config.ts`.

## 12. E2E Hard Blockers

| # | Blocker | Fix |
|---|---|---|
| 1 | Auth bypass | dev-only `/api/dev/login` (gated `NODE_ENV !== 'production'`) issues session cookie for known seeded user; OR Playwright `storageState` captured once |
| 2 | Stripe state seam | dev-only `POST /api/dev/subscription` to set `{ tier, quotaUsed }` directly |
| 3 | Quota rollover | dev-only `POST /api/dev/quota/advance` to bump `periodEnd` and reset `quotaUsed` |
| 4 | `webServer` autostart | add `webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: !CI }` in `playwright.config.ts` |

Soft items (acceptable, opportunistic): seeded test users in `prisma/seed.dev.js`, committed video fixture `e2e/fixtures/sample-90s.mp4` (~100KB), email transport no-op when `EMAIL_DEV_NOOP=1`, rate limiter bypass when `E2E_BYPASS_RATELIMIT=1`.

## 13. Security & Privacy

- All Studio API routes require auth (server-side session check).
- Admin routes additionally require `role === 'STUDIO_ADMIN'`.
- Stripe webhook signature verified.
- `studio-outputs` bucket: signed-URL only; signing scoped to `userId === request.creatorId` or admin.
- No PII added beyond existing `User`. Prompts may contain user content — store as-is, do not log full bodies in error reporters.
- Rate limit `POST /api/studio/requests` (per user): 10 / minute (well above natural use).
- CSP / headers: inherit existing site policy. No new third-party script except Stripe Checkout (already approved hosted page).

## 14. Performance Budget

- LCP < 2.5s, INP < 200ms on `/studio`, `/studio/samples`
- Studio per-page JS budget ≤ 150KB gzipped
- Sample previews lazy-loaded with poster image
- Cursor-based pagination; no `OFFSET`
- Supabase signed URL TTL = 7 days; re-sign on each "My Videos" load

## 15. Out of Scope (P2+)

| Feature | Phase |
|---|---|
| Real StoryClaw API integration (push request, callback delivery) | P2 |
| Multi-platform publish (TikTok / Reels / Shorts) one-click | P2 |
| Partner Creator Platform opportunity feed (Grin/Aspire/etc.) + commission tracking | P2 |
| StoryClaw 500-account distribution network revenue share | P3 |
| FAST TV (Roku/Pluto/Tubi) onboarding | P3 |
| Bulk admin operations | P1.5 |
| Visual regression baselines | P1.5 |
| Quota refund reconciliation job | P1.5 |
| FTC compliance watermark generator | P2 |
| AI-Generated content tag auto-injection on publish | P2 |

## 16. Open Questions

- Does the existing platform already use Stripe? Reuse customer ID and webhook plumbing if so.
- Does `src/lib/email.ts` exist on `main`? (verify when implementing — may live on `feat/dev-harness` only)
- Sample uploader role: only STUDIO_ADMIN, or also a separate "content curator" role? P1 = STUDIO_ADMIN only.
- Free trial reset on email-verify completion or on first signup? P1 = on signup.

## 17. Risks

| Risk | Mitigation |
|---|---|
| Supabase Storage egress cost spikes if creators share output URLs widely | Signed-URL only with TTL; monitor egress; switch to R2/Bunny if egress exceeds threshold (revisit during P1 review) |
| Manual ops bottleneck if request volume grows | Track time-to-deliver; commit to StoryClaw API integration in P2 once volume justifies |
| Stripe webhook reliability | Dedupe via `StripeEventLog`; rely on Stripe automatic retries |
| Creator confusion over delivery time | Set expectation in UI ("typically delivered within 24h") + email on DELIVERED |
| Quota race over-spend | Postgres row lock + integration test |

---

## Appendix A — Glossary

| Term | Meaning |
|---|---|
| Sample | Pre-made 90s AI video shown to creators as a style reference |
| Request | A creator's order for an AI-generated video, derived from a sample |
| StoryClaw | Upstream AI video generation vendor (Seedance 2 engine) |
| Creator Pack | Tiered subscription granting monthly request quota |
| Studio admin | Internal operator role bridging creator requests and StoryClaw |
| Quota | Per-period count of allowable requests for a Subscription |
