import { expect, test } from "@playwright/test";
import { buy, signUp } from "./helpers";

test("free quota, paywall, credits and Pro", async ({ page }) => {
  await signUp(page);
  await expect(page.getByRole("link", { name: "3 free left" })).toBeVisible();

  await page.goto("/interview/new");
  await page.getByRole("button", { name: /Voice/ }).click();
  await expect(page.getByRole("heading", { name: "Unlock with Pro or credits" })).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();

  const locked = await page.request.post("/api/interviews", {
    data: { role: "Engineer", experienceYears: 1, type: "coding", difficulty: "easy", durationMinutes: 15, personality: "professional", answerMode: "text" },
  });
  expect(locked.status()).toBe(402);

  await buy(page, "Buy");
  await expect(page.getByRole("link", { name: "3 credits" })).toBeVisible();
  await expect(page.getByText("Payment history")).toBeVisible();
  await expect(page.getByRole("cell", { name: "3 interviews" })).toBeVisible();

  await buy(page, "Get Pro");
  await expect(page.getByRole("link", { name: "Pro", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Pro$/ }).first()).toBeVisible();
});
