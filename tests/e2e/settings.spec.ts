import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("theme, data export and account deletion", async ({ page }) => {
  const { email } = await signUp(page);
  await page.goto("/settings");

  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: /Download my data/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/intervexa-export-.*\.json/);

  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByLabel(/to confirm/).fill(email);
  await page.getByRole("button", { name: "Delete forever" }).click();
  await page.waitForURL((url) => url.pathname === "/");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("supersecret1");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});
