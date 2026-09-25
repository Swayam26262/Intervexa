import { expect, test } from "@playwright/test";
import { answer, buy, saveProfile, signUp } from "./helpers";

const JD = `We are looking for an AI Engineer to join our team at Acme.
Requirements:
- 1+ years of experience with Python and REST APIs
- Experience building RAG pipelines with LLMs and vector databases
- Familiarity with AWS and Docker
Nice to have:
- LangChain
- Testing with pytest`;

test("mock loop from a job description", async ({ page }) => {
  await signUp(page);
  await saveProfile(page);
  await buy(page, "Get Pro");

  await page.goto("/loops");
  await page.getByLabel("Job description").fill(JD);
  await page.getByRole("button", { name: "Build my loop" }).click();
  await page.waitForURL(/\/loops\/[a-f0-9]{24}$/);
  await expect(page.getByText("0 of")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rounds" })).toBeVisible();

  await page.getByRole("button", { name: /Start round/ }).first().click();
  await page.waitForURL(/\/interview\/[a-f0-9]{24}$/);
  await answer(page, "I would start with a hash map to track what I've seen, because lookups are O(1), then walk the array once.");
  await page.getByRole("button", { name: "End", exact: true }).click();
  await page.getByRole("button", { name: "End & get report" }).click();
  await page.waitForURL(/\/report$/);
  await page.getByRole("link", { name: /Back to loop/ }).click();
  await expect(page.getByText("1 of")).toBeVisible();
});
