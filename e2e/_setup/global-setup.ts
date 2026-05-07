import { chromium, type FullConfig } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const ROLES = ["brand", "creator", "admin"] as const;

export default async function globalSetup(_config: FullConfig): Promise<void> {
  await mkdir(".e2e/auth", { recursive: true });

  // Reset DB once at run start.
  execSync("npx tsx scripts/e2e/reset-db.ts", { stdio: "inherit", env: process.env });

  const baseURL = "http://localhost:12001";
  const browser = await chromium.launch();
  for (const role of ROLES) {
    const ctx = await browser.newContext({ baseURL });
    const page = await ctx.newPage();
    const res = await page.goto(`/api/test/login?role=${role}`);
    if (!res || res.status() !== 200) {
      throw new Error(`globalSetup login for ${role} failed: ${res?.status()}`);
    }
    await ctx.storageState({ path: path.join(".e2e/auth", `${role}.json`) });
    await ctx.close();
  }
  await browser.close();
}
