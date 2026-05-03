# Database

Prisma ORM connected to a hosted PostgreSQL database.

See [architecture.md](architecture.md) for the broader system context.

---

## Schema

Schema lives at `prisma/schema.prisma`. This file is the single source of truth for all database models. The datasource block uses two connection strings:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- `DATABASE_URL` — pooled connection (used by Prisma at runtime via a connection pooler such as Supabase's PgBouncer).
- `DIRECT_URL` — direct connection (used by Prisma Migrate, which requires a non-pooled connection to run DDL).

Set both in `.env.local`. Copy `.env.example` if present.

> **Legacy note:** `AGENTS.md` mentions `prisma/dev.db` (SQLite). That file is no longer used; the project targets PostgreSQL exclusively.

---

## Seeding

Populate the local database with seed data:

```bash
npm run prisma:seed
# or equivalently
npm run db:seed
```

Both commands run `node prisma/seed.js`.

---

## Migrations

Migration snapshots live in `prisma/migrations/`. Each migration is a timestamped folder containing a `migration.sql` file. Commit migration files alongside schema changes.

```bash
# After editing prisma/schema.prisma:
npm run prisma:migrate    # creates and applies a new migration (prisma migrate dev)
npm run prisma:generate   # regenerates the Prisma client (run after migrate or when switching branches)
```

---

## Migration Workflow

1. Edit `prisma/schema.prisma` to add or change models.
2. Run `npm run prisma:migrate` — this creates a new migration file in `prisma/migrations/` and applies it to your local database.
3. Commit both `prisma/schema.prisma` and the new `prisma/migrations/<timestamp>_<name>/` folder in the same commit as the code that depends on the schema change.

**Shadow database:** `prisma migrate dev` uses a shadow database to verify migrations are consistent. Ensure your database user has permission to create and drop databases, or configure `shadowDatabaseUrl` in `schema.prisma` if your provider restricts this (common with Supabase).

---

## Drift Detection

Schema drift occurs when `prisma/schema.prisma` has been edited but no corresponding migration file was created — the schema and the migration history are out of sync.

A pre-commit hook (added in a later harness PR) runs `prisma migrate diff` to detect schema-vs-migrations drift. If drift is detected, run `npm run prisma:migrate` to create a migration that captures the change, then commit the new migration files.

Hook error output will reference this anchor:

```
[pre-commit] Prisma schema drift detected.
  Fix: npm run prisma:migrate
  See: docs/database.md#migration-workflow
```

---

## When to Update

Update this file when:
- A new Prisma model is added or an existing one is significantly changed.
- The migration workflow changes (e.g., shadow database configuration).
- Connection environment variable names change.
