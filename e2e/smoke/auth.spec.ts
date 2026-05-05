import { test, expect } from "@playwright/test";

test("/login renders form fields", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/login");
  await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
  await expect(page.locator("input[type='password'], input[name='password']")).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});
