#!/usr/bin/env tsx
import { execSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  symlinkSync,
  existsSync,
  unlinkSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { newRunId } from "./lib/runId";
import { buildSummary } from "./lib/summary";

function rotateRuns(rootDir: string, keep = 10): void {
  if (!existsSync(rootDir)) return;
  const dirs = readdirSync(rootDir)
    .filter((n) => /^\d{13}$/.test(n))
    .map((n) => ({ n, t: statSync(path.join(rootDir, n)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const d of dirs.slice(keep))
    rmSync(path.join(rootDir, d.n), { recursive: true, force: true });
}

async function main() {
  const runId = newRunId();
  const runDir = path.join(".e2e/runs", runId);
  mkdirSync(runDir, { recursive: true });

  execSync("npx tsx scripts/e2e/up.ts", { stdio: "inherit" });

  const args = process.argv.slice(2);
  const env = { ...process.env, E2E_AGENT: "1", E2E_RUN_ID: runId, E2E_EXPLORE: "1" };
  const result = spawnSync("npx", ["playwright", "test", ...args], { stdio: "inherit", env });

  const reportPath = path.join(runDir, "report.json");
  if (existsSync(reportPath)) {
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    const md = buildSummary(report, runId);
    writeFileSync(path.join(runDir, "summary.md"), md);
  } else {
    writeFileSync(path.join(runDir, "summary.md"), `# E2E run ${runId} — NO REPORT\n`);
  }

  const latest = path.join(".e2e/runs", "latest");
  if (existsSync(latest)) unlinkSync(latest);
  symlinkSync(runId, latest, "dir");

  rotateRuns(".e2e/runs", 10);

  console.log(`[e2e:agent] runId=${runId} summary=.e2e/runs/latest/summary.md`);
  process.exit(result.status ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
