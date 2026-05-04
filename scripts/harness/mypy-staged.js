#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const args = process.argv.slice(2);
if (args.length === 0) process.exit(0);

const r = spawnSync(
  "backend/.venv/bin/mypy",
  ["--config-file", "backend/pyproject.toml", ...args],
  {
    stdio: "inherit",
  }
);
if (r.status !== 0) {
  console.error("\n[mypy] type errors. Fix or `# type: ignore[<code>]` with a TODO.");
  console.error("See: docs/backend.md\n");
  process.exit(r.status);
}
