import { test, expect } from "../_helpers/fixtures";

test.describe("brand / campaign create", () => {
  test("creates a campaign and lands on its detail page", async ({ asBrand }) => {
    await asBrand.goto("/brand/campaigns/new");
    await asBrand.getByLabel("Name").fill("Test Campaign 1");
    await asBrand.getByRole("button", { name: /create campaign/i }).click();
    await expect(asBrand.getByRole("heading", { name: "Test Campaign 1" })).toBeVisible();
    await expect(asBrand).toHaveURL(/\/brand\/campaigns\/[a-z0-9-]+$/i);
  });
});
