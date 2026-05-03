# Dev Pipeline Harness — Design

**Date:** 2026-05-03
**Status:** Approved (brainstorm complete; awaiting implementation plan)
**Repo:** `brand_creator_website`
**Stack:** Next.js 15 (App Router) + TypeScript, Prisma + Postgres, FastAPI (Python) backend, Netlify deploys.

---

## 1. Goal

Establish a layered, opinionated developer pipeline harness that catches defects fast, enforces strict quality gates, validates DB migrations, runs targeted smoke E2E against Netlify previews, and centralizes onboarding through a `/docs` knowledge layer.

**Non-goals:** GitHub Actions CI, Lighthouse CI, full integration test infra (testcontainers/Docker Postgres), backend pytest, exhaustive E2E coverage.

---

## 2. Decisions (locked via brainstorm)

| #   | Topic                    | Decision                                                                                                                                                         |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Harness scope            | Local pre-commit + Netlify preview gates + DB migration safety + FastAPI checks. **No GitHub Actions CI.**                                                       |
| 2   | Strictness               | **Strict reset.** Re-enable disabled ESLint rules, fail build on ESLint/TS errors, fix existing violations as part of rollout.                                   |
| 3   | Test harness             | **Mid.** Vitest unit (lib + components) + Playwright smoke E2E (login, brand portal, creator portal landing). Pre-commit runs unit; E2E on demand + preview.     |
| 4   | Pre-commit tooling       | **Husky + lint-staged.** Claude Code hooks added as bonus layer.                                                                                                 |
| 5   | Formatter                | **Prettier.**                                                                                                                                                    |
| 6   | DB migration safety      | **Drift detect only.** `prisma migrate diff` schema-vs-migrations check.                                                                                         |
| 7   | Netlify preview gate     | **Build + smoke E2E** against `$DEPLOY_PRIME_URL` via Netlify Build Plugin.                                                                                      |
| 8   | FastAPI checks           | **Lint+format+typecheck.** Ruff + mypy. No tests.                                                                                                                |
| 9   | Polyglot orchestration   | **Unified Husky + lint-staged dispatch** by file glob (Node + Python in single hook chain).                                                                      |
| 10  | Smoke E2E execution site | **Netlify Build Plugin** (`onSuccess`), colocated in repo.                                                                                                       |
| 11  | Knowledge layer          | **`/docs/` directory at repo root** covering architecture/frontend/backend/database/harness/deployment/contributing. Referenced from every hook failure message. |

---

## 3. Layered Architecture

Six layers, fast → slow. Each layer fails closed and points at `docs/`.

### Layer 0: Knowledge

`/docs/` at repo root. Read on onboarding. Linked from every hook failure.

```
docs/
├── README.md            # index + reading order
├── architecture.md      # system overview, request flow, repo map
├── frontend.md          # Next.js App Router layout, src/ tour, conventions
├── backend.md           # FastAPI service, run scripts, env, route map
├── database.md          # Prisma schema, migration workflow, seeding
├── harness.md           # pipeline overview, all hook layers, bypass rules
├── deployment.md        # Netlify config, env vars, preview gates, rollback
├── contributing.md      # edit → commit → push → preview lifecycle
└── superpowers/         # design specs (this file lives here)
```

Cross-links between siblings. Code references use `path:line`. Each file ends with a "When to update" note.

### Layer 1: Edit-time (IDE / Claude Code)

- Prettier on save (VSCode `editor.formatOnSave`).
- ESLint LSP shows violations live.
- `tsc` LSP via `@typescript/language-service`.
- Pylance/Pyright in `backend/` workspace folder.
- `.vscode/settings.json` committed; baseline shared.
- Claude Code PostToolUse hooks (Write|Edit) run Prettier + ESLint --fix on the edited file. Configured in `.claude/settings.json`.

**Target:** sub-second feedback.

### Layer 2: Pre-commit (Husky + lint-staged)

Single `pre-commit` hook. `lint-staged` dispatches by file glob:

| Glob                       | Actions                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| `*.{ts,tsx,js,jsx,mjs}`    | `prettier --write` → `eslint --fix --max-warnings=0`              |
| `*.{ts,tsx}`               | `tsc --noEmit` scoped to changed files via `tsc-files`            |
| `prisma/schema.prisma`     | `prisma format` → `prisma migrate diff --exit-code` (drift check) |
| `backend/**/*.py`          | `ruff format` → `ruff check --fix` → `mypy` on changed files      |
| `*.{json,md,yml,yaml,css}` | `prettier --write`                                                |

Hook fails closed. Bypass requires explicit `--no-verify` (logged in `docs/harness.md`).

**Target:** <10 s on typical staged set.

### Layer 3: Pre-push (Husky)

Full-repo checks. Single `pre-push` hook:

```
1. tsc --noEmit (full)
2. eslint . --max-warnings=0
3. prisma migrate diff --exit-code (full drift)
4. vitest run (unit suite)
5. ruff check backend/
6. mypy backend/
```

**Target:** <60 s.

### Layer 4: Local on-demand

Manual scripts in `package.json`:

- `npm run e2e` — Playwright smoke vs local dev server.
- `npm run e2e:preview` — Playwright smoke vs `$DEPLOY_PRIME_URL`.
- `npm run harness:full` — runs Layer 3 + E2E + full mypy.
- `npm run harness:install` — bootstrap (Husky install, env scaffold, banner).

### Layer 5: Netlify preview

`netlify.toml` build command unchanged. Adds Netlify Build Plugin colocated at `plugins/smoke-e2e/`.

```
1. npx prisma generate
2. next build
3. plugin onSuccess hook:
   - install Playwright browsers (cached)
   - run smoke suite vs $DEPLOY_PRIME_URL
   - fail deploy on smoke failure
```

Smoke suite covers: `/login`, `/brandportal` landing, `/creatorportal` landing, `/find-creators`. Each: page renders, no `console.error`, primary CTA visible.

---

## 4. Components

### 4.1 Strict reset (one-time prep PR)

Lands **before** harness PR. Scope:

- Re-enable in `.eslintrc.json`: `@typescript-eslint/no-unused-vars` (with `_` prefix exception), `react/no-unescaped-entities`, `@next/next/no-img-element`, `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `no-unused-vars`.
- Flip `next.config.js`: `eslint.ignoreDuringBuilds = false`, `typescript.ignoreBuildErrors = false`.
- Fix all resulting violations. Refactors stay surgical (no scope creep).
- Land `tsconfig.json` with `"strict": true` if not already.

### 4.2 Husky configuration

```
.husky/
├── pre-commit          # exec lint-staged
├── pre-push            # exec npm run harness:prepush
└── _/husky.sh
```

`package.json` additions:

```jsonc
{
  "scripts": {
    "prepare": "husky install && node scripts/harness/banner.js",
    "harness:install": "npm install && npm run prepare",
    "harness:prepush": "tsc --noEmit && eslint . --max-warnings=0 && node scripts/harness/prisma-drift.js && vitest run && ruff check backend && mypy backend",
    "harness:full": "npm run harness:prepush && npm run e2e",
    "test": "vitest",
    "test:run": "vitest run",
    "e2e": "playwright test",
    "e2e:preview": "PLAYWRIGHT_BASE_URL=$DEPLOY_PRIME_URL playwright test",
    "lint": "eslint . --max-warnings=0",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx,mjs}": ["prettier --write", "eslint --fix --max-warnings=0"],
    "*.{ts,tsx}": ["tsc-files --noEmit"],
    "prisma/schema.prisma": ["prisma format", "node scripts/harness/prisma-drift.js"],
    "backend/**/*.py": ["ruff format", "ruff check --fix", "node scripts/harness/mypy-staged.js"],
    "*.{json,md,yml,yaml,css}": ["prettier --write"],
  },
}
```

### 4.3 Prettier

`.prettierrc.json` (minimal, project-defaulted):

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

`.prettierignore`: `.next/`, `node_modules/`, `prisma/migrations/`, `public/`, `backend/.venv/`.

### 4.4 Vitest scaffolding

- `vitest.config.ts` — jsdom env, path alias `@/` → `src/`, setup file `vitest.setup.ts`.
- `vitest.setup.ts` — `@testing-library/jest-dom` matchers.
- Tests colocated: `src/lib/foo.ts` ↔ `src/lib/foo.test.ts`; `src/components/x/X.tsx` ↔ `src/components/x/X.test.tsx`.
- Initial seed tests: 3-5 critical utilities in `src/lib/`. Coverage target deferred until layer matures.

### 4.5 Playwright smoke E2E

- `playwright.config.ts` — Chromium only for smoke; baseURL from `PLAYWRIGHT_BASE_URL` env (defaults `http://localhost:3000`).
- `e2e/smoke/` — one spec per critical surface:
  - `auth.spec.ts` — `/login` renders, form fields present.
  - `brand-portal.spec.ts` — `/brandportal` landing renders, no console errors.
  - `creator-portal.spec.ts` — `/creatorportal` landing renders, no console errors.
  - `find-creators.spec.ts` — `/find-creators` renders.
- No fixture data dependence. Public pages only. Auth-gated flows deferred.
- Screenshot on failure → uploaded to Netlify deploy log via plugin.

### 4.6 Netlify build plugin

Path: `plugins/smoke-e2e/`. Local plugin (no npm publish).

```
plugins/smoke-e2e/
├── manifest.yml         # name: smoke-e2e
├── index.js             # onSuccess handler
└── package.json         # @playwright/test devDependency reuse
```

`netlify.toml` additions:

```toml
[[plugins]]
  package = "/plugins/smoke-e2e"
```

`index.js` outline:

```js
module.exports = {
  async onSuccess({ utils }) {
    const url = process.env.DEPLOY_PRIME_URL;
    if (!url) return; // production deploys: skip smoke (preview-only gate)
    try {
      await utils.run.command(`PLAYWRIGHT_BASE_URL=${url} npx playwright test e2e/smoke`);
    } catch (err) {
      utils.build.failPlugin("Smoke E2E failed. See docs/deployment.md#preview-gates", {
        error: err,
      });
    }
  },
};
```

### 4.7 Prisma drift check

`scripts/harness/prisma-drift.js`:

- Runs `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --exit-code`.
- Exit 2 → drift; print "Schema drift. Run `npm run prisma:migrate` to create migration. See docs/database.md#migration-workflow".
- Exit 0 → pass.

### 4.8 FastAPI tooling

`backend/pyproject.toml` (new):

```toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "SIM"]

[tool.mypy]
python_version = "3.11"
strict = true
ignore_missing_imports = true
```

`backend/requirements-dev.txt`: `ruff`, `mypy`. Devs run `pip install -r backend/requirements-dev.txt` once during onboarding (documented in `docs/backend.md`).

### 4.9 Onboarding banner

`scripts/harness/banner.js` — runs after `husky install` (in `prepare`):

```
============================================================
  brand_creator_website — dev harness installed.
  Read docs/harness.md before your first commit.
  New here? Start at docs/README.md.
============================================================
```

Idempotent. Runs on every `npm install`.

### 4.10 `/docs/` content (initial)

| File              | Sections                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`       | Reading order, repo tour, env setup quickstart                                                                                   |
| `architecture.md` | High-level diagram (text), request flow (Next → Prisma → Postgres; Next → FastAPI), repo map                                     |
| `frontend.md`     | App Router layout, route groups (`brandportal`, `creatorportal`, `find-creators`, `login`), `src/` tour, Tailwind tokens, naming |
| `backend.md`      | FastAPI service purpose, `backend/app/main` entry, run scripts, env vars, route map                                              |
| `database.md`     | Prisma schema model overview, **#migration-workflow** (anchor used by drift hook), seeding, env (`DATABASE_URL`/`DIRECT_URL`)    |
| `harness.md`      | All six layers, every hook, bypass rules, troubleshooting per failure type                                                       |
| `deployment.md`   | `netlify.toml` walkthrough, env vars, **#preview-gates** (anchor used by smoke E2E plugin), rollback procedure                   |
| `contributing.md` | Lifecycle: edit → commit → push → preview → merge. Cross-references rules in `AGENTS.md`                                         |

`AGENTS.md` and root `README.md` updated to point at `docs/README.md` as canonical entrypoint.

---

## 5. File Layout (additions)

```
.husky/
  pre-commit
  pre-push
.vscode/
  settings.json          (formatOnSave, eslint, python interpreter)
docs/
  README.md
  architecture.md
  frontend.md
  backend.md
  database.md
  harness.md
  deployment.md
  contributing.md
  superpowers/specs/2026-05-03-dev-pipeline-harness-design.md
e2e/
  smoke/
    auth.spec.ts
    brand-portal.spec.ts
    creator-portal.spec.ts
    find-creators.spec.ts
plugins/
  smoke-e2e/
    manifest.yml
    index.js
    package.json
scripts/
  harness/
    banner.js
    prisma-drift.js
    mypy-staged.js
backend/
  pyproject.toml
  requirements-dev.txt
.prettierrc.json
.prettierignore
playwright.config.ts
vitest.config.ts
vitest.setup.ts
CONTRIBUTING.md          (one-page redirect to docs/README.md)
```

`package.json`, `.eslintrc.json`, `next.config.js`, `netlify.toml`, `tsconfig.json` modified.

---

## 6. Failure UX

Every blocking hook prints:

1. What failed.
2. Concrete fix command.
3. Doc anchor: `docs/<file>.md#<anchor>`.

Examples:

```
[pre-commit] ESLint: 3 errors in src/app/login/page.tsx
  Fix: npm run lint -- --fix
  See: docs/harness.md#layer-2-pre-commit
```

```
[pre-commit] Prisma schema drift detected.
  Fix: npm run prisma:migrate
  See: docs/database.md#migration-workflow
```

```
[netlify smoke] /login failed render assertion.
  See: docs/deployment.md#preview-gates
```

---

## 7. Rollout Order

1. **PR 1: Strict reset.** Re-enable ESLint rules, flip `next.config.js`, fix violations. Independently mergeable.
2. **PR 2: `/docs/` skeleton.** All eight files, content seeded, anchors stable. No code changes.
3. **PR 3: Prettier + Husky + lint-staged + Layer 2 hooks.** Format whole repo in single commit. Add `prepare`, banner.
4. **PR 4: Vitest scaffold + 3-5 seed tests + Layer 3 pre-push hook.**
5. **PR 5: Prisma drift script + drift hook wiring.**
6. **PR 6: FastAPI Ruff + mypy config + Layer 2 Python globs.**
7. **PR 7: Playwright config + smoke specs + `npm run e2e` script.**
8. **PR 8: Netlify smoke plugin + `netlify.toml` wiring.**
9. **PR 9: Claude Code hooks (`.claude/settings.json` PostToolUse).**

Each PR ships independently; harness becomes useful after PR 3.

---

## 8. Risks & Mitigations

| Risk                                                          | Mitigation                                                                                                           |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Strict reset PR too large                                     | Acceptable cost; one-time. If unmanageable, allow `eslint-disable` per-line with TODO + tracking issue.              |
| Pre-commit too slow                                           | Layer 2 only touches staged files. Measured target <10 s. If breached, demote rules to Layer 3.                      |
| Devs use `--no-verify`                                        | Documented bypass policy in `docs/harness.md`. Netlify preview gate catches what local skipped.                      |
| Playwright in Netlify build adds minutes                      | Smoke suite kept tiny (4 specs). Browser binary cached via Netlify cache. Acceptable trade for preview safety.       |
| `DEPLOY_PRIME_URL` missing on prod deploys                    | Plugin runs only when `$DEPLOY_PRIME_URL` set; production deploys skip smoke (preview-only gate by design).          |
| Python tooling drift across devs                              | `backend/requirements-dev.txt` pinned; `docs/backend.md` documents install. Future: pre-commit checks venv presence. |
| `tsc-files` reports false positives across project boundaries | Fall back to scoped `tsc --noEmit -p tsconfig.json` if issues; full check still runs in pre-push.                    |

---

## 9. Out of Scope

- GitHub Actions / cloud CI.
- Lighthouse CI / performance budgets.
- pytest / backend integration tests.
- Visual regression.
- Dependency vulnerability scanning (Snyk/npm audit gating).
- Auth-gated E2E flows.
- Mutation testing, coverage gates.

These are future layers; harness designed to absorb them without restructure.

---

## 10. Success Criteria

- New dev clones repo → runs `npm run harness:install` → reads `docs/README.md` → first commit blocked appropriately on lint/format/type errors.
- Schema edit without migration blocked at pre-commit with clear pointer.
- PR with broken `/login` route fails Netlify preview smoke before merge.
- FastAPI route added with type error blocked at pre-commit.
- All hook failures cite a `docs/` anchor.

---

## 11. Open Questions

None. Ready for implementation plan.
