import { expect, test } from "@playwright/test";
import { buy, endInterview, signUp } from "./helpers";

const SOLUTION = `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
`;

test("coding round: editor, tests, code review", async ({ page }) => {
  await signUp(page);
  await buy(page, "Get Pro");

  await page.goto("/interview/new?type=coding");
  await page.getByLabel("Role", { exact: true }).fill("Software Engineer");
  await page.getByRole("radio", { name: "Easy" }).click();
  await page.getByLabel("Problem").selectOption("two-sum");
  await page.getByRole("button", { name: "Start interview" }).click();
  await page.waitForURL(/\/interview\/[a-f0-9]{24}$/);
  await expect(page.getByText("Two Sum").first()).toBeVisible();

  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.insertText(SOLUTION);
  await page.getByRole("button", { name: "Submit tests" }).click();
  await expect(page.getByText("5/5 passed")).toBeVisible();

  await page.getByLabel("Your answer").fill("I use a hash map from value to index. For each number I check whether its complement was seen, which is O(n) time and O(n) space. Edge cases: duplicates and negatives.");
  await expect(page.getByText(/Code · 5\/5 attached/)).toBeVisible();
  await page.getByRole("button", { name: "Send answer" }).click();
  await expect(page.getByText("Code · 5/5 tests")).toBeVisible();

  await endInterview(page);
  await expect(page.getByRole("heading", { name: "Code review" })).toBeVisible();
});

test("infinite loops are stopped by the runner", async ({ page }) => {
  await signUp(page);
  await buy(page, "Get Pro");
  await page.goto("/interview/new?type=coding");
  await page.getByLabel("Role", { exact: true }).fill("Software Engineer");
  await page.getByRole("button", { name: "Start interview" }).click();
  await page.waitForURL(/\/interview\/[a-f0-9]{24}$/);
  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.insertText("function twoSum() { while (true) {} }\nfunction isValid() { while (true) {} }\nfunction longestConsecutive() { while (true) {} }\nfunction groupAnagrams() { while (true) {} }\nfunction merge() { while (true) {} }\nfunction lengthOfLongestSubstring() { while (true) {} }\nfunction topKFrequent() { while (true) {} }\nfunction productExceptSelf() { while (true) {} }\nfunction trap() { while (true) {} }\nfunction minWindow() { while (true) {} }\n");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByText(/Time limit exceeded/)).toBeVisible({ timeout: 10_000 });
});
