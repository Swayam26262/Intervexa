import { expect, type Page } from "@playwright/test";

export const STRONG_ANSWER =
  "I built ParkEase, a real-time parking app. The architecture has a Next.js frontend, a Node.js API and MongoDB. " +
  "I decided to use Redis Streams for events because we needed ordered, replayable updates, and the main challenge was handling 2,000 updates per second for our users. " +
  "For example, we stored bookings in the database with a unique index, and the trade-off was slightly slower writes.";

export async function signUp(page: Page, name = "Test Candidate") {
  const email = `e2e+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("supersecret1");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/profile\?welcome=1/);
  return { email, password: "supersecret1" };
}

export async function saveProfile(page: Page, targetRole = "AI Engineer", skills?: string) {
  await page.goto("/profile");
  await page.getByLabel("Target role").fill(targetRole);
  await page.getByLabel("Current role").fill("Software Engineer");
  if (skills) await page.getByLabel("Skills").fill(skills);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved")).toBeVisible();
}

/** Buys a product in simulated payment mode. */
export async function buy(page: Page, buttonName: RegExp | string) {
  await page.goto("/billing");
  await page.getByRole("button", { name: buttonName }).first().click();
  await page.getByRole("button", { name: "Complete payment" }).click();
  await expect(page.getByText("Payment successful")).toBeVisible();
}

export async function answer(page: Page, text: string) {
  const box = page.getByLabel("Your answer");
  await box.fill(text);
  const before = await page.locator("[aria-live='polite'] >> text=/./").count();
  await page.getByRole("button", { name: "Send answer" }).click();
  await expect(box).toHaveValue("", { timeout: 20_000 });
  expect(await page.locator("[aria-live='polite'] >> text=/./").count()).toBeGreaterThan(before);
}

export async function endInterview(page: Page) {
  await page.getByRole("button", { name: "End", exact: true }).click();
  await page.getByRole("button", { name: "End & get report" }).click();
  await page.waitForURL(/\/report$/);
  await expect(page.getByRole("heading", { name: "Answer-by-answer" })).toBeVisible({ timeout: 30_000 });
}
