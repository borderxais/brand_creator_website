#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { waitForHttp } from "./lib/wait";

const COMPOSE = "docker compose -p brand-creator-e2e -f docker/compose.e2e.yml";

export function assertTestDatabaseUrl(url: string | undefined): void {
  if (!url) throw new Error("DATABASE_URL must be set");
  if (!url.includes(":54329/")) {
    throw new Error(
      `refusing to operate against non-test DATABASE_URL: ${url}. Expected port :54329`
    );
  }
}

async function main() {
  const dbUrl = "postgres://e2e:e2e@localhost:54329/brand_creator_e2e";
  process.env.DATABASE_URL = dbUrl;
  assertTestDatabaseUrl(dbUrl);

  console.log("[e2e:up] starting compose stack…");
  execSync(`${COMPOSE} up -d --wait`, { stdio: "inherit" });

  console.log("[e2e:up] waiting on http endpoints…");
  await waitForHttp("http://localhost:8001/health", {
    timeoutMs: 60_000,
    intervalMs: 1000,
  });
  await waitForHttp("http://localhost:12001/", {
    timeoutMs: 60_000,
    intervalMs: 1000,
  });

  console.log("[e2e:up] running prisma migrate deploy…");
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });

  console.log("[e2e:up] seeding…");
  execSync("npx tsx prisma/seed.e2e.ts", { stdio: "inherit", env: process.env });

  console.log("[e2e:up] ready.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
