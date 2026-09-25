import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("mobile layout: bottom navigation, FAB and no horizontal scroll", async ({ page }) => {
  await signUp(page);
  for (const path of ["/dashboard", "/interview/new", "/history", "/progress", "/practice", "/profile", "/billing", "/settings", "/loops"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(1);
  }
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "History" })).toBeVisible();
  await expect(page.getByRole("link", { name: "New interview" })).toBeVisible();
});
