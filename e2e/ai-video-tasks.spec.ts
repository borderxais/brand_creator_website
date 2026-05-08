import path from "node:path";
import { test, expect } from "./_helpers/fixtures";

test("creator submits AI video task and sees it in the list", async ({ asCreator }) => {
  await asCreator.goto("/creatorportal/ai-video/generate");

  await asCreator.getByLabel(/Generation prompt/i).fill("E2E smoke prompt");
  await asCreator
    .locator("input#portrait")
    .setInputFiles(path.join(__dirname, "fixtures/portrait.png"));
  await asCreator.getByRole("button", { name: /Generate video/i }).click();

  await expect(asCreator.getByText(/Task queued/i)).toBeVisible({ timeout: 15_000 });

  await asCreator.goto("/creatorportal/ai-video/tasks");
  await expect(asCreator.getByText("E2E smoke prompt")).toBeVisible();
  await expect(asCreator.getByText("Queued").first()).toBeVisible();
});
