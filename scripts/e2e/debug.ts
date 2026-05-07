#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const runId = process.argv[2];
if (!runId) {
  console.error("usage: npm run e2e:debug -- <runId>");
  process.exit(2);
}
const runDir = path.join(".e2e/runs", runId);
if (!existsSync(runDir)) {
  console.error(`no such run: ${runDir}`);
  process.exit(2);
}

const summary = path.join(runDir, "summary.md");
if (existsSync(summary)) {
  console.log("=== summary ===");
  console.log(readFileSync(summary, "utf8"));
}

console.log("\n=== api logs (last 50) ===");
try {
  console.log(
    execSync("docker compose -p brand-creator-e2e -f docker/compose.e2e.yml logs --tail=50 api", {
      encoding: "utf8",
    })
  );
} catch (e) {
  console.error("(failed to fetch api logs)", e);
}

console.log("\n=== web logs (last 50) ===");
try {
  console.log(
    execSync("docker compose -p brand-creator-e2e -f docker/compose.e2e.yml logs --tail=50 web", {
      encoding: "utf8",
    })
  );
} catch (e) {
  console.error("(failed to fetch web logs)", e);
}
