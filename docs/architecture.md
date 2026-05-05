# Architecture

Brand + creator collaboration platform. Next.js 15 (App Router) front-end, Prisma ORM against PostgreSQL, and an optional FastAPI Python sidecar for media and platform integrations.

---

## High-Level Diagram

```
Browser ──HTTP──▶ Next.js (App Router) ─Prisma─▶ Postgres
                        │
                        └─HTTP──▶ FastAPI sidecar (backend/)
```

- **Next.js** handles all page rendering (RSC + client components) and lightweight API routes under `src/app/api/`.
- **Prisma** is the ORM; it connects to a hosted PostgreSQL instance via `DATABASE_URL` / `DIRECT_URL`.
- **FastAPI** runs as a separate process for Python-heavy workloads (TikTok integrations, media handling). It is an optional sidecar — the Next.js app degrades gracefully if it is not running.

---

## Request Flow

### Main web app

```
Browser → Next.js (App Router) → Prisma client → PostgreSQL
```

Server Components query the database directly via Prisma. Client Components call Next.js API routes (`src/app/api/**`) which in turn call Prisma.

### FastAPI sidecar

```
Browser → Next.js API route (src/app/api/**) → FastAPI (backend/app/main/main.py)
```

Next.js API routes proxy to the FastAPI service when platform-specific logic (e.g., TikTok API, Supabase storage) is needed. The FastAPI process listens on a separate port; see [backend.md](backend.md) for run instructions.

---

## Repo Map

| Path                | Owns                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/app/`          | Next.js App Router — pages, layouts, API routes                                                          |
| `src/components/`   | Shared React components (`campaigns/`, `charts/`, `providers/`, `ui/`)                                   |
| `src/lib/`          | Utilities and singletons: `auth.ts`, `email.ts`, `prisma.ts`, `rate-limiter.ts`, `tokens.ts`, `utils.ts` |
| `src/styles/`       | Global CSS                                                                                               |
| `src/types/`        | Shared TypeScript types                                                                                  |
| `src/middleware.ts` | Next.js middleware (auth guards, redirects)                                                              |
| `pages/`            | Legacy error fallbacks only — do not add routes here                                                     |
| `prisma/`           | `schema.prisma`, migrations under `prisma/migrations/`, seed script `prisma/seed.js`                     |
| `backend/`          | FastAPI service (`backend/app/main/`), run scripts, `requirements.txt`                                   |
| `public/`           | Static assets served at `/`                                                                              |
| `plugins/`          | Local Netlify build plugins (added by later harness PRs)                                                 |
| `scripts/`          | Repo automation scripts (added by later harness PRs)                                                     |
| `docs/`             | Canonical reference — this directory                                                                     |

### Key config files

| File                   | Purpose                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `next.config.js`       | Next.js config; image domains, CORS headers, strict lint/TS flags |
| `tailwind.config.ts`   | Tailwind design tokens and content paths                          |
| `netlify.toml`         | Build command, publish dir, plugin registrations                  |
| `tsconfig.json`        | TypeScript compiler options (strict mode)                         |
| `prisma/schema.prisma` | Database schema — source of truth for models                      |

---

## Key Design Constraints

- **No GitHub Actions CI.** Quality gates will run locally (pre-commit / pre-push — not yet wired; see [harness.md](harness.md)) and on Netlify preview deploys.
- **Monorepo, one `package.json`.** Node and Python tooling coexist; Python deps live in `backend/requirements.txt`.
- **Netlify deploy.** Build command is `npx prisma generate && next build`. See [deployment.md](deployment.md).

---

## When to Update

Update this file when:

- A new top-level directory is added.
- The request flow changes (e.g., a new sidecar service, a new database).
- A major config file is added or removed.
