import path from "node:path";
import { expect, test } from "@playwright/test";
import { answer, endInterview, saveProfile, signUp, STRONG_ANSWER } from "./helpers";

test("profile + resume → adaptive interview → report → history & progress", async ({ page }) => {
  await signUp(page, "Swayam Patil");
  await saveProfile(page);

  await page.locator("#resume-file").setInputFiles(path.join(__dirname, "fixtures/resume.txt"));
  await expect(page.getByText("Resume analysed")).toBeVisible();
  await expect(page.getByText("ParkEase").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove Python" })).toBeVisible();

  await page.goto("/interview/new?type=technical");
  await page.getByRole("radio", { name: "15 min" }).click();
  await page.getByRole("button", { name: "Start interview" }).click();
  await page.waitForURL(/\/interview\/[a-f0-9]{24}$/);
  await expect(page.getByText(/Hi Swayam/)).toBeVisible();
  await expect(page.getByText(/walk me through ParkEase/i)).toBeVisible();

  await answer(page, STRONG_ANSWER);
  await answer(page, "I would just use some AI model and it would work fine, it is good.");
  await expect(page.getByText(/You said "/).last()).toBeVisible();
  await answer(page, "Um, I don't know.");

  await endInterview(page);
  await expect(page.getByText("out of 100")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Strengths" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Resume claims/ })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Intervexa remembers" })).toBeVisible();
  await expect(page.getByText("Recent interviews")).toBeVisible();

  await page.goto("/history");
  await expect(page.getByText("1 interview so far")).toBeVisible();
  await page.getByPlaceholder("Search by role, topic or weak area").fill("nothing-matches-this");
  await expect(page.getByText("No interviews match")).toBeVisible();

  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Overall score" })).toBeVisible();
});

test("double submit is rejected and validation errors are returned", async ({ page }) => {
  await signUp(page);
  await page.goto("/interview/new?type=behavioral");
  await page.getByLabel("Role", { exact: true }).fill("Backend Engineer");
  await page.getByRole("button", { name: "Start interview" }).click();
  await page.waitForURL(/\/interview\/[a-f0-9]{24}$/);
  const id = page.url().split("/").pop()!;
  const statuses = await page.evaluate(async (id) => {
    const body = JSON.stringify({ answer: "In my last role I owned the payments service and fixed duplicate orders.", inputMode: "text", turnIndex: 1 });
    const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
    const rs = await Promise.all([fetch(`/api/interviews/${id}/answer`, opts), fetch(`/api/interviews/${id}/answer`, opts)]);
    return rs.map((r) => r.status).sort();
  }, id);
  expect(statuses).toEqual([200, 409]);
  const empty = await page.request.post(`/api/interviews/${id}/answer`, { data: { answer: "  " } });
  expect(empty.status()).toBe(400);
});
