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
