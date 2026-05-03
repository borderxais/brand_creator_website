# Deployment

The app deploys to Netlify. Build command: `npx prisma generate && next build`.

See [architecture.md](architecture.md) for the system overview and [harness.md](harness.md) for the quality gates that run before and after each deploy.

---

## `netlify.toml` Walkthrough

Current `netlify.toml` (repo root):

```toml
[build]
  command = "npx prisma generate && next build"
  publish = ".next"

[functions]
  external_node_modules = ["@prisma/client", "axios"]
  included_files = ["prisma/**"]

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

| Key                               | Value                               | Purpose                                                        |
| --------------------------------- | ----------------------------------- | -------------------------------------------------------------- |
| `build.command`                   | `npx prisma generate && next build` | Generates the Prisma client before building Next.js            |
| `build.publish`                   | `.next`                             | Netlify serves from the Next.js build output                   |
| `functions.external_node_modules` | `@prisma/client`, `axios`           | Bundled outside the function zip (large native binaries)       |
| `functions.included_files`        | `prisma/**`                         | Prisma schema and migration files included in function bundle  |
| `@netlify/plugin-nextjs`          | official plugin                     | Adapts Next.js App Router for Netlify's edge/functions runtime |

A smoke E2E plugin (`/plugins/smoke-e2e`) will be registered here in a later harness PR (PR 8).

---

## Required Environment Variables

Set these in the Netlify site dashboard under **Site configuration → Environment variables**:

| Variable          | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `DATABASE_URL`    | Pooled PostgreSQL connection string                        |
| `DIRECT_URL`      | Direct PostgreSQL connection (for migrations)              |
| `NEXTAUTH_SECRET` | NextAuth.js secret for session signing                     |
| `NEXTAUTH_URL`    | Canonical site URL (e.g., `https://your-site.netlify.app`) |

Additional secrets (Supabase, TikTok, email) mirror what you have in `.env.local`. See `AGENTS.md` for the full list of env categories.

---

## Build Command

```
npx prisma generate && next build
```

`prisma generate` must run before `next build` so the Prisma client is present when Next.js compiles server components. If you add a new Prisma client dependency, ensure this ordering is preserved.

---

## Preview Gates

A Netlify Build Plugin (added in a later harness PR — PR 8) runs Playwright smoke tests against `$DEPLOY_PRIME_URL` after each preview build. Smoke failures fail the deploy. Smoke artifacts (screenshots, traces) are visible in the Netlify deploy log.

The plugin runs only when `DEPLOY_PRIME_URL` is set. Production deploys do not set this variable, so smoke tests are a preview-only gate by design.

Hook error output will reference this anchor:

```
[netlify smoke] /login failed render assertion.
  See: docs/deployment.md#preview-gates
```

---

## Rollback

To revert a broken production deploy:

1. Open the Netlify dashboard for this site.
2. Navigate to **Deploys**.
3. Find the last known-good deploy in the list.
4. Click **Publish deploy** on that entry.

Netlify makes the selected deploy live immediately. No git revert required (though you should also revert the code if the deploy caused a regression).

---

## When to Update

Update this file when:

- `netlify.toml` is modified (new plugins, changed build command, new redirect rules).
- Required environment variables change.
- The rollback procedure changes.
- Preview gate behavior changes (e.g., smoke suite scope expands).
