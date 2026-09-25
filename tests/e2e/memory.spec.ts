import { expect, test } from "@playwright/test";
import { answer, buy, endInterview, saveProfile, signUp, STRONG_ANSWER } from "./helpers";

const RAG_ANSWER =
  "I would start with chunking the documents by semantic sections with some overlap, because splitting mid-sentence hurts retrieval. " +
  "Then I generate embeddings and store them in a vector database with metadata, retrieve the top 20 chunks, rerank them, and put the best 5 into the prompt with citations. " +
  "For example, this reduced hallucinations, and the trade-off was about 150ms of extra latency.";

test("weak topics are remembered, drilled, and improvement is verified", async ({ page }) => {
  await signUp(page, "Asha Rao");
  await saveProfile(page, "AI Engineer", "Python, RAG, LLMs,");
  await buy(page, "Get Pro");

  await page.goto("/interview/new?type=technical");
  await page.getByRole("button", { name: "Start interview" }).click();
  await page.waitForURL(/\/interview\/[a-f0-9]{24}$/);
  await answer(page, STRONG_ANSWER);
  await answer(page, "It would just work.");
  await answer(page, "I don't know.");
  await endInterview(page);

  await page.goto("/dashboard");
  await expect(page.getByText(/10-minute drill: LLMs & RAG/)).toBeVisible();
  await page.getByRole("link", { name: /Start drill/ }).click();
  await expect(page.getByLabel("Drill focus")).toHaveValue("LLMs & RAG");
  await page.getByRole("button", { name: "Start drill" }).click();
  await page.waitForURL(/\/interview\/[a-f0-9]{24}$/);
  await expect(page.getByText(/quick 10-minute drill/)).toBeVisible();
  await answer(page, "An embedding is a vector that captures semantic meaning, so similar text is close by cosine similarity.");
  await answer(page, RAG_ANSWER);
  await endInterview(page);
  await expect(page.getByRole("heading", { name: "Intervexa checked your weak spots" })).toBeVisible();
});
