import { describe, expect, it } from "vitest";
import { heuristicResumeAnalysis } from "@/lib/ai/resume-analyzer";
import { detectResumeKind, extractResumeText, ResumeParseError } from "@/lib/resume/extract-text";

const RESUME = `Swayam Patil
Full-Stack & AI Engineer · 1.5 years experience

SKILLS
Python, JavaScript, TypeScript, React, Next.js, Node.js, MongoDB, PostgreSQL, Redis, Docker

EXPERIENCE
Acme Labs | Software Engineer | Jan 2025 - Present
• Built a production-grade RAG pipeline serving 5,000 users with Gemini and a vector database
• Reduced API latency by 40% by adding Redis caching

PROJECTS
ParkEase — real-time parking availability
• Designed an event pipeline with Redis Streams and Node.js
• Implemented a Next.js dashboard with MongoDB
InterviewBot
• Created an LLM-powered mock interviewer in Python

EDUCATION
B.Tech Computer Engineering`;

describe("heuristicResumeAnalysis", () => {
  const analysis = heuristicResumeAnalysis(RESUME, "AI Engineer");

  it("extracts skills with categories", () => {
    const names = analysis.skills.map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(["Python", "React", "Next.js", "Node.js", "MongoDB", "Redis", "RAG", "LLMs"]));
    expect(names).not.toContain("Java");
    expect(analysis.skills.find((s) => s.name === "Redis")!.category).toBe("database");
    // "Next.js"/"Node.js" must not count as JavaScript mentions.
    expect(analysis.skills.find((s) => s.name === "JavaScript")!.proficiency).toBe(52);
  });

  it("finds projects with technologies", () => {
    expect(analysis.projects.map((p) => p.name)).toEqual(["ParkEase", "InterviewBot"]);
    expect(analysis.projects[0].technologies).toEqual(expect.arrayContaining(["Redis", "Node.js", "Next.js", "MongoDB"]));
  });

  it("finds experience, years and claims to verify", () => {
    expect(analysis.totalExperienceYears).toBe(1.5);
    expect(analysis.experience[0].duration).toBe("Jan 2025 - Present");
    expect(analysis.claimsToVerify[0].claim).toMatch(/production-grade RAG pipeline|Reduced API latency/);
  });

  it("flags weak areas relative to the target role", () => {
    const weak = analysis.weakAreas.map((w) => w.name);
    expect(weak).toEqual(expect.arrayContaining(["AWS", "System Design", "Testing"]));
    expect(weak).not.toContain("Python");
  });
});

describe("resume text extraction", () => {
  it("detects file kinds by mime or extension", () => {
    expect(detectResumeKind("cv.pdf", "application/pdf")).toBe("pdf");
    expect(detectResumeKind("cv.DOCX", "application/octet-stream")).toBe("docx");
    expect(detectResumeKind("cv.png", "image/png")).toBeNull();
  });

  it("extracts and normalizes plain text", async () => {
    const text = await extractResumeText(Buffer.from(RESUME.replace(/\n/g, "\r\n")), "txt");
    expect(text).not.toContain("\r");
    expect(text).toContain("ParkEase");
  });

  it("rejects near-empty files", async () => {
    await expect(extractResumeText(Buffer.from("hi"), "txt")).rejects.toBeInstanceOf(ResumeParseError);
  });
});
