import { describe, expect, it } from "vitest";
import { heuristicJdAnalysis } from "@/lib/ai/jd-analyzer";
import { starCoverage, repeatedPhrases } from "@/lib/analysis/communication";
import { summarizeDiagram, type DiagramElement } from "@/lib/diagram";
import { normalizeForCompare } from "@/lib/interview/coding-problems";
import { computeBadges, computeStreak, dayKey, type ActivityPoint } from "@/lib/interview/gamification";
import { planLoopRounds } from "@/lib/server/loop-service";
import type { JdAnalysis } from "@/lib/interview/types";

// Noon IST keeps every timestamp comfortably inside its Asia/Kolkata calendar day.
const at = (day: string) => new Date(`${day}T06:30:00Z`);
const point = (day: string, over: Partial<ActivityPoint> = {}): ActivityPoint => ({
  at: at(day),
  type: "technical",
  score: 70,
  fillerRate: 2,
  ...over,
});

describe("computeStreak", () => {
  const now = at("2026-09-25");

  it("counts consecutive days ending today", () => {
    const s = computeStreak([at("2026-09-23"), at("2026-09-24"), at("2026-09-25"), at("2026-09-25")].map((d) => ({ at: d })), now);
    expect(s).toMatchObject({ current: 3, longest: 3, practicedToday: true });
    expect(s.week).toHaveLength(7);
    expect(s.week.at(-1)).toEqual({ day: "2026-09-25", practiced: true });
  });

  it("keeps a streak alive until the end of today", () => {
    const s = computeStreak([{ at: at("2026-09-23") }, { at: at("2026-09-24") }], now);
    expect(s.current).toBe(2);
    expect(s.practicedToday).toBe(false);
  });

  it("breaks after a missed day but remembers the longest run", () => {
    const days = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-23"];
    const s = computeStreak(days.map((d) => ({ at: at(d) })), now);
    expect(s.current).toBe(0);
    expect(s.longest).toBe(4);
  });

  it("buckets days in the app timezone", () => {
    // 20:00 UTC on the 24th is already the 25th in India.
    expect(dayKey(new Date("2026-09-24T20:00:00Z"), "Asia/Kolkata")).toBe("2026-09-25");
  });
});

describe("computeBadges", () => {
  const now = at("2026-09-25");
  const byId = (points: ActivityPoint[]) => Object.fromEntries(computeBadges(points, now).map((b) => [b.id, b]));

  it("awards nothing to a new user", () => {
    expect(computeBadges([], now).every((b) => !b.earned && b.progress === 0)).toBe(true);
  });

  it("awards badges from real activity", () => {
    const b = byId([
      point("2026-09-20", { type: "system_design", score: 85, fillerRate: 0.5 }),
      point("2026-09-21", { type: "system_design", score: 80, fillerRate: 0.5 }),
      point("2026-09-22", { type: "system_design", score: 82, fillerRate: 0.5 }),
      point("2026-09-23", { type: "coding", score: 76 }),
      point("2026-09-24", { type: "project_deep_dive", score: 60 }),
    ]);
    expect(b.first.earned).toBe(true);
    expect(b["system-design"].earned).toBe(true);
    expect(b["no-filler"].earned).toBe(true);
    expect(b["green-tests"].earned).toBe(true);
    expect(b["resume-crusher"].earned).toBe(false);
    expect(b["resume-crusher"].progress).toBeCloseTo(0.75);
    expect(b["well-rounded"].earned).toBe(false);
    expect(b.ten.progress).toBeCloseTo(0.5);
  });

  it("needs three system design rounds, not one great one", () => {
    expect(byId([point("2026-09-24", { type: "system_design", score: 99 })])["system-design"].earned).toBe(false);
  });
});

describe("summarizeDiagram", () => {
  const els: DiagramElement[] = [
    { id: "client", type: "rectangle", x: 0, y: 0 },
    { id: "t1", type: "text", text: "Client", containerId: "client" },
    { id: "api", type: "rectangle", x: 0, y: 100 },
    { id: "t2", type: "text", text: "API\n gateway", containerId: "api" },
    { id: "db", type: "ellipse", x: 0, y: 200 },
    { id: "t3", type: "text", text: "Postgres", containerId: "db" },
    { id: "a1", type: "arrow", startBinding: { elementId: "client" }, endBinding: { elementId: "api" } },
    { id: "a2", type: "arrow", startBinding: { elementId: "api" }, endBinding: { elementId: "db" } },
    { id: "t4", type: "text", text: "writes", containerId: "a2" },
    { id: "note", type: "text", text: "p99 < 200ms" },
    { id: "gone", type: "rectangle", isDeleted: true },
  ];

  it("lists components top-to-bottom, labelled connections and free notes", () => {
    expect(summarizeDiagram(els)).toBe(
      "Components: Client, API gateway, Postgres. Connections: Client → API gateway; API gateway → Postgres (writes). Notes: p99 < 200ms.",
    );
  });

  it("returns an empty string for an empty board", () => {
    expect(summarizeDiagram([])).toBe("");
  });
});

describe("normalizeForCompare", () => {
  it("compares exact, unordered and unordered-nested outputs", () => {
    expect(normalizeForCompare([0, 1], "exact")).not.toBe(normalizeForCompare([1, 0], "exact"));
    expect(normalizeForCompare([0, 1], "unordered")).toBe(normalizeForCompare([1, 0], "unordered"));
    expect(normalizeForCompare([["b", "a"], ["c"]], "unordered-nested")).toBe(normalizeForCompare([["c"], ["a", "b"]], "unordered-nested"));
  });
});

describe("communication v2", () => {
  it("finds repeated verbal tics across answers", () => {
    const phrases = repeatedPhrases([
      "At the end of the day we shipped it.",
      "At the end of the day it scaled.",
      "Honestly, at the end of the day users were happy.",
    ]);
    expect(phrases[0]).toEqual({ phrase: "at the end", count: 3 });
  });

  it("measures STAR coverage on longer answers only", () => {
    expect(starCoverage(["Too short."])).toBeNull();
    const cov = starCoverage([
      "When I was at my last company our deploys kept failing. My goal was to make them reliable, so I built a canary pipeline and as a result failures dropped by 80 percent over two months.",
    ]);
    expect(cov?.answers).toBe(1);
    expect(cov?.result).toBe(1);
  });
});

describe("heuristicJdAnalysis", () => {
  const jd = [
    "AI Engineer at Acme Labs",
    "Requirements:",
    "- 2+ years with Python and REST APIs",
    "- Experience building RAG pipelines with LLMs",
    "Nice to have:",
    "- Docker",
  ].join("\n");

  it("splits must-have from nice-to-have skills and scores the match", () => {
    const a = heuristicJdAnalysis(jd, {
      profileSkills: ["Docker"],
      resume: { summary: "", projects: [], skills: [{ name: "Python", proficiency: 80, evidence: "" }] } as never,
    });
    const skill = (n: string) => a.requiredSkills.find((s) => s.name.toLowerCase() === n.toLowerCase());
    expect(skill("Python")).toMatchObject({ importance: "must", match: "strong" });
    expect(skill("Docker")).toMatchObject({ importance: "nice", match: "partial" });
    expect(a.focusAreas.length).toBeGreaterThan(0);
    expect(a.focusAreas).not.toContain("Python");
    expect(a.readiness).toBeGreaterThan(0);
    expect(a.readiness).toBeLessThan(100);
  });

  it("handles text with no recognisable skills", () => {
    const a = heuristicJdAnalysis("We are a friendly team.", { profileSkills: [] });
    expect(a.requiredSkills).toEqual([]);
    expect(a.readiness).toBe(0);
  });
});

describe("planLoopRounds", () => {
  const jd = (skills: string[], over: Partial<JdAnalysis> = {}): JdAnalysis => ({
    title: "AI Engineer",
    company: null,
    seniority: null,
    summary: "",
    requiredSkills: skills.map((name) => ({ name, importance: "must", match: "missing", evidence: "" })),
    focusAreas: ["RAG"],
    readiness: 0,
    ...over,
  });

  it("builds coding, core, AI, design and behavioral rounds for an AI engineer", () => {
    const rounds = planLoopRounds(jd(["Python", "REST APIs", "RAG", "LLMs"]), "AI Engineer role", 2);
    expect(rounds.map((r) => r.type)).toEqual(["coding", "technical", "technical", "system_design", "behavioral"]);
    expect(rounds[2].title).toMatch(/^AI\/ML/);
  });

  it("pads a thin loop with a project deep dive and never exceeds five rounds", () => {
    const thin = planLoopRounds(jd([], { title: "Product Analyst" }), "Analyst role", 0);
    expect(thin[0].type).toBe("project_deep_dive");
    expect(thin.length).toBeGreaterThanOrEqual(2);
    const all = planLoopRounds(jd(["Python", "RAG", "Kafka", "LLMs"]), "Senior engineer, distributed systems", 6);
    expect(all.length).toBeLessThanOrEqual(5);
  });
});
