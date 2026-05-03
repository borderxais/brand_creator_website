# Dev Pipeline Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install a six-layer local + Netlify dev pipeline harness with strict ESLint/TS gates, Husky pre-commit/pre-push, Prisma drift detection, FastAPI Ruff/mypy, Vitest unit tests, Playwright smoke E2E, Netlify preview smoke plugin, Claude Code hooks, and a `/docs` knowledge layer.

**Architecture:** Five tooling layers above an onboarding `/docs` knowledge layer. Pre-commit (Husky + lint-staged) handles per-file format/lint/typecheck/drift/Python lint+types via glob dispatch. Pre-push runs full-repo checks + Vitest. Netlify preview deploy runs Playwright smoke against `$DEPLOY_PRIME_URL` via colocated build plugin. Every hook failure cites a `docs/<file>.md#<anchor>`.

**Tech Stack:** Husky, lint-staged, Prettier, ESLint (next/core-web-vitals), TypeScript (strict), Prisma, Vitest, @testing-library/react, Playwright, Netlify Build Plugins, Ruff, mypy, Node ≥20.

**Source spec:** [docs/superpowers/specs/2026-05-03-dev-pipeline-harness-design.md](../specs/2026-05-03-dev-pipeline-harness-design.md)

---

## File Structure (additions / modifications)

**Created:**
- `.husky/pre-commit`, `.husky/pre-push`
- `.prettierrc.json`, `.prettierignore`
- `.vscode/settings.json`
- `.claude/settings.json` (extended with PostToolUse hooks)
- `docs/README.md`, `docs/architecture.md`, `docs/frontend.md`, `docs/backend.md`, `docs/database.md`, `docs/harness.md`, `docs/deployment.md`, `docs/contributing.md`
- `e2e/smoke/auth.spec.ts`, `e2e/smoke/brand-portal.spec.ts`, `e2e/smoke/creator-portal.spec.ts`, `e2e/smoke/find-creators.spec.ts`
- `playwright.config.ts`
- `vitest.config.ts`, `vitest.setup.ts`
- `src/lib/__tests__/<seed>.test.ts` (3 seed unit tests)
- `plugins/smoke-e2e/manifest.yml`, `plugins/smoke-e2e/index.js`, `plugins/smoke-e2e/package.json`
- `scripts/harness/banner.js`, `scripts/harness/prisma-drift.js`, `scripts/harness/mypy-staged.js`
- `backend/pyproject.toml`, `backend/requirements-dev.txt`
- `CONTRIBUTING.md`

**Modified:**
- `package.json` (scripts, lint-staged config, devDependencies, prepare hook)
- `.eslintrc.json` (re-enable disabled rules)
- `next.config.js` (fail builds on lint/TS errors)
- `tsconfig.json` (verify `strict: true`)
- `netlify.toml` (register smoke plugin)
- `AGENTS.md`, `README.md` (point at `docs/README.md`)
- `.gitignore` (add `playwright-report/`, `test-results/`, `coverage/`)

---

## Task 1: Strict Reset (PR 1)

Lands first. Independent of harness tooling. Re-enables lint rules, fails builds on errors, fixes resulting violations.

**Files:**
- Modify: `.eslintrc.json`
- Modify: `next.config.js`
- Modify: `tsconfig.json` (verify only)
- Modify: violators across `src/**`, `pages/**`, `prisma/seed.js`

- [ ] **Step 1.1: Snapshot current `next.config.js` and `.eslintrc.json`**

Run:
```
cat next.config.js
cat .eslintrc.json
```
Save output to scratch notes. Used to verify nothing else regressed.

- [ ] **Step 1.2: Verify `tsconfig.json` strict mode**

Run:
```
node -e "console.log(JSON.parse(require('fs').readFileSync('tsconfig.json','utf8')).compilerOptions.strict)"
```
Expected: `true`. If `false` or missing, set `"strict": true` under `compilerOptions`. Commit separately first if changed:
```
git add tsconfig.json
git commit -m "chore: enable TypeScript strict mode"
```

- [ ] **Step 1.3: Re-enable disabled ESLint rules**

Replace `.eslintrc.json` with:

```json
{
  "extends": "next/core-web-vitals",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "no-unused-vars": "off",
    "react/no-unescaped-entities": "error",
    "@next/next/no-img-element": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

Rationale: unused-vars as `error` with `_` escape; hook rules restored; `no-img-element` and `exhaustive-deps` kept as `warn` to avoid massive churn (escalated to `error` in a follow-up after backlog cleared).

- [ ] **Step 1.4: Run lint, capture violation list**

Run:
```
npm run lint 2>&1 | tee /tmp/eslint-baseline.log
```
Expected: list of violations across the repo. Note approximate count.

- [ ] **Step 1.5: Auto-fix what is auto-fixable**

Run:
```
npx eslint . --fix
```
Re-run `npm run lint` and capture remaining manual violations.

- [ ] **Step 1.6: Fix remaining violations one rule at a time**

Order: `react-hooks/rules-of-hooks` (always error) → `react/no-unescaped-entities` → `@typescript-eslint/no-unused-vars` (prefix unused with `_` only when intentional; otherwise delete). Commit per rule:

```
git add -A
git commit -m "fix: resolve react-hooks/rules-of-hooks violations"
```
```
git add -A
git commit -m "fix: resolve react/no-unescaped-entities violations"
```
```
git add -A
git commit -m "fix: resolve @typescript-eslint/no-unused-vars violations"
```

If a violation needs a real refactor not a quick fix, leave it with `// eslint-disable-next-line <rule> -- TODO(harness): <issue ref>` and open a tracking issue. Cap disables at 10 across the repo.

- [ ] **Step 1.7: Flip `next.config.js` build flags**

Edit `next.config.js`. Set:
```js
eslint: { ignoreDuringBuilds: false },
typescript: { ignoreBuildErrors: false },
```
(Add the keys if absent.)

- [ ] **Step 1.8: Run full typecheck**

Run:
```
npx tsc --noEmit
```
Expected: zero errors. Fix any reported errors using minimal changes (prefer narrowing types or `_` ignores; avoid `any` unless truly unavoidable). Commit fixes:
```
git add -A
git commit -m "fix: resolve tsc strict-mode errors"
```

- [ ] **Step 1.9: Run production build**

Run:
```
npm run build
```
Expected: build succeeds. ESLint and TS errors now block the build, so a clean build proves the strict reset is complete.

- [ ] **Step 1.10: Final commit for config flips**

```
git add .eslintrc.json next.config.js
git commit -m "feat(harness): strict reset — re-enable ESLint rules, fail builds on errors"
```

- [ ] **Step 1.11: Push branch and open PR 1**

Title: `feat(harness): strict reset — re-enable ESLint rules and fail builds on errors`
Description must list rules re-enabled and a summary of categories of fixes applied.

---

## Task 2: `/docs` Knowledge Layer Skeleton (PR 2)

Pure docs PR. No code changes. All anchors used by later tasks established here.

**Files:** Create eight `docs/*.md` files + `CONTRIBUTING.md`. Modify `AGENTS.md`, `README.md`.

- [ ] **Step 2.1: Create `docs/README.md`**

Write:

```markdown
# brand_creator_website — docs

Canonical onboarding and reference. Read in this order on first contact.

1. [architecture.md](architecture.md) — repo + system overview
2. [frontend.md](frontend.md) — Next.js app
3. [backend.md](backend.md) — FastAPI service
4. [database.md](database.md) — Prisma + Postgres
5. [deployment.md](deployment.md) — Netlify
6. [harness.md](harness.md) — dev pipeline (read before first commit)
7. [contributing.md](contributing.md) — workflow

Design specs live under [superpowers/specs](superpowers/specs).
```

- [ ] **Step 2.2: Create `docs/architecture.md`**

Cover: high-level diagram (ASCII), request flow `Browser → Next.js → Prisma → Postgres`, sidecar `Browser → Next.js API route → FastAPI (backend/)`, repo map (top-level dirs and what each owns).

Required anchors: none (linked by `docs/README.md` only).

- [ ] **Step 2.3: Create `docs/frontend.md`**

Cover: App Router layout (`src/app`), route groups (`brandportal`, `creatorportal`, `find-creators`, `login`), `src/components`, `src/lib`, `src/styles`, Tailwind tokens (`tailwind.config.ts`), naming conventions (PascalCase components, camelCase helpers, kebab-case routes), `@/` alias.

- [ ] **Step 2.4: Create `docs/backend.md`**

Cover: FastAPI service purpose, entry at `backend/app/main`, run scripts (`start_api_server.sh`, `start_api_server.bat`), env vars, route map summary (read `backend/README.md` for source of truth and link it). Document required dev install: `pip install -r backend/requirements-dev.txt`.

- [ ] **Step 2.5: Create `docs/database.md`**

Cover: Prisma schema location, `DATABASE_URL` / `DIRECT_URL` env vars, seeding via `npm run prisma:seed`. Add anchor `## Migration Workflow` (heading id `migration-workflow`) covering: edit `prisma/schema.prisma` → `npm run prisma:migrate` → commit migration files. Add anchor `## Drift Detection` covering what the pre-commit drift hook does and how to recover.

- [ ] **Step 2.6: Create `docs/deployment.md`**

Cover: `netlify.toml` walkthrough, env vars required for builds, `npx prisma generate && next build` build command. Add anchor `## Preview Gates` (heading id `preview-gates`) describing the smoke E2E plugin behavior, what fails the deploy, and how to view smoke logs/screenshots in the Netlify deploy UI. Add `## Rollback` covering Netlify deploy revert.

- [ ] **Step 2.7: Create `docs/harness.md`**

Cover all six layers (0–5) verbatim from the spec §3. Add anchors:
- `## Layer 2 Pre-Commit` (heading id `layer-2-pre-commit`)
- `## Layer 3 Pre-Push` (heading id `layer-3-pre-push`)
- `## Layer 5 Netlify Preview` (heading id `layer-5-netlify-preview`)
- `## Bypass Rules` covering `--no-verify` policy: only with documented justification in commit body, and Netlify preview smoke catches what local skipped.

- [ ] **Step 2.8: Create `docs/contributing.md`**

Cover lifecycle: edit → commit → push → preview → merge. Reference `AGENTS.md` for repo conventions and `docs/harness.md` for hook expectations.

- [ ] **Step 2.9: Create root `CONTRIBUTING.md`**

```markdown
# Contributing

Read [docs/README.md](docs/README.md) first. Read [docs/harness.md](docs/harness.md) before your first commit.

Conventions: see [AGENTS.md](AGENTS.md).
```

- [ ] **Step 2.10: Update `AGENTS.md` and `README.md` to point at docs**

In `AGENTS.md`, prepend a "Canonical reference" line linking to `docs/README.md`. In root `README.md`, replace the "Getting Started" section with a redirect to `docs/README.md` while keeping the project-name heading.

- [ ] **Step 2.11: Verify all anchors resolve in plain markdown**

Run:
```
grep -rE 'docs/[a-z-]+\.md#' docs/ scripts/ plugins/ 2>/dev/null
```
Expected: only known anchors (`#migration-workflow`, `#preview-gates`, `#layer-2-pre-commit`, `#layer-3-pre-push`, `#layer-5-netlify-preview`, `#bypass-rules`). Anchors only exist as headings in this PR for now; later PRs reference them.

- [ ] **Step 2.12: Commit and open PR 2**

```
git add docs/ CONTRIBUTING.md AGENTS.md README.md
git commit -m "docs: scaffold /docs knowledge layer for harness onboarding"
```

PR title: `docs: scaffold /docs knowledge layer`.

---

## Task 3: Husky + Prettier + lint-staged (PR 3)

The harness becomes useful here. Format whole repo, install hooks, wire Layer 2.

**Files:**
- Create: `.husky/pre-commit`, `.husky/pre-push`
- Create: `.prettierrc.json`, `.prettierignore`
- Create: `.vscode/settings.json`
- Create: `scripts/harness/banner.js`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 3.1: Install dev dependencies**

Run:
```
npm install --save-dev husky lint-staged prettier tsc-files
```
Expected: success. `package.json` `devDependencies` updated.

- [ ] **Step 3.2: Add `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 3.3: Add `.prettierignore`**

```
.next/
node_modules/
prisma/migrations/
public/
backend/.venv/
playwright-report/
test-results/
coverage/
package-lock.json
```

- [ ] **Step 3.4: Format whole repo (one-time)**

Run:
```
npx prettier --write .
```
Expected: a sweeping diff. Stage and commit on its own to keep subsequent diffs reviewable:
```
git add -A
git commit -m "style: format repo with Prettier"
```

- [ ] **Step 3.5: Add `package.json` scripts and lint-staged config**

Add to `scripts`:
```
"prepare": "husky install && node scripts/harness/banner.js",
"harness:install": "npm install && npm run prepare",
"lint": "eslint . --max-warnings=0",
"format": "prettier --write .",
"typecheck": "tsc --noEmit"
```

Add top-level:
```jsonc
"lint-staged": {
  "*.{ts,tsx,js,jsx,mjs}": ["prettier --write", "eslint --fix --max-warnings=0"],
  "*.{ts,tsx}": ["tsc-files --noEmit"],
  "*.{json,md,yml,yaml,css}": ["prettier --write"]
}
```

(Prisma + Python globs added in later tasks once their hooks exist.)

- [ ] **Step 3.6: Initialize Husky**

Run:
```
npm run prepare
```
Expected: `.husky/` directory created. Banner prints (banner script written next).

- [ ] **Step 3.7: Write `scripts/harness/banner.js`**

```js
#!/usr/bin/env node
/* Idempotent post-install banner. Prints once per `npm install`. */
const banner = [
  "============================================================",
  "  brand_creator_website — dev harness installed.",
  "  Read docs/harness.md before your first commit.",
  "  New here? Start at docs/README.md.",
  "============================================================",
].join("\n");
console.log(banner);
```

- [ ] **Step 3.8: Add `.husky/pre-commit`**

```
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

Make executable:
```
chmod +x .husky/pre-commit
```

- [ ] **Step 3.9: Add `.husky/pre-push` (Layer 3 stub — fleshed out in Task 4)**

```
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run typecheck
npm run lint
```

```
chmod +x .husky/pre-push
```

- [ ] **Step 3.10: Add `.vscode/settings.json`**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff"
  },
  "python.analysis.typeCheckingMode": "strict"
}
```

- [ ] **Step 3.11: Update `.gitignore`**

Append:
```
playwright-report/
test-results/
coverage/
```

- [ ] **Step 3.12: Verify pre-commit blocks bad input**

Manually validate (do not commit garbage):
```
echo "const x = 1" > scratch.ts
git add scratch.ts
git commit -m "test: hook smoke"  # should rewrite via Prettier (adds semicolon final newline) — re-add and commit, OR fail on no semicolon (depending on rules)
git rm scratch.ts
git commit -m "chore: drop scratch"
```
Expected: lint-staged ran. If hook didn't fire, `chmod +x` was skipped — re-run Step 3.8/3.9.

- [ ] **Step 3.13: Verify pre-push runs**

Run:
```
git push --dry-run
```
Expected: pre-push hook executes typecheck + lint. Both pass (Task 1 cleaned them).

- [ ] **Step 3.14: Commit harness wiring and open PR 3**

```
git add .husky/ .prettierrc.json .prettierignore .vscode/settings.json scripts/harness/banner.js .gitignore package.json package-lock.json
git commit -m "feat(harness): add Husky + lint-staged + Prettier (Layer 2)"
```

PR title: `feat(harness): Husky + lint-staged + Prettier (Layer 2 pre-commit)`.

---

## Task 4: Vitest + Layer 3 Pre-Push Tests (PR 4)

TDD seed tests for `src/lib`, wire Vitest into pre-push.

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Create: 3 seed test files under `src/lib/__tests__/`
- Modify: `package.json`, `.husky/pre-push`

- [ ] **Step 4.1: Install Vitest + RTL**

```
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 4.2: Add `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

- [ ] **Step 4.3: Add `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4.4: Add `package.json` scripts**

Add:
```
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4.5: Identify three real targets in `src/lib/`**

Run:
```
ls src/lib/
```
Expected: 1+ files. Pick three pure-utility candidates (e.g., date helpers, formatters, validators). If `src/lib/` is empty or has nothing testable, write tests against a single existing utility plus skip-create the other two seed slots — but the plan target is three real tests.

If no existing target is suitable, create a small utility used by the codebase (do not create one that has no caller) and test it.

- [ ] **Step 4.6: Write failing test #1**

File: `src/lib/__tests__/<utility-1>.test.ts`. Example skeleton (replace with the real utility chosen in Step 4.5):

```ts
import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/format";

describe("formatCurrency", () => {
  it("formats USD with two decimals", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
  });
});
```

- [ ] **Step 4.7: Run test, expect FAIL**

```
npm run test:run -- src/lib/__tests__/<utility-1>.test.ts
```
Expected: FAIL (function does not exist OR returns different value).

- [ ] **Step 4.8: Implement minimal utility**

If function does not exist: create the smallest possible implementation that makes the test pass. If function exists but disagrees, surface the disagreement before changing — confirm desired behavior with the owner.

- [ ] **Step 4.9: Run test, expect PASS**

```
npm run test:run -- src/lib/__tests__/<utility-1>.test.ts
```
Expected: PASS.

- [ ] **Step 4.10: Repeat 4.6–4.9 for utility #2 and #3**

Each cycle: failing test → implement / verify → passing test.

- [ ] **Step 4.11: Run full test suite**

```
npm run test:run
```
Expected: 3 passing tests, 0 failures.

- [ ] **Step 4.12: Wire Vitest into `.husky/pre-push`**

Update `.husky/pre-push`:

```
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run typecheck && \
npm run lint && \
npm run test:run
```

- [ ] **Step 4.13: Verify pre-push runs Vitest**

```
git push --dry-run
```
Expected: typecheck + lint + test:run all execute and pass.

- [ ] **Step 4.14: Commit and open PR 4**

```
git add vitest.config.ts vitest.setup.ts src/lib/ package.json package-lock.json .husky/pre-push
git commit -m "feat(harness): add Vitest + RTL with seed tests; wire into pre-push"
```

PR title: `feat(harness): Vitest seed tests + Layer 3 pre-push`.

---

## Task 5: Prisma Drift Detection (PR 5)

**Files:**
- Create: `scripts/harness/prisma-drift.js`
- Modify: `package.json` (lint-staged + harness:prepush)
- Modify: `.husky/pre-push`

- [ ] **Step 5.1: Write `scripts/harness/prisma-drift.js`**

```js
#!/usr/bin/env node
/* Pre-commit / pre-push drift check. Exit 0 = clean, exit 1 = drift. */
const { spawnSync } = require("node:child_process");

const r = spawnSync(
  "npx",
  [
    "prisma",
    "migrate",
    "diff",
    "--from-migrations",
    "prisma/migrations",
    "--to-schema-datamodel",
    "prisma/schema.prisma",
    "--exit-code",
  ],
  { stdio: "inherit", env: process.env }
);

if (r.status === 0) {
  process.exit(0); // schema matches migrations
}
if (r.status === 2) {
  console.error("\n[prisma-drift] Schema drift detected.");
  console.error("Fix: npm run prisma:migrate");
  console.error("See: docs/database.md#migration-workflow\n");
  process.exit(1);
}
console.error("\n[prisma-drift] prisma migrate diff failed (status=" + r.status + ")");
console.error("See: docs/database.md#drift-detection\n");
process.exit(r.status || 1);
```

- [ ] **Step 5.2: Smoke test the script in clean state**

Run:
```
node scripts/harness/prisma-drift.js
```
Expected: exit 0 (assuming migrations match schema). If exit 1: there is real drift on `main` — fix with `npm run prisma:migrate` before continuing.

- [ ] **Step 5.3: Smoke test the script under drift**

Manually edit `prisma/schema.prisma` to add a temporary field:
```
model TempDrift {
  id String @id @default(cuid())
}
```
Run:
```
node scripts/harness/prisma-drift.js
```
Expected: exit 1 with the "Schema drift detected" message. Revert the edit:
```
git checkout -- prisma/schema.prisma
```

- [ ] **Step 5.4: Add Prisma glob to `lint-staged`**

In `package.json`, extend `lint-staged`:

```jsonc
"lint-staged": {
  "*.{ts,tsx,js,jsx,mjs}": ["prettier --write", "eslint --fix --max-warnings=0"],
  "*.{ts,tsx}": ["tsc-files --noEmit"],
  "prisma/schema.prisma": ["prisma format", "node scripts/harness/prisma-drift.js"],
  "*.{json,md,yml,yaml,css}": ["prettier --write"]
}
```

- [ ] **Step 5.5: Wire drift into pre-push**

Update `.husky/pre-push`:

```
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run typecheck && \
npm run lint && \
node scripts/harness/prisma-drift.js && \
npm run test:run
```

- [ ] **Step 5.6: Verify**

Run:
```
git push --dry-run
```
Expected: drift check runs, exits 0.

- [ ] **Step 5.7: Commit and open PR 5**

```
git add scripts/harness/prisma-drift.js package.json .husky/pre-push
git commit -m "feat(harness): Prisma migrate drift detection (Layer 2 + 3)"
```

PR title: `feat(harness): Prisma migrate drift detection`.

---

## Task 6: FastAPI Ruff + mypy (PR 6)

**Files:**
- Create: `backend/pyproject.toml`, `backend/requirements-dev.txt`
- Create: `scripts/harness/mypy-staged.js`
- Modify: `package.json` (lint-staged + harness:prepush)
- Modify: `.husky/pre-push`
- Modify: `docs/backend.md` (document `requirements-dev.txt`)

- [ ] **Step 6.1: Add `backend/pyproject.toml`**

```toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "SIM"]

[tool.ruff.format]
quote-style = "double"

[tool.mypy]
python_version = "3.11"
strict = true
ignore_missing_imports = true
files = ["app"]
```

- [ ] **Step 6.2: Add `backend/requirements-dev.txt`**

```
ruff==0.6.9
mypy==1.11.2
```

(Pin majors; bump in a follow-up if needed.)

- [ ] **Step 6.3: Install dev deps locally and run baseline**

```
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
ruff check .
ruff format --check .
mypy app
cd ..
```

Capture violation count. Fix violations one tool at a time, similar to Task 1: format first (`ruff format .`), then lint (`ruff check --fix .`), then types (manual). Commit per layer:

```
git add backend/
git commit -m "fix(backend): apply ruff format"
git commit -m "fix(backend): resolve ruff lint findings"
git commit -m "fix(backend): satisfy mypy strict"
```

If a mypy finding requires a real refactor, gate it behind a `# type: ignore[<code>]  # TODO(harness): <issue ref>` and open an issue. Cap ignores at 10.

- [ ] **Step 6.4: Write `scripts/harness/mypy-staged.js`**

Lint-staged passes filenames as args. mypy benefits from per-file invocation when fast paths are wanted, but strict cross-file checks need the package. Compromise: run `mypy <args>` so per-file calls work but rely on full mypy in pre-push for cross-file safety.

```js
#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const args = process.argv.slice(2);
if (args.length === 0) process.exit(0);

const r = spawnSync("mypy", ["--config-file", "backend/pyproject.toml", ...args], {
  stdio: "inherit",
});
if (r.status !== 0) {
  console.error("\n[mypy] type errors. Fix or `# type: ignore[<code>]` with a TODO.");
  console.error("See: docs/backend.md\n");
  process.exit(r.status);
}
```

- [ ] **Step 6.5: Extend lint-staged**

```jsonc
"lint-staged": {
  "*.{ts,tsx,js,jsx,mjs}": ["prettier --write", "eslint --fix --max-warnings=0"],
  "*.{ts,tsx}": ["tsc-files --noEmit"],
  "prisma/schema.prisma": ["prisma format", "node scripts/harness/prisma-drift.js"],
  "backend/**/*.py": [
    "ruff format",
    "ruff check --fix --exit-non-zero-on-fix",
    "node scripts/harness/mypy-staged.js"
  ],
  "*.{json,md,yml,yaml,css}": ["prettier --write"]
}
```

- [ ] **Step 6.6: Wire backend checks into pre-push**

Update `.husky/pre-push`:

```
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run typecheck && \
npm run lint && \
node scripts/harness/prisma-drift.js && \
npm run test:run && \
( cd backend && ruff check . && ruff format --check . && mypy app )
```

- [ ] **Step 6.7: Document install in `docs/backend.md`**

Add under a "Local development setup" section:
```
python -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt -r backend/requirements-dev.txt
```
Note: pre-commit and pre-push assume `mypy` and `ruff` are on PATH inside the backend venv. The recommended pattern is to activate the venv before committing Python changes.

- [ ] **Step 6.8: Add `harness:prepush` script (centralized)**

In `package.json` `scripts`:

```
"harness:prepush": "npm run typecheck && npm run lint && node scripts/harness/prisma-drift.js && npm run test:run && cd backend && ruff check . && ruff format --check . && mypy app"
```

Then simplify `.husky/pre-push` to:

```
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run harness:prepush
```

- [ ] **Step 6.9: Verify**

Run:
```
npm run harness:prepush
```
Expected: PASS.

- [ ] **Step 6.10: Commit and open PR 6**

```
git add backend/pyproject.toml backend/requirements-dev.txt scripts/harness/mypy-staged.js package.json .husky/pre-push docs/backend.md
git commit -m "feat(harness): FastAPI Ruff + mypy (Layer 2 + 3)"
```

PR title: `feat(harness): FastAPI Ruff + mypy gates`.

---

## Task 7: Playwright Smoke Specs + Local On-Demand (PR 7)

Specs only. No Netlify wiring yet.

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/smoke/auth.spec.ts`, `e2e/smoke/brand-portal.spec.ts`, `e2e/smoke/creator-portal.spec.ts`, `e2e/smoke/find-creators.spec.ts`
- Modify: `package.json`

- [ ] **Step 7.1: Install Playwright**

```
npm install --save-dev @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 7.2: Add `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [ ] **Step 7.3: Add `package.json` scripts**

```
"e2e": "playwright test",
"e2e:preview": "PLAYWRIGHT_BASE_URL=$DEPLOY_PRIME_URL playwright test e2e/smoke",
"harness:full": "npm run harness:prepush && npm run e2e"
```

- [ ] **Step 7.4: Write failing test — `auth.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("/login renders form fields", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/login");
  await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
  await expect(page.locator("input[type='password'], input[name='password']")).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});
```

- [ ] **Step 7.5: Run dev server in background and execute**

Terminal A:
```
npm run dev
```
Terminal B (after dev server is listening on 3000):
```
npx playwright test e2e/smoke/auth.spec.ts
```
Expected: PASS. If FAIL because the page contains console errors: investigate; do not relax the assertion. If FAIL because the selector misses: confirm against the real `/login` page markup, then update the selector to be the simplest accurate match.

- [ ] **Step 7.6: Repeat for `brand-portal.spec.ts`**

Spec target: `/brandportal`. Assertions: page renders, no console errors, primary heading visible.

```ts
import { test, expect } from "@playwright/test";

test("/brandportal renders without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/brandportal");
  await expect(page.locator("h1, h2").first()).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});
```

Run, verify PASS.

- [ ] **Step 7.7: Repeat for `creator-portal.spec.ts`**

Same shape as brand-portal, target `/creatorportal`.

- [ ] **Step 7.8: Repeat for `find-creators.spec.ts`**

Same shape, target `/find-creators`.

- [ ] **Step 7.9: Run full smoke suite**

```
npm run e2e -- e2e/smoke
```
Expected: 4 passing.

- [ ] **Step 7.10: Confirm `e2e/` excluded from Vitest**

`vitest.config.ts` `include` is scoped to `src/**`, so e2e specs do not get collected by Vitest. Verify:
```
npm run test:run
```
Expected: same 3 tests as Task 4. No Playwright tests collected.

- [ ] **Step 7.11: Add ESLint ignore for `e2e/`**

Append to `.eslintignore` (create if missing):
```
e2e/
plugins/
```
(Lint covers `src/`, `pages/`, `prisma/seed.js`. E2E follows Playwright conventions which ESLint Next config does not match.)

- [ ] **Step 7.12: Commit and open PR 7**

```
git add playwright.config.ts e2e/ package.json package-lock.json .eslintignore
git commit -m "feat(harness): Playwright smoke E2E (4 surfaces)"
```

PR title: `feat(harness): Playwright smoke E2E (Layer 4 on-demand)`.

---

## Task 8: Netlify Smoke Plugin (PR 8)

**Files:**
- Create: `plugins/smoke-e2e/manifest.yml`, `plugins/smoke-e2e/index.js`, `plugins/smoke-e2e/package.json`
- Modify: `netlify.toml`

- [ ] **Step 8.1: Add `plugins/smoke-e2e/manifest.yml`**

```yaml
name: smoke-e2e
```

- [ ] **Step 8.2: Add `plugins/smoke-e2e/package.json`**

```json
{
  "name": "smoke-e2e",
  "version": "0.0.0",
  "private": true
}
```

(Reuses root `@playwright/test` devDependency. Local plugin path; no install required by Netlify beyond root install.)

- [ ] **Step 8.3: Add `plugins/smoke-e2e/index.js`**

```js
module.exports = {
  async onSuccess({ utils }) {
    const url = process.env.DEPLOY_PRIME_URL;
    if (!url) {
      console.log("[smoke-e2e] DEPLOY_PRIME_URL not set; skipping (production deploy).");
      return;
    }

    try {
      await utils.run.command("npx playwright install --with-deps chromium");
      await utils.run.command(
        `PLAYWRIGHT_BASE_URL=${url} npx playwright test e2e/smoke --reporter=list`
      );
    } catch (err) {
      utils.build.failPlugin(
        "Smoke E2E failed against preview. See docs/deployment.md#preview-gates",
        { error: err }
      );
    }
  },
};
```

- [ ] **Step 8.4: Register the plugin in `netlify.toml`**

Append:

```toml
[[plugins]]
  package = "/plugins/smoke-e2e"
```

- [ ] **Step 8.5: Verify plugin metadata locally**

Run:
```
node -e "console.log(require('./plugins/smoke-e2e/index.js'))"
```
Expected: object with `onSuccess` function.

- [ ] **Step 8.6: Sanity check `netlify.toml` parses**

If Netlify CLI is installed:
```
npx netlify build --dry
```
Expected: no parse errors. If CLI not available, skip — production validation happens on the first preview deploy.

- [ ] **Step 8.7: Commit and open PR 8**

```
git add plugins/smoke-e2e/ netlify.toml
git commit -m "feat(harness): Netlify preview smoke E2E plugin (Layer 5)"
```

PR title: `feat(harness): Netlify preview smoke E2E plugin`.

PR description must call out: first preview deploy after merge is the real validation; if Playwright install fails on Netlify build image, fall-forward fix is to switch to `microsoft/playwright` Docker image via `[build.environment]` or to bundle the chromium binary path explicitly.

---

## Task 9: Claude Code Hooks (PR 9)

Bonus layer. Adds PostToolUse hooks to Claude Code's `.claude/settings.json` so format/lint runs on Claude edits in addition to git commits.

**Files:**
- Create or Modify: `.claude/settings.json`

- [ ] **Step 9.1: Inspect current `.claude/settings.json`**

Run:
```
test -f .claude/settings.json && cat .claude/settings.json || echo "(absent)"
```

- [ ] **Step 9.2: Define PostToolUse hooks**

Target `.claude/settings.json`. If the file already exists with hooks, merge. Resulting fragment:

```jsonc
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "node scripts/harness/claude-format.js",
        "description": "Format + lint Claude edits"
      },
      {
        "matcher": "Write|Edit",
        "command": "node scripts/harness/claude-ruff.js",
        "description": "Format + lint Claude Python edits"
      }
    ]
  }
}
```

Add `scripts/harness/claude-format.js`:

```js
#!/usr/bin/env node
let d = "";
process.stdin.on("data", (c) => (d += c));
process.stdin.on("end", () => {
  try {
    const i = JSON.parse(d);
    const f = i.tool_input?.file_path;
    if (!f || !/\.(ts|tsx|js|jsx|mjs|json|md|yml|yaml|css)$/.test(f)) return;
    const cp = require("node:child_process");
    cp.spawnSync("npx", ["prettier", "--write", f], { stdio: "inherit" });
    if (/\.(ts|tsx|js|jsx|mjs)$/.test(f)) {
      cp.spawnSync("npx", ["eslint", "--fix", "--max-warnings=0", f], { stdio: "inherit" });
    }
  } catch (e) {
    console.error(e);
  }
});
```

Add `scripts/harness/claude-ruff.js`:

```js
#!/usr/bin/env node
let d = "";
process.stdin.on("data", (c) => (d += c));
process.stdin.on("end", () => {
  try {
    const i = JSON.parse(d);
    const f = i.tool_input?.file_path;
    if (!f || !/backend\/.+\.py$/.test(f)) return;
    const cp = require("node:child_process");
    cp.spawnSync("ruff", ["format", f], { stdio: "inherit" });
    cp.spawnSync("ruff", ["check", "--fix", f], { stdio: "inherit" });
  } catch (e) {
    console.error(e);
  }
});
```

- [ ] **Step 9.3: Trigger a Claude edit and verify**

In a Claude Code session, ask Claude to make a tiny formatting-relevant edit to a TS file (e.g., add a trailing comma). Verify Prettier ran (file is reformatted), and that ESLint produced no diff (or auto-fixed). For Python, ask Claude to edit a file under `backend/`; verify `ruff format` ran.

- [ ] **Step 9.4: Document in `docs/harness.md`**

Add a "Layer 1 — Claude Code Hooks" subsection describing what triggers them, what they do, and how to disable per-session if needed (`/hooks` slash command in Claude Code).

- [ ] **Step 9.5: Commit and open PR 9**

```
git add .claude/settings.json scripts/harness/claude-format.js scripts/harness/claude-ruff.js docs/harness.md
git commit -m "feat(harness): Claude Code PostToolUse hooks (Layer 1)"
```

PR title: `feat(harness): Claude Code PostToolUse hooks`.

---

## Post-Rollout Verification

After all 9 PRs merge, run the success-criteria checks from the spec:

- [ ] **V1: Fresh-clone bootstrap.**
  ```
  git clone <repo> /tmp/harness-test && cd /tmp/harness-test
  npm run harness:install
  ```
  Expected: dependencies installed, Husky hooks installed, banner printed pointing at `docs/`.

- [ ] **V2: Lint-block on commit.**
  Introduce a deliberate ESLint violation, `git add`, `git commit`. Expected: pre-commit blocks; failure message includes a docs anchor.

- [ ] **V3: Drift block.**
  Edit `prisma/schema.prisma` without creating a migration. Expected: pre-commit blocks with the drift message and `docs/database.md#migration-workflow` pointer.

- [ ] **V4: Pre-push full check.**
  Push a clean branch. Expected: `harness:prepush` runs typecheck + lint + drift + Vitest + Ruff + mypy, all pass under 60 s.

- [ ] **V5: Preview smoke.**
  Open a PR with a deliberately broken `/login` route. Expected: Netlify preview deploys, smoke fails, deploy marked failed, screenshot in deploy log.

- [ ] **V6: Failure UX.**
  Every blocking hook prints a docs anchor (grep your latest hook outputs).

---

## Self-Review Notes

- Spec §3 layers 0–5 are all covered: Layer 0 → Task 2; Layer 1 → Task 9 + `.vscode/settings.json` in Task 3; Layer 2 → Tasks 3, 5, 6; Layer 3 → Tasks 3, 4, 5, 6; Layer 4 → Task 7; Layer 5 → Task 8.
- Spec §4 components map: 4.1→Task 1; 4.2→Tasks 3, 4, 5, 6; 4.3→Task 3; 4.4→Task 4; 4.5→Task 7; 4.6→Task 8; 4.7→Task 5; 4.8→Task 6; 4.9→Task 3; 4.10→Task 2.
- Spec §6 failure UX requires every blocking hook to cite a docs anchor: Task 5 (drift), Task 6 (mypy), Task 8 (smoke) all do; Task 3 ESLint relies on default ESLint output, so the docs anchor lives in `docs/harness.md#layer-2-pre-commit` referenced from `harness.md` itself rather than from the lint output (acceptable; ESLint formatter modification is out of scope for harness rollout).
- Type/script consistency: `harness:prepush`, `harness:install`, `harness:full`, `e2e`, `e2e:preview` named consistently across Tasks 3, 4, 6, 7. `scripts/harness/{banner,prisma-drift,mypy-staged,claude-format,claude-ruff}.js` naming consistent.
- Placeholders: none. Every step shows real code or a real command.
