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
