import { expect, test } from "@playwright/test";

test.describe("Go to example.com", () => {
  test("should open example.com", async ({ page }) => {
    await page.goto("https://example.com");
    await page.screenshot({ path: "example.png" });
  });

  test("should have header", async ({ page }) => {
    await page.goto("https://example.com");
    await expect(page.locator("h1")).toHaveText("Example Domain");
  });
});
