#!/usr/bin/env node
/* Pre-commit / pre-push drift check. Exit 0 = clean, exit 1 = drift. */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

// Load .env so DATABASE_URL / DIRECT_URL are available without dotenv dep.
// process.loadEnvFile is built-in since Node 20.12 / Node 22.
const envPath = path.resolve(__dirname, "../../.env");
try {
  process.loadEnvFile(envPath);
} catch {
  // .env absent or not readable — env vars may still be set by the shell.
}

// Prisma 6+ requires --shadow-database-url when diffing from a migrations
// directory. Use DIRECT_URL (non-pooled) so Prisma can create/drop the
// shadow DB. Fall back to DATABASE_URL if DIRECT_URL is not set.
const shadowUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!shadowUrl) {
  console.warn("\n[prisma-drift] DIRECT_URL (or DATABASE_URL) not set — skipping drift check.");
  console.warn("See: docs/database.md#drift-detection\n");
  process.exit(0); // non-blocking: no DB config available
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
  { stdio: "pipe", env: process.env }
);

const stdout = r.stdout ? r.stdout.toString() : "";
const stderr = r.stderr ? r.stderr.toString() : "";

if (r.status === 0) {
  process.exit(0); // schema matches migrations
}
if (r.status === 2) {
  if (stdout) process.stdout.write(stdout);
  console.error("\n[prisma-drift] Schema drift detected.");
  console.error("Fix: npm run prisma:migrate");
  console.error("See: docs/database.md#migration-workflow\n");
  process.exit(1);
}

// status === 1: prisma itself errored (DB unreachable, auth failure, etc.)
// Treat as a soft failure: warn and skip rather than blocking the push.
const isConnectivityError =
  stderr.includes("Tenant or user not found") ||
  stderr.includes("connection refused") ||
  stderr.includes("ECONNREFUSED") ||
  stderr.includes("getaddrinfo") ||
  stderr.includes("connect ETIMEDOUT");

if (isConnectivityError) {
  console.warn("\n[prisma-drift] DB unreachable — skipping drift check (status=" + r.status + ").");
  console.warn("See: docs/database.md#drift-detection\n");
  process.exit(0); // non-blocking when DB is unavailable
}

if (stdout) process.stdout.write(stdout);
if (stderr) process.stderr.write(stderr);
console.error("\n[prisma-drift] prisma migrate diff failed (status=" + r.status + ")");
console.error("See: docs/database.md#drift-detection\n");
process.exit(r.status || 1);
