#!/usr/bin/env tsx
import { execSync } from "node:child_process";

const COMPOSE = "docker compose -p brand-creator-e2e -f docker/compose.e2e.yml";

function main() {
  console.log("[e2e:down] removing containers and volumes…");
  execSync(`${COMPOSE} down -v`, { stdio: "inherit" });
  console.log("[e2e:down] removed.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
