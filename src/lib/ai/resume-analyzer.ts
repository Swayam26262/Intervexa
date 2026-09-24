import type { ResumeAnalysis } from "@/lib/interview/types";
import { generateJson, isAiConfigured } from "./client";
import { mentions } from "./demo/question-bank";
import { resumePrompt, resumeSystemPrompt } from "./prompts";
import { resumeAnalysisSchema } from "./schemas";

const MAX_RESUME_CHARS = 24000;

export async function analyzeResume(
  text: string,
  targetRole?: string,
): Promise<{ analysis: ResumeAnalysis; mode: "gemini" | "demo" }> {
  if (!isAiConfigured()) {
    return { analysis: heuristicResumeAnalysis(text, targetRole), mode: "demo" };
  }
  const out = await generateJson({
    system: resumeSystemPrompt(),
    prompt: resumePrompt(text.slice(0, MAX_RESUME_CHARS), targetRole),
    schema: resumeAnalysisSchema,
  });
  return { analysis: normalizeResumeAnalysis(out), mode: "gemini" };
}

const pct = (n: number) => Math.round(Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0)));

export function normalizeResumeAnalysis(a: ResumeAnalysis): ResumeAnalysis {
  return {
    ...a,
    totalExperienceYears:
      a.totalExperienceYears === null || !Number.isFinite(a.totalExperienceYears)
        ? null
        : Math.max(0, Math.round(a.totalExperienceYears * 10) / 10),
    skills: a.skills.slice(0, 25).map((s) => ({ ...s, proficiency: pct(s.proficiency) })),
    strongAreas: a.strongAreas.slice(0, 6).map((s) => ({ ...s, score: pct(s.score) })),
    weakAreas: a.weakAreas.slice(0, 6).map((s) => ({ ...s, score: pct(s.score) })),
    projects: a.projects.slice(0, 8),
    experience: a.experience.slice(0, 8),
    claimsToVerify: a.claimsToVerify.slice(0, 6),
  };
}

// ─── Offline heuristic analysis (demo mode) ────────────────────────────────

const SKILLS: { name: string; category: string; aliases: string[] }[] = [
  { name: "Python", category: "language", aliases: ["python"] },
  { name: "JavaScript", category: "language", aliases: ["javascript", "js", "es6"] },
  { name: "TypeScript", category: "language", aliases: ["typescript", "ts"] },
  { name: "Java", category: "language", aliases: ["java"] },
  { name: "C++", category: "language", aliases: ["c++", "cpp"] },
  { name: "Go", category: "language", aliases: ["golang"] },
  { name: "SQL", category: "language", aliases: ["sql"] },
  { name: "React", category: "frontend", aliases: ["react", "react.js", "reactjs"] },
  { name: "Next.js", category: "frontend", aliases: ["next.js", "nextjs"] },
  { name: "Tailwind CSS", category: "frontend", aliases: ["tailwind", "tailwindcss"] },
  { name: "HTML/CSS", category: "frontend", aliases: ["html", "css"] },
  { name: "Node.js", category: "backend", aliases: ["node", "node.js", "nodejs"] },
  { name: "Express", category: "backend", aliases: ["express", "express.js"] },
  { name: "Django", category: "backend", aliases: ["django"] },
  { name: "FastAPI", category: "backend", aliases: ["fastapi"] },
  { name: "Flask", category: "backend", aliases: ["flask"] },
  { name: "REST APIs", category: "backend", aliases: ["rest api", "rest apis", "restful"] },
  { name: "GraphQL", category: "backend", aliases: ["graphql"] },
  { name: "WebSockets", category: "backend", aliases: ["websocket", "websockets", "socket.io"] },
  { name: "LLMs", category: "ai_ml", aliases: ["llm", "llms", "large language model", "gpt", "gemini", "openai"] },
  { name: "RAG", category: "ai_ml", aliases: ["rag", "retrieval-augmented", "retrieval augmented"] },
  { name: "Prompt Engineering", category: "ai_ml", aliases: ["prompt engineering", "prompting"] },
  { name: "LangChain", category: "ai_ml", aliases: ["langchain", "langgraph"] },
  { name: "Vector Databases", category: "ai_ml", aliases: ["vector database", "vector db", "pinecone", "chroma", "faiss", "pgvector", "embeddings"] },
  { name: "Machine Learning", category: "ai_ml", aliases: ["machine learning", "ml", "scikit-learn", "sklearn"] },
  { name: "Deep Learning", category: "ai_ml", aliases: ["deep learning", "pytorch", "tensorflow", "keras"] },
  { name: "MongoDB", category: "database", aliases: ["mongodb", "mongo", "mongoose"] },
  { name: "PostgreSQL", category: "database", aliases: ["postgresql", "postgres"] },
  { name: "MySQL", category: "database", aliases: ["mysql"] },
  { name: "Redis", category: "database", aliases: ["redis"] },
  { name: "AWS", category: "cloud_devops", aliases: ["aws", "amazon web services", "ec2", "s3", "lambda"] },
  { name: "GCP", category: "cloud_devops", aliases: ["gcp", "google cloud"] },
  { name: "Azure", category: "cloud_devops", aliases: ["azure"] },
  { name: "Docker", category: "cloud_devops", aliases: ["docker"] },
  { name: "Kubernetes", category: "cloud_devops", aliases: ["kubernetes", "k8s"] },
  { name: "CI/CD", category: "cloud_devops", aliases: ["ci/cd", "github actions", "jenkins"] },
  { name: "Testing", category: "testing", aliases: ["jest", "vitest", "pytest", "cypress", "playwright", "unit test", "unit tests", "testing"] },
  { name: "System Design", category: "other", aliases: ["system design", "microservices", "distributed systems", "scalable architecture"] },
  { name: "Git", category: "other", aliases: ["git", "github"] },
];

const ROLE_EXPECTATIONS: { match: string[]; skills: string[] }[] = [
  { match: ["ai", "ml", "machine learning", "llm", "data scientist"], skills: ["Python", "LLMs", "RAG", "Vector Databases", "AWS", "System Design", "Testing"] },
  { match: ["full stack", "full-stack", "fullstack"], skills: ["React", "Node.js", "PostgreSQL", "System Design", "AWS", "Testing"] },
  { match: ["frontend", "front-end", "ui"], skills: ["React", "TypeScript", "HTML/CSS", "Testing", "Next.js"] },
  { match: ["backend", "back-end"], skills: ["Node.js", "PostgreSQL", "Redis", "System Design", "AWS", "Testing"] },
  { match: ["devops", "sre", "cloud"], skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "System Design"] },
];

const SECTION_HEADINGS =
  /^(projects?|personal projects|academic projects|key projects|experience|work experience|professional experience|employment|education|skills|technical skills|certifications?|achievements|awards|summary|profile|objective|publications|interests|languages)\s*:?\s*$/i;
const BULLET = /^[•\-*▪◦●‣–]\s*/;
const CLAIM_VERBS = /\b(built|designed|developed|led|architected|implemented|optimi[sz]ed|improved|reduced|increased|scaled|deployed|launched|created|automated)\b/i;
const CLAIM_BOOST = /\d|production|scalable|real-time|million|users|latency|%/i;
const DATE_RANGE = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—to]+\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current|now)/i;

function sections(text: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  let current = "header";
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (SECTION_HEADINGS.test(line)) {
      current = line.toLowerCase().replace(/:$/, "").trim();
      continue;
    }
    map.set(current, [...(map.get(current) ?? []), line]);
  }
  return map;
}

function findSection(map: Map<string, string[]>, pattern: RegExp): string[] {
  for (const [key, lines] of map) if (pattern.test(key)) return lines;
  return [];
}

function groupEntries(lines: string[]): { title: string; bullets: string[] }[] {
  const entries: { title: string; bullets: string[] }[] = [];
  for (const line of lines) {
    if (BULLET.test(line) || (entries.length && line.length > 90)) {
      if (!entries.length) entries.push({ title: "Untitled", bullets: [] });
      entries[entries.length - 1].bullets.push(line.replace(BULLET, ""));
    } else {
      entries.push({ title: line, bullets: [] });
    }
  }
  return entries;
}

function skillsIn(text: string) {
  return SKILLS.filter((s) => s.aliases.some((a) => mentions(text, a)));
}

export function heuristicResumeAnalysis(text: string, targetRole?: string): ResumeAnalysis {
  const lower = text.toLowerCase();
  const map = sections(text);

  const skills = SKILLS.map((s) => {
    const count = s.aliases.reduce((sum, a) => {
      const escaped = a.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
      return sum + (lower.match(new RegExp(`(^|[^a-z0-9.])${escaped}(?=[^a-z0-9]|$)`, "g"))?.length ?? 0);
    }, 0);
    return { skill: s, count };
  })
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .map(({ skill, count }) => ({
      name: skill.name,
      category: skill.category,
      proficiency: Math.min(90, 40 + count * 12),
      evidence: `Mentioned ${count} time${count === 1 ? "" : "s"} in the resume`,
    }));

  const projects = groupEntries(findSection(map, /project/))
    .filter((e) => e.title !== "Untitled" || e.bullets.length)
    .slice(0, 6)
    .map((e) => {
      const name = e.title.split(/\s[|–—-]\s|:/)[0].trim().slice(0, 80);
      const body = [e.title, ...e.bullets].join(" ");
      return {
        name,
        summary: e.bullets[0] ?? e.title,
        technologies: skillsIn(body).map((s) => s.name),
        claims: e.bullets.filter((b) => CLAIM_VERBS.test(b)).slice(0, 3),
      };
    });

  const experience = groupEntries(findSection(map, /experience|employment/))
    .filter((e) => e.bullets.length)
    .slice(0, 6)
    .map((e) => ({
      company: e.title.replace(DATE_RANGE, "").replace(/[|,–—-]\s*$/, "").trim(),
      role: "",
      duration: e.title.match(DATE_RANGE)?.[0] ?? "",
      highlights: e.bullets.slice(0, 4),
    }));

  const bullets = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => BULLET.test(l))
    .map((l) => l.replace(BULLET, ""));
  const claimsToVerify = bullets
    .filter((b) => CLAIM_VERBS.test(b))
    .sort((a, b) => Number(CLAIM_BOOST.test(b)) - Number(CLAIM_BOOST.test(a)))
    .slice(0, 5)
    .map((claim) => ({
      claim,
      followUpQuestions: [
        "Walk me through exactly how you did that, step by step.",
        "How did you measure the result?",
        "What would you do differently if you built it again?",
      ],
    }));

  const role = (targetRole ?? "").toLowerCase();
  const expected =
    ROLE_EXPECTATIONS.find((r) => r.match.some((m) => mentions(role, m)))?.skills ?? ["System Design", "Testing", "AWS", "SQL"];
  const weakAreas = expected
    .map((name) => {
      const found = skills.find((s) => s.name === name);
      if (found && found.proficiency >= 60) return null;
      return {
        name,
        score: found ? found.proficiency : 25,
        reason: found ? "Mentioned, but with little evidence of depth" : "Not evidenced in the resume",
      };
    })
    .filter((x): x is { name: string; score: number; reason: string } => x !== null)
    .slice(0, 6);

  const yearsMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\b/i);
  const top = skills.slice(0, 3).map((s) => s.name);

  return {
    headline: [targetRole || "Software Engineer", top.join(" · ")].filter(Boolean).join(" — "),
    summary: skills.length
      ? `The resume mentions ${skills.length} recognised skills, strongest in ${top.join(", ")}. ${projects.length} project${projects.length === 1 ? "" : "s"} and ${experience.length} role${experience.length === 1 ? "" : "s"} detected.`
      : "Few recognisable technical skills were found. Make sure your skills and projects are written out as text.",
    totalExperienceYears: yearsMatch ? Number(yearsMatch[1]) : null,
    skills: skills.slice(0, 25),
    strongAreas: skills.slice(0, 5).map((s) => ({ name: s.name, score: s.proficiency })),
    weakAreas,
    projects,
    experience,
    claimsToVerify,
  };
}
