import { test as base, type Page, type Browser } from "@playwright/test";

type Roles = { asBrand: Page; asCreator: Page; asAdmin: Page };

function rolePage(role: "brand" | "creator" | "admin") {
  return async ({ browser }: { browser: Browser }, use: (p: Page) => Promise<void>) => {
    const ctx = await browser.newContext({ storageState: `.e2e/auth/${role}.json` });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  };
}

export const test = base.extend<Roles>({
  asBrand: rolePage("brand"),
  asCreator: rolePage("creator"),
  asAdmin: rolePage("admin"),
});

export { expect } from "@playwright/test";
