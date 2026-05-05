import { test, expect } from "@playwright/test";

// /brandportal requires auth. Unauthenticated visitors are redirected to /login
// by the layout (brandportal/layout.tsx). The redirect target renders an h2
// ("Sign in to your account"), so the assertion below passes either way.
test("/brandportal renders without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/brandportal");
  await expect(page.locator("h1, h2").first()).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});
