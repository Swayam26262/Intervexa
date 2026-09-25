import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("sign up, sign out and log back in", async ({ page }) => {
  const { email, password } = await signUp(page);
  await expect(page.getByRole("heading", { name: /Welcome to Intervexa/ })).toBeVisible();

  await page.getByRole("button", { name: "Account and settings" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL((url) => url.pathname === "/");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Test");
});

test("wrong password is rejected", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});

test("protected pages redirect to login", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL(/\/login/);
  const res = await page.request.post("/api/interviews", { data: {} });
  expect(res.status()).toBe(401);
});

test("forgot password gives a neutral confirmation", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("someone@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If an account exists");
});
