/** Skill dictionary shared by resume analysis, JD matching and the profile UI (no server deps). */

/** Whole-word (or whole-term) match, so "ai" doesn't match "failure" and "js" doesn't match "next.js". */
export function mentions(text: string, term: string): boolean {
  const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9.])${escaped}([^a-z0-9]|$)`).test(text.toLowerCase());
}

export const SKILL_CATEGORIES = {
  language: "Languages",
  frontend: "Frontend",
  backend: "Backend",
  ai_ml: "AI / ML",
  database: "Databases",
  cloud_devops: "Cloud & DevOps",
  testing: "Testing",
  other: "Other",
} as const;
export type SkillCategory = keyof typeof SKILL_CATEGORIES;

export const SKILLS: { name: string; category: SkillCategory; aliases: string[] }[] = [
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

/** Skills from the dictionary that a text mentions (whole-term matches). */
export function skillsIn(text: string) {
  return SKILLS.filter((s) => s.aliases.some((a) => mentions(text, a)));
}

/** Category for a free-text skill name (dictionary match on name or alias). */
export function categorizeSkill(name: string): SkillCategory {
  const lower = name.toLowerCase().trim();
  const hit = SKILLS.find((s) => s.name.toLowerCase() === lower || s.aliases.includes(lower)) ?? skillsIn(lower)[0];
  return hit?.category ?? "other";
}

