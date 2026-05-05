#!/usr/bin/env node
/* Pre-commit / pre-push drift check. Exit 0 = clean, exit 1 = drift. */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

// Load .env so env vars are available without dotenv dep.
// process.loadEnvFile is built-in since Node 20.12 / Node 22.
const envPath = path.resolve(__dirname, "../../.env");
try {
  process.loadEnvFile(envPath);
} catch {
  // .env absent or not readable — env vars may still be set by the shell.
}

function redact(text) {
  if (!text) return text;
  return String(text).replace(/postgresql:\/\/[^\s@'"]+@/g, "postgresql://<redacted>@");
}

// Require a dedicated SHADOW_DATABASE_URL — never fall back to DIRECT_URL or
// DATABASE_URL. Both point at production; Prisma performs schema create/apply/
// drop on the shadow DB and would mutate or error against production.
const shadowUrl = process.env.SHADOW_DATABASE_URL;
if (!shadowUrl) {
  console.warn("\n[prisma-drift] SHADOW_DATABASE_URL not set — skipping drift check.");
  console.warn("Set SHADOW_DATABASE_URL to a non-production database (local Postgres or branch).");
  console.warn("See: docs/database.md#drift-detection\n");
  process.exit(0);
}

const r = spawnSync(
  "npx",
  [
    "prisma",
    "migrate",
    "diff",
    "--shadow-database-url",
    shadowUrl,
    "--from-migrations",
    "prisma/migrations",
    "--to-schema-datamodel",
    "prisma/schema.prisma",
    "--exit-code",
  ],
  { stdio: "pipe", env: process.env, timeout: 30_000 }
);

// Handle spawnSync-level errors (timeout, missing binary, etc.) before
// inspecting exit status.
if (r.error) {
  if (r.error.code === "ETIMEDOUT" || r.signal === "SIGTERM") {
    console.warn("\n[prisma-drift] timed out waiting for DB — skipping drift check.");
    console.warn("See: docs/database.md#drift-detection\n");
    process.exit(0);
  }
  // Some other spawn error — surface it (redacted) and exit non-zero.
  console.error("\n[prisma-drift] failed to spawn prisma:", redact(r.error.message));
  process.exit(1);
}

const stdout = r.stdout ? r.stdout.toString() : "";
const stderr = r.stderr ? r.stderr.toString() : "";

if (r.status === 0) {
  process.exit(0); // schema matches migrations
}

if (r.status === 2) {
  if (stdout) process.stdout.write(redact(stdout));
  console.error("\n[prisma-drift] Schema drift detected.");
  console.error("Fix: npm run prisma:migrate");
  console.error("See: docs/database.md#migration-workflow\n");
  process.exit(1);
}

// status === 1: prisma itself errored (DB unreachable, auth failure, etc.)
// Treat as a soft failure: warn and skip rather than blocking the push.
const combined = stdout + stderr;

// Tested with prisma@6.4.1; P1001 is the stable Prisma error code for "Can't reach database server".
const isConnectivityError =
  /Tenant or user not found/i.test(combined) ||
  /connection refused/i.test(combined) ||
  /ECONNREFUSED/i.test(combined) ||
  /getaddrinfo/i.test(combined) ||
  /connect ETIMEDOUT/i.test(combined) ||
  /\bP1001\b/.test(combined);

if (isConnectivityError) {
  console.warn("\n[prisma-drift] DB unreachable — skipping drift check (status=" + r.status + ").");
  console.warn("See: docs/database.md#drift-detection\n");
  process.exit(0); // non-blocking when DB is unavailable
}

if (stdout) process.stdout.write(redact(stdout));
if (stderr) process.stderr.write(redact(stderr));
console.error("\n[prisma-drift] prisma migrate diff failed (status=" + r.status + ")");
console.error("See: docs/database.md#drift-detection\n");
process.exit(r.status || 1);
