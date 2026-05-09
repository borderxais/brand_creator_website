import path from "node:path";
import { test, expect } from "./_helpers/fixtures";

test("creator submits, admin uploads output, creator sees Delivered", async ({
  asCreator,
  page,
}) => {
  const promptText = `E2E fulfillment ${Date.now()}`;

  // 1. Creator submits a task via the form.
  await asCreator.goto("/creatorportal/ai-video/generate");
  await asCreator.getByLabel(/Generation prompt/i).fill(promptText);
  await asCreator
    .locator("input#portrait")
    .setInputFiles(path.join(__dirname, "fixtures/portrait.png"));
  await asCreator.getByRole("button", { name: /Generate video/i }).click();
  await expect(asCreator.getByText(/Task queued/i)).toBeVisible({ timeout: 15_000 });

  // 2. Admin (unauthed) finds the row, uploads an output mp4, marks DELIVERED.
  await page.goto("/storyclaw-admin");
  const row = page.locator("tr", { hasText: promptText });
  await expect(row).toBeVisible({ timeout: 10_000 });

  await row
    .locator('input[type="file"][accept*="video"]')
    .setInputFiles(path.join(__dirname, "fixtures/output-sample.mp4"));
  await row.getByRole("button", { name: /^Upload$/ }).click();
  await expect(row.getByText(/Output uploaded/i)).toBeVisible({ timeout: 20_000 });

  await row.getByLabel(/Status/i).selectOption("DELIVERED");
  await row.getByRole("button", { name: /^Save$/ }).click();
  await expect(row.getByLabel(/Status/i)).toHaveValue("DELIVERED");

  // 3. Creator returns and sees Delivered + a working "View output" link.
  await asCreator.goto("/creatorportal/ai-video/tasks");
  const taskItem = asCreator.locator("li", { hasText: promptText });
  await expect(taskItem).toBeVisible({ timeout: 10_000 });
  await expect(taskItem.getByText("Delivered")).toBeVisible();
  await expect(taskItem.getByRole("link", { name: /View output/i })).toHaveAttribute(
    "href",
    /^https?:/
  );
});
