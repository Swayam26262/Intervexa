import type { CodeLanguage } from "./types";
import type { Difficulty } from "./config";

export type Comparator = "exact" | "unordered" | "unordered-nested";

export interface CodingTest {
  args: unknown[];
  expected: unknown;
  /**
   * Hidden tests run only on "Submit", like a judge. Code executes in the candidate's own
   * browser, so these inputs are not secret — this is practice, not an anti-cheat grader.
   */
  hidden?: boolean;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  statement: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  functionName: Record<CodeLanguage, string>;
  starter: Record<CodeLanguage, string>;
  compare: Comparator;
  tests: CodingTest[];
  /** Reference complexity, used by the offline reviewer. */
  optimal: { time: string; space: string };
  /** Concepts a strong explanation mentions. */
  keywords: string[];
  followUps: string[];
}

const js = (name: string, params: string) => `function ${name}(${params}) {\n  // Write your solution here\n}\n`;
const py = (name: string, params: string) => `def ${name}(${params}):\n    # Write your solution here\n    pass\n`;

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    topics: ["Arrays", "Hash maps"],
    statement:
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Each input has exactly one solution, and you may not use the same element twice.",
    examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 9" }],
    constraints: ["2 ≤ nums.length ≤ 10⁴", "Exactly one valid answer exists"],
    functionName: { javascript: "twoSum", python: "two_sum" },
    starter: { javascript: js("twoSum", "nums, target"), python: py("two_sum", "nums, target") },
    compare: "unordered",
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
      { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], hidden: true },
      { args: [[0, 4, 3, 0], 0], expected: [0, 3], hidden: true },
    ],
    optimal: { time: "O(n)", space: "O(n)" },
    keywords: ["hash map", "complement", "o(n)", "single pass"],
    followUps: [
      "What's the time and space complexity of your solution?",
      "How would you solve it if the array were sorted and you needed O(1) extra space?",
    ],
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "easy",
    topics: ["Stacks", "Strings"],
    statement:
      "Given a string `s` containing only `()[]{}`, return `true` if every opening bracket is closed by the same type of bracket in the correct order.",
    examples: [
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁴"],
    functionName: { javascript: "isValid", python: "is_valid" },
    starter: { javascript: js("isValid", "s"), python: py("is_valid", "s") },
    compare: "exact",
    tests: [
      { args: ["()"], expected: true },
      { args: ["()[]{}"], expected: true },
      { args: ["(]"], expected: false },
      { args: ["([)]"], expected: false, hidden: true },
      { args: ["{[]}"], expected: true, hidden: true },
      { args: ["(("], expected: false, hidden: true },
    ],
    optimal: { time: "O(n)", space: "O(n)" },
    keywords: ["stack", "matching", "o(n)", "empty"],
    followUps: ["What edge cases did you consider?", "How would you report the position of the first invalid bracket?"],
  },
  {
    id: "longest-consecutive",
    title: "Longest Consecutive Sequence",
    difficulty: "medium",
    topics: ["Arrays", "Hash sets"],
    statement:
      "Given an unsorted array of integers `nums`, return the length of the longest sequence of consecutive integers. Your algorithm should run in O(n) time.",
    examples: [{ input: "nums = [100,4,200,1,3,2]", output: "4", explanation: "The sequence is [1, 2, 3, 4]." }],
    constraints: ["0 ≤ nums.length ≤ 10⁵"],
    functionName: { javascript: "longestConsecutive", python: "longest_consecutive" },
    starter: { javascript: js("longestConsecutive", "nums"), python: py("longest_consecutive", "nums") },
    compare: "exact",
    tests: [
      { args: [[100, 4, 200, 1, 3, 2]], expected: 4 },
      { args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
      { args: [[]], expected: 0 },
      { args: [[1, 2, 0, 1]], expected: 3, hidden: true },
      { args: [[-3, -2, -1, 10, 11]], expected: 3, hidden: true },
    ],
    optimal: { time: "O(n)", space: "O(n)" },
    keywords: ["set", "sequence start", "o(n)", "duplicates"],
    followUps: [
      "Why is your solution O(n) even though there's a loop inside a loop?",
      "How would this change if the numbers arrived as a stream?",
    ],
  },
  {
    id: "group-anagrams",
    title: "Group Anagrams",
    difficulty: "medium",
    topics: ["Hash maps", "Strings"],
    statement: "Given an array of strings `strs`, group the anagrams together. You can return the groups in any order.",
    examples: [{ input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }],
    constraints: ["1 ≤ strs.length ≤ 10⁴", "Strings contain lowercase English letters"],
    functionName: { javascript: "groupAnagrams", python: "group_anagrams" },
    starter: { javascript: js("groupAnagrams", "strs"), python: py("group_anagrams", "strs") },
    compare: "unordered-nested",
    tests: [
      { args: [["eat", "tea", "tan", "ate", "nat", "bat"]], expected: [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]] },
      { args: [[""]], expected: [[""]] },
      { args: [["a"]], expected: [["a"]] },
      { args: [["abc", "bca", "cab", "xyz", "zyx", "q"]], expected: [["abc", "bca", "cab"], ["xyz", "zyx"], ["q"]], hidden: true },
    ],
    optimal: { time: "O(n·k)", space: "O(n·k)" },
    keywords: ["hash map", "sorted key", "character count", "o(n"],
    followUps: ["What key did you use and why?", "How would you avoid sorting each string?"],
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "medium",
    topics: ["Sorting", "Intervals"],
    statement: "Given an array of `intervals` where `intervals[i] = [start, end]`, merge all overlapping intervals and return them sorted by start.",
    examples: [{ input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" }],
    constraints: ["1 ≤ intervals.length ≤ 10⁴"],
    functionName: { javascript: "merge", python: "merge" },
    starter: { javascript: js("merge", "intervals"), python: py("merge", "intervals") },
    compare: "exact",
    tests: [
      { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { args: [[[4, 7], [1, 4]]], expected: [[1, 7]], hidden: true },
      { args: [[[1, 4], [2, 3]]], expected: [[1, 4]], hidden: true },
    ],
    optimal: { time: "O(n log n)", space: "O(n)" },
    keywords: ["sort", "overlap", "o(n log n)", "previous end"],
    followUps: ["Why do you need to sort first?", "How would you insert a new interval into an already merged list?"],
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    topics: ["Sliding window", "Strings"],
    statement: "Given a string `s`, return the length of the longest substring without repeating characters.",
    examples: [{ input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc".' }],
    constraints: ["0 ≤ s.length ≤ 5·10⁴"],
    functionName: { javascript: "lengthOfLongestSubstring", python: "length_of_longest_substring" },
    starter: { javascript: js("lengthOfLongestSubstring", "s"), python: py("length_of_longest_substring", "s") },
    compare: "exact",
    tests: [
      { args: ["abcabcbb"], expected: 3 },
      { args: ["bbbbb"], expected: 1 },
      { args: ["pwwkew"], expected: 3 },
      { args: [""], expected: 0, hidden: true },
      { args: ["dvdf"], expected: 3, hidden: true },
    ],
    optimal: { time: "O(n)", space: "O(min(n, charset))" },
    keywords: ["sliding window", "two pointers", "last seen", "o(n)"],
    followUps: ["Walk me through how your window moves.", "What changes if the input is Unicode text?"],
  },
  {
    id: "top-k-frequent",
    title: "Top K Frequent Elements",
    difficulty: "medium",
    topics: ["Hash maps", "Heaps", "Bucket sort"],
    statement: "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements, in any order.",
    examples: [{ input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]" }],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "The answer is unique"],
    functionName: { javascript: "topKFrequent", python: "top_k_frequent" },
    starter: { javascript: js("topKFrequent", "nums, k"), python: py("top_k_frequent", "nums, k") },
    compare: "unordered",
    tests: [
      { args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] },
      { args: [[1], 1], expected: [1] },
      { args: [[4, 4, 4, 5, 5, 6, 6, 6, 6], 2], expected: [4, 6], hidden: true },
    ],
    optimal: { time: "O(n)", space: "O(n)" },
    keywords: ["frequency", "heap", "bucket", "o(n log k)"],
    followUps: ["Can you beat O(n log n)?", "How would you do this over a stream that doesn't fit in memory?"],
  },
  {
    id: "product-except-self",
    title: "Product of Array Except Self",
    difficulty: "medium",
    topics: ["Arrays", "Prefix products"],
    statement: "Given an integer array `nums`, return an array `answer` where `answer[i]` is the product of all elements except `nums[i]`, without using division, in O(n) time.",
    examples: [{ input: "nums = [1,2,3,4]", output: "[24,12,8,6]" }],
    constraints: ["2 ≤ nums.length ≤ 10⁵"],
    functionName: { javascript: "productExceptSelf", python: "product_except_self" },
    starter: { javascript: js("productExceptSelf", "nums"), python: py("product_except_self", "nums") },
    compare: "exact",
    tests: [
      { args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
      { args: [[2, 3]], expected: [3, 2], hidden: true },
    ],
    optimal: { time: "O(n)", space: "O(1) extra" },
    keywords: ["prefix", "suffix", "o(n)", "no division"],
    followUps: ["How would you do it with O(1) extra space?", "What happens with zeros?"],
  },
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "hard",
    topics: ["Two pointers", "Arrays"],
    statement: "Given `n` non-negative integers representing an elevation map where each bar has width 1, compute how much water it can trap after raining.",
    examples: [{ input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" }],
    constraints: ["1 ≤ n ≤ 2·10⁴"],
    functionName: { javascript: "trap", python: "trap" },
    starter: { javascript: js("trap", "height"), python: py("trap", "height") },
    compare: "exact",
    tests: [
      { args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
      { args: [[4, 2, 0, 3, 2, 5]], expected: 9 },
      { args: [[1]], expected: 0, hidden: true },
      { args: [[5, 4, 1, 2]], expected: 1, hidden: true },
    ],
    optimal: { time: "O(n)", space: "O(1)" },
    keywords: ["two pointers", "left max", "right max", "o(n)"],
    followUps: ["Explain why the two-pointer approach is correct.", "How would you solve the 2D version?"],
  },
  {
    id: "min-window",
    title: "Minimum Window Substring",
    difficulty: "hard",
    topics: ["Sliding window", "Hash maps"],
    statement: 'Given strings `s` and `t`, return the smallest substring of `s` that contains every character of `t` (including duplicates). Return "" if there is none.',
    examples: [{ input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"' }],
    constraints: ["1 ≤ s.length, t.length ≤ 10⁵", "The answer is unique"],
    functionName: { javascript: "minWindow", python: "min_window" },
    starter: { javascript: js("minWindow", "s, t"), python: py("min_window", "s, t") },
    compare: "exact",
    tests: [
      { args: ["ADOBECODEBANC", "ABC"], expected: "BANC" },
      { args: ["a", "a"], expected: "a" },
      { args: ["a", "aa"], expected: "" },
      { args: ["aaflslflsldkalskaaa", "aaa"], expected: "aaa", hidden: true },
    ],
    optimal: { time: "O(|s| + |t|)", space: "O(charset)" },
    keywords: ["sliding window", "counts", "shrink", "o(n)"],
    followUps: ["How do you know when the window is valid without rescanning?", "What is the complexity?"],
  },
];

export function getProblem(id: string | undefined): CodingProblem | undefined {
  return CODING_PROBLEMS.find((p) => p.id === id);
}

/** Deterministic choice for a difficulty (stable per seed) so reloads don't change the problem. */
export function pickProblem(difficulty: Difficulty, seed: string): CodingProblem {
  const pool = CODING_PROBLEMS.filter((p) => p.difficulty === difficulty);
  const list = pool.length ? pool : CODING_PROBLEMS;
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

/** The problem as sent to the browser (without the reviewer-only fields). */
export function publicProblem(p: CodingProblem) {
  return {
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    topics: p.topics,
    statement: p.statement,
    examples: p.examples,
    constraints: p.constraints,
    functionName: p.functionName,
    starter: p.starter,
    compare: p.compare,
    tests: p.tests.map((t, i) => ({ ...t, name: t.hidden ? `Hidden test ${i + 1}` : `Test ${i + 1}` })),
  };
}
export type PublicProblem = ReturnType<typeof publicProblem>;

/** Stable comparison used by the in-browser runner (and unit tests). */
export function normalizeForCompare(value: unknown, compare: Comparator): string {
  const canon = (v: unknown): unknown => (Array.isArray(v) ? v.map(canon) : v);
  let v = canon(value);
  if (compare === "unordered" && Array.isArray(v)) v = [...v].sort(sortKey);
  if (compare === "unordered-nested" && Array.isArray(v)) {
    v = v.map((inner) => (Array.isArray(inner) ? [...inner].sort(sortKey) : inner)).sort(sortKey);
  }
  return JSON.stringify(v);
}

function sortKey(a: unknown, b: unknown): number {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}
