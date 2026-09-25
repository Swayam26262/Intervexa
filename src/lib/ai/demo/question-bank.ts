import { getProblem } from "@/lib/interview/coding-problems";
import { mentions } from "@/lib/skills";
export { mentions } from "@/lib/skills";
import { getPack } from "@/lib/interview/packs";
import type { InterviewContext } from "@/lib/interview/types";

export interface DemoQuestion {
  text: string;
  keywords: string[];
}

export interface DemoTopic {
  name: string;
  reason: string;
  main: DemoQuestion;
  followUps: DemoQuestion[];
  easier: DemoQuestion;
}

const q = (text: string, keywords: string[]): DemoQuestion => ({ text, keywords });

interface TechnicalTopicDef extends Omit<DemoTopic, "reason"> {
  triggers: string[];
}

const TECHNICAL_TOPICS: TechnicalTopicDef[] = [
  {
    name: "JavaScript Fundamentals",
    triggers: ["javascript", "typescript", "js", "ts"],
    main: q("How does the JavaScript event loop work, and how do promises and async/await fit into it?", ["call stack", "microtask", "macrotask", "queue", "non-blocking", "promise"]),
    followUps: [
      q("What would happen if a CPU-heavy loop ran inside an async function on the main thread?", ["block", "event loop", "worker", "chunk", "main thread"]),
      q("When would you pick TypeScript's `unknown` over `any`, and why?", ["type safety", "narrowing", "type guard", "unknown", "any"]),
    ],
    easier: q("What's the difference between `let`, `const` and `var`?", ["scope", "block", "hoisting", "reassign"]),
  },
  {
    name: "React",
    triggers: ["react", "next.js", "nextjs", "frontend"],
    main: q("How does React decide when to re-render a component, and how would you find and fix unnecessary re-renders?", ["state", "props", "memo", "usememo", "usecallback", "profiler", "reconciliation"]),
    followUps: [
      q("Where would you keep server data versus UI state in a larger React app, and why?", ["server state", "cache", "context", "react query", "global", "local state"]),
      q("How do Server Components change how you fetch data compared to client-side fetching?", ["server", "bundle", "hydration", "streaming", "client component", "secret"]),
    ],
    easier: q("What is the difference between state and props in React?", ["state", "props", "parent", "immutable", "re-render"]),
  },
  {
    name: "Node.js & APIs",
    triggers: ["node", "node.js", "express", "backend", "api"],
    main: q("How would you design a REST API endpoint that creates an order so that it's safe to retry?", ["idempotency", "key", "status code", "validation", "transaction", "duplicate"]),
    followUps: [
      q("How would you handle authentication and rate limiting for that API?", ["jwt", "session", "token", "rate limit", "redis", "middleware"]),
      q("A downstream payment service is timing out. How should your endpoint behave?", ["timeout", "retry", "backoff", "circuit breaker", "queue", "idempotent"]),
    ],
    easier: q("What's the difference between PUT and PATCH, and when would you return a 201?", ["replace", "partial", "created", "status"]),
  },
  {
    name: "Python",
    triggers: ["python", "django", "flask", "fastapi"],
    main: q("How does Python handle concurrency, and when would you use asyncio versus multiprocessing?", ["gil", "io-bound", "cpu-bound", "asyncio", "multiprocessing", "threads"]),
    followUps: [
      q("How would you profile a slow Python service to find the bottleneck?", ["profile", "cprofile", "py-spy", "latency", "database", "measure"]),
      q("How do you structure and test a Python project so it stays maintainable?", ["modules", "pytest", "fixtures", "type hints", "dependency", "virtualenv"]),
    ],
    easier: q("What is the difference between a list and a tuple in Python?", ["mutable", "immutable", "hashable", "performance"]),
  },
  {
    name: "Databases",
    triggers: ["mongodb", "postgresql", "postgres", "mysql", "sql", "database", "redis"],
    main: q("How do you decide between a document database like MongoDB and a relational database like PostgreSQL for a new feature?", ["schema", "relations", "joins", "transactions", "consistency", "query patterns", "scale"]),
    followUps: [
      q("A query that used to take 20ms now takes 2 seconds. How do you investigate?", ["explain", "index", "query plan", "scan", "cardinality", "slow query log"]),
      q("When can adding an index actually hurt performance?", ["write", "insert", "memory", "storage", "selectivity", "maintenance"]),
    ],
    easier: q("What is a database index, and why does it make reads faster?", ["b-tree", "lookup", "scan", "sorted", "reads"]),
  },
  {
    name: "LLMs & RAG",
    triggers: ["rag", "llm", "llms", "ai", "gemini", "openai", "langchain", "prompt engineering", "embeddings", "vector"],
    main: q("Walk me through how you would build a RAG pipeline over a large document set.", ["chunking", "embeddings", "vector", "retrieval", "rerank", "metadata", "prompt"]),
    followUps: [
      q("How would you choose chunk size and overlap for your documents?", ["chunk size", "overlap", "context", "semantic", "evaluate", "tokens"]),
      q("What would you do if the retrieved chunks contained conflicting information?", ["source", "recency", "rerank", "citation", "metadata", "confidence"]),
      q("How would you evaluate retrieval quality before and after a change?", ["recall", "precision", "golden set", "mrr", "eval", "human"]),
    ],
    easier: q("What is an embedding, and why is it useful for search?", ["vector", "similarity", "semantic", "cosine", "meaning"]),
  },
  {
    name: "Cloud & Deployment",
    triggers: ["aws", "gcp", "azure", "docker", "kubernetes", "devops", "ci/cd", "cloud"],
    main: q("How would you deploy and scale a web service so it survives a sudden 10x traffic spike?", ["autoscaling", "load balancer", "stateless", "cache", "cdn", "container", "monitoring"]),
    followUps: [
      q("How would you roll out a risky change without downtime?", ["blue-green", "canary", "feature flag", "rollback", "health check"]),
      q("What would you monitor and alert on for that service?", ["latency", "error rate", "saturation", "logs", "metrics", "slo"]),
    ],
    easier: q("What problem does Docker solve for deployment?", ["container", "environment", "image", "consistent", "dependencies"]),
  },
  {
    name: "Testing",
    triggers: ["testing", "jest", "vitest", "pytest", "cypress", "playwright"],
    main: q("How do you decide what to cover with unit, integration and end-to-end tests?", ["unit", "integration", "e2e", "pyramid", "confidence", "mock", "cost"]),
    followUps: [
      q("How would you deal with a flaky test in CI?", ["root cause", "isolation", "timing", "determinism", "retry", "quarantine"]),
    ],
    easier: q("What is the difference between a unit test and an integration test?", ["isolated", "dependencies", "components", "together"]),
  },
];

const GENERAL_TOPICS: TechnicalTopicDef[] = [
  {
    name: "Debugging & Problem Solving",
    triggers: [],
    main: q("Production is down and users can't log in. Walk me through your first 15 minutes.", ["logs", "metrics", "rollback", "recent deploy", "reproduce", "communicate", "impact"]),
    followUps: [
      q("You find the root cause was a bad config change. What do you change so it doesn't happen again?", ["postmortem", "validation", "review", "automation", "alert", "blameless"]),
    ],
    easier: q("How do you usually approach a bug you can't reproduce locally?", ["logs", "environment", "reproduce", "data", "hypothesis"]),
  },
  {
    name: "API & System Basics",
    triggers: [],
    main: q("What happens, end to end, when a user submits a form in your web app and the data is saved?", ["request", "http", "server", "validation", "database", "response", "dns"]),
    followUps: [
      q("Where could caching help in that flow, and what could go wrong with it?", ["cache", "invalidation", "stale", "ttl", "cdn", "redis"]),
    ],
    easier: q("What is the difference between the frontend and the backend of a web application?", ["client", "server", "browser", "api", "database"]),
  },
];

const SYSTEM_DESIGN_PROBLEMS = [
  { match: ["ai", "ml", "llm", "rag"], problem: "a document Q&A service where users upload PDFs and ask questions over them" },
  { match: ["frontend", "full"], problem: "a real-time parking availability system for a city" },
  { match: [], problem: "a URL shortener that handles 100 million redirects a day" },
];

function systemDesignTopics(role: string): DemoTopic[] {
  const lower = role.toLowerCase();
  const problem =
    SYSTEM_DESIGN_PROBLEMS.find((p) => p.match.some((m) => lower.includes(m)))?.problem ??
    SYSTEM_DESIGN_PROBLEMS[SYSTEM_DESIGN_PROBLEMS.length - 1].problem;
  return [
    {
      name: "Requirements",
      reason: "Strong designs start from clear functional and non-functional requirements.",
      main: q(`Today I'd like you to design ${problem}. What clarifying questions would you ask, and what requirements would you settle on?`, ["users", "scale", "latency", "availability", "functional", "non-functional", "read", "write"]),
      followUps: [q("Roughly how much traffic and storage should we plan for? Walk me through the estimate.", ["per second", "qps", "storage", "estimate", "peak", "growth"])],
      easier: q("Who are the main users of this system and what are the two or three things they must be able to do?", ["users", "features", "core"]),
    },
    {
      name: "High-Level Design",
      reason: "Checks the ability to decompose a system into components.",
      main: q("Sketch the high-level architecture. What are the main components and how does a request flow through them?", ["client", "load balancer", "service", "database", "cache", "queue", "api"]),
      followUps: [q("Which parts of this design are stateful, and how does that affect scaling?", ["stateless", "state", "session", "horizontal", "replica"])],
      easier: q("What would the main API endpoints look like?", ["get", "post", "endpoint", "request", "response"]),
    },
    {
      name: "Data Model",
      reason: "Data modelling decisions drive most scaling trade-offs.",
      main: q("What does your data model look like, and which database would you choose for it?", ["schema", "table", "document", "index", "partition", "sql", "nosql"]),
      followUps: [q("How would you prevent two users from claiming the same resource at the same time?", ["lock", "transaction", "unique", "optimistic", "atomic", "idempotent"])],
      easier: q("What are the main entities you would store?", ["entity", "fields", "relationship"]),
    },
    {
      name: "Scaling",
      reason: "Real system-design rounds push on scale.",
      main: q("How would this design handle 100,000 concurrent users?", ["cache", "shard", "replica", "load balancer", "cdn", "autoscaling", "queue"]),
      followUps: [q("Where is the bottleneck now, and how do you know?", ["bottleneck", "database", "metrics", "load test", "latency"])],
      easier: q("What is the difference between vertical and horizontal scaling?", ["bigger machine", "more machines", "limit", "cost"]),
    },
    {
      name: "Failure Handling",
      reason: "Interviewers test how designs behave when things break.",
      main: q("What happens if your cache or primary database goes down?", ["failover", "replica", "fallback", "degrade", "retry", "circuit breaker", "backup"]),
      followUps: [q("How would you detect the failure before users report it?", ["monitoring", "alert", "health check", "slo", "metrics"])],
      easier: q("Why do we keep replicas of a database?", ["availability", "failover", "read", "backup"]),
    },
  ];
}

const BEHAVIORAL_TOPICS: DemoTopic[] = [
  {
    name: "Delivering Under Pressure",
    reason: "Common opener that reveals prioritisation.",
    main: q("Tell me about a time you had to deliver something under a tight deadline. What was the situation?", ["situation", "deadline", "prioritized", "i decided", "result", "learned"]),
    followUps: [q("What exactly did you do, personally, and what was the measurable outcome?", ["i ", "result", "%", "shipped", "impact", "outcome"])],
    easier: q("How do you usually prioritise when you have more work than time?", ["priority", "impact", "communicate", "scope"]),
  },
  {
    name: "Conflict",
    reason: "Tests collaboration and maturity.",
    main: q("Tell me about a disagreement with a teammate. How did you handle it?", ["situation", "listened", "perspective", "data", "agreed", "result"]),
    followUps: [q("Looking back, what would you do differently?", ["learned", "differently", "earlier", "communicate"])],
    easier: q("How do you usually handle disagreements about technical decisions?", ["discuss", "data", "trade-off", "listen"]),
  },
  {
    name: "Failure & Learning",
    reason: "Shows ownership and growth.",
    main: q("Tell me about a mistake you made at work or in a project. What happened next?", ["mistake", "owned", "fixed", "impact", "learned", "prevent"]),
    followUps: [q("What did you change in how you work because of it?", ["process", "habit", "checklist", "test", "review"])],
    easier: q("What is something you learned the hard way?", ["learned", "mistake", "now"]),
  },
  {
    name: "Ownership",
    reason: "Interviewers look for initiative beyond assigned tasks.",
    main: q("Describe a time you took ownership of something that wasn't strictly your responsibility.", ["noticed", "initiative", "i ", "stakeholders", "result", "impact"]),
    followUps: [q("How did you get others on board?", ["convinced", "data", "demo", "stakeholder", "feedback"])],
    easier: q("What does ownership mean to you in a team?", ["responsibility", "follow through", "accountable"]),
  },
];

const HR_TOPICS: DemoTopic[] = [
  {
    name: "Introduction",
    reason: "Every HR round opens here.",
    main: q("Let's start simple: tell me about yourself.", ["currently", "experience", "worked on", "skills", "looking for", "role"]),
    followUps: [q("What's the achievement you're proudest of so far?", ["built", "impact", "result", "proud", "team"])],
    easier: q("Tell me briefly about your current role or studies.", ["role", "work", "study"]),
  },
  {
    name: "Motivation",
    reason: "Checks genuine interest in the role.",
    main: q("Why are you interested in this role, and why now?", ["interested", "growth", "skills", "company", "impact", "learn"]),
    followUps: [q("What are you looking for in your next team that you don't have today?", ["mentorship", "ownership", "scale", "learning", "culture"])],
    easier: q("What kind of work do you enjoy the most?", ["enjoy", "building", "problems"]),
  },
  {
    name: "Strengths & Weaknesses",
    reason: "Tests self-awareness.",
    main: q("What would you say is your biggest weakness, and what are you doing about it?", ["weakness", "working on", "improve", "example", "progress"]),
    followUps: [q("And your greatest strength — can you give an example of it in action?", ["strength", "example", "result", "team"])],
    easier: q("What do your teammates usually come to you for?", ["help", "good at", "team"]),
  },
  {
    name: "Career Goals",
    reason: "Checks alignment and ambition.",
    main: q("Where do you see yourself in three to five years?", ["grow", "senior", "lead", "skills", "impact", "goal"]),
    followUps: [q("How does this role help you get there?", ["learn", "experience", "responsibility", "skills"])],
    easier: q("What's one skill you want to get much better at this year?", ["skill", "learn", "practice"]),
  },
  {
    name: "Expectations",
    reason: "Practical questions every candidate must handle.",
    main: q("What are your salary expectations, and how did you arrive at that number?", ["range", "market", "research", "experience", "flexible", "total compensation"]),
    followUps: [q("What's your notice period, and is it negotiable?", ["notice", "days", "negotiable", "buyout"])],
    easier: q("What matters most to you in an offer besides salary?", ["learning", "team", "growth", "flexibility"]),
  },
];

function projectTopics(ctx: InterviewContext): DemoTopic[] {
  const projects = ctx.resume?.projects ?? [];
  const topics: DemoTopic[] = projects.slice(0, 4).map((p) => {
    const tech = p.technologies[0] ?? "your main technology";
    const tech2 = p.technologies[1] ?? "your data store";
    return {
      name: p.name,
      reason: "Listed on your resume — interviewers will drill into it.",
      main: q(`Walk me through the architecture of ${p.name}. What are the main components and how do they talk to each other?`, ["architecture", "frontend", "backend", "database", "api", "flow", ...p.technologies.map((t) => t.toLowerCase())]),
      followUps: [
        q(`Why did you choose ${tech} for ${p.name} instead of the alternatives?`, ["because", "alternative", "trade-off", "instead", "requirement", "compared"]),
        q(`How did ${p.name} handle failures — for example, if ${tech2} became unavailable?`, ["retry", "fallback", "error", "timeout", "monitoring", "queue"]),
        q(`If ${p.name} suddenly had 100 times more users, what would break first?`, ["bottleneck", "database", "cache", "scale", "load", "index"]),
      ],
      easier: q(`What problem does ${p.name} solve, and who uses it?`, ["problem", "users", "solve", "feature"]),
    };
  });
  for (const c of ctx.resume?.claimsToVerify.slice(0, 2) ?? []) {
    topics.push({
      name: "Resume Claims",
      reason: "Vague or impressive claims get verified in real interviews.",
      main: q(`Your resume says: "${c.claim}". Walk me through exactly how you did that.`, ["i ", "measured", "before", "after", "approach", "result"]),
      followUps: c.followUpQuestions.slice(0, 2).map((f) => q(f, ["because", "measured", "specifically", "result"])),
      easier: q("What was your personal contribution there, compared to the rest of the team?", ["i ", "my part", "team"]),
    });
    break;
  }
  if (topics.length === 0) {
    topics.push({
      name: "Recent Project",
      reason: "No resume uploaded — using your most recent project.",
      main: q("Pick the project you're proudest of and walk me through its architecture.", ["architecture", "frontend", "backend", "database", "api", "users"]),
      followUps: [
        q("Why did you choose that stack instead of the alternatives?", ["because", "alternative", "trade-off", "instead"]),
        q("What happens in that system if the same event or request is processed twice?", ["idempotent", "duplicate", "unique", "key", "retry"]),
        q("What would you change if you rebuilt it today?", ["change", "learned", "differently", "refactor", "test"]),
      ],
      easier: q("What problem does that project solve?", ["problem", "users", "solve"]),
    });
  }
  return topics;
}

function toDemoTopic(def: TechnicalTopicDef, reason: string): DemoTopic {
  return { name: def.name, reason, main: def.main, followUps: def.followUps, easier: def.easier };
}

function technicalTopics(ctx: InterviewContext): DemoTopic[] {
  const signals = [
    ...ctx.candidate.skills,
    ...(ctx.resume?.skills.map((s) => s.name) ?? []),
    ctx.config.role,
    ctx.config.jobDescription ?? "",
    ctx.config.focus ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const scored = TECHNICAL_TOPICS.map((t) => ({
    t,
    hits: t.triggers.filter((trigger) => mentions(signals, trigger)).length,
  }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map(({ t }) => t);

  const walkthrough: DemoTopic = {
    name: "Project Walkthrough",
    reason: "A natural warm-up that reveals depth quickly.",
    main: q(
      ctx.resume?.projects[0]
        ? `Let's begin. Can you walk me through ${ctx.resume.projects[0].name} and the key technical decisions you made?`
        : "Let's begin. Can you walk me through a recent system you've worked on and the key technical decisions you made?",
      ["architecture", "because", "decided", "database", "api", "users", "challenge"],
    ),
    followUps: [q("What was the hardest technical problem in that project, and how did you solve it?", ["problem", "debug", "approach", "solution", "trade-off", "result"])],
    easier: q("What was your role in that project?", ["built", "responsible", "i "]),
  };

  const chosen = [...scored, ...GENERAL_TOPICS]
    .slice(0, 5)
    .map((t) => toDemoTopic(t, `Relevant to your skills and the ${ctx.config.role} role.`));
  return [walkthrough, ...chosen];
}

function codingTopics(ctx: InterviewContext): DemoTopic[] {
  const p = getProblem(ctx.config.problemId);
  if (!p) return technicalTopics(ctx);
  return [
    {
      name: "Approach",
      reason: "Interviewers want to hear your plan before you code.",
      main: q(`Let's start the coding round with ${p.title} — the full problem is in the panel. Before writing any code, talk me through your approach.`, [...p.keywords, "brute force", "because"]),
      followUps: [q("What would a brute-force solution look like, and why is yours better?", ["brute force", "o(n", "nested", "better"])],
      easier: q("Let's start simple: how would you solve it with a brute-force approach?", ["loop", "check", "brute"]),
    },
    {
      name: "Implementation",
      reason: "Working code under time pressure.",
      main: q("Go ahead and implement it in the editor. Run the tests, then walk me through your code when you're ready.", ["tests", "pass", ...p.keywords]),
      followUps: [q("Some of the hidden tests may be tricky. What inputs would break a naive solution?", ["empty", "duplicate", "negative", "edge"])],
      easier: q("Which data structure are you using, and why?", ["map", "set", "array", "stack", "because"]),
    },
    {
      name: "Complexity",
      reason: "Complexity analysis is expected in every coding round.",
      main: q(p.followUps[0] ?? "What's the time and space complexity of your solution?", [p.optimal.time.toLowerCase(), "time", "space", "o("]),
      followUps: [],
      easier: q("How does the running time grow if the input doubles?", ["linear", "double", "grow"]),
    },
    {
      name: "Edge Cases",
      reason: "Correctness on edge cases separates good from great.",
      main: q("What edge cases did you consider, and which tests would you add?", ["empty", "single", "duplicate", "negative", "large", "null"]),
      followUps: [],
      easier: q("What happens with an empty input?", ["empty", "return"]),
    },
    {
      name: "Extension",
      reason: "Follow-ups test depth beyond the first solution.",
      main: q(p.followUps[1] ?? "How would you adapt this if the input were too large to fit in memory?", ["stream", "memory", "chunk", "trade-off"]),
      followUps: [],
      easier: q("What would you change if this ran a million times a second?", ["cache", "optimize", "precompute"]),
    },
  ];
}

function drillTopics(ctx: InterviewContext): DemoTopic[] {
  const focus = (ctx.config.focus ?? "your weak area").trim();
  const match = [...TECHNICAL_TOPICS, ...GENERAL_TOPICS].find(
    (t) => t.name.toLowerCase() === focus.toLowerCase() || t.triggers.some((tr) => mentions(focus, tr)),
  );
  if (match) {
    return [
      { name: `${match.name}: fundamentals`, reason: "Warm up on the basics.", main: match.easier, followUps: [], easier: match.easier },
      { name: `${match.name}: applied`, reason: "Apply it to a realistic scenario.", main: match.main, followUps: match.followUps.slice(0, 1), easier: match.easier },
      ...match.followUps.map((f, i) => ({ name: `${match.name}: advanced ${i + 1}`, reason: "Push to interview depth.", main: f, followUps: [], easier: match.easier })),
    ];
  }
  const generic = (name: string, text: string, keywords: string[]): DemoTopic => ({
    name: `${focus}: ${name}`,
    reason: "Focused practice drill.",
    main: q(text, keywords),
    followUps: [],
    easier: q(`In one or two sentences, what is ${focus}?`, ["is", "used"]),
  });
  return [
    generic("fundamentals", `Let's drill ${focus}. Explain it in your own words, with an example from a project.`, ["example", "because", "used"]),
    generic("pitfalls", `What are the most common mistakes or pitfalls with ${focus}, and how do you avoid them?`, ["mistake", "avoid", "because", "example"]),
    generic("trade-offs", `Compare ${focus} with an alternative. When would you choose each?`, ["trade-off", "instead", "when", "because"]),
    generic("at scale", `How would ${focus} change in a system with a million users?`, ["scale", "cache", "latency", "bottleneck"]),
  ];
}

export function buildDemoTopics(ctx: InterviewContext): DemoTopic[] {
  if (ctx.config.drill) return drillTopics(ctx);
  const pack = getPack(ctx.config.packId);
  if (pack?.themes && ctx.config.type === "behavioral") {
    return pack.themes.map((t) => ({
      name: t.name,
      reason: `${pack.label} interviews probe this directly.`,
      main: q(t.question, t.keywords),
      followUps: [q("What exactly did you do, personally, and what was the measurable outcome?", ["i ", "result", "%", "impact"])],
      easier: q("Take a moment — any example from college, internships or projects works.", ["project", "team", "i "]),
    }));
  }
  let topics: DemoTopic[];
  switch (ctx.config.type) {
    case "coding":
      topics = codingTopics(ctx);
      break;
    case "system_design":
      topics = systemDesignTopics(ctx.config.role);
      break;
    case "project_deep_dive":
      topics = projectTopics(ctx);
      break;
    case "behavioral":
      topics = BEHAVIORAL_TOPICS;
      break;
    case "hr":
      topics = HR_TOPICS;
      break;
    default:
      topics = technicalTopics(ctx);
  }

  // Intervexa remembers: bring recurring weak topics (and an explicit focus) forward.
  const priorities = [ctx.config.focus, ...(ctx.memory?.recurringWeakTopics.map((t) => t.topic) ?? [])]
    .filter((s): s is string => Boolean(s))
    .map((s) => s.toLowerCase());
  if (priorities.length && ctx.config.type === "technical") {
    const pool = [...TECHNICAL_TOPICS, ...GENERAL_TOPICS];
    for (const p of priorities.reverse()) {
      const match = pool.find((t) => t.name.toLowerCase() === p || t.triggers.some((tr) => mentions(p, tr)));
      if (!match) continue;
      topics = topics.filter((t) => t.name !== match.name);
      topics.splice(1, 0, toDemoTopic(match, "You asked to practise this, or it came up as a weak area before."));
    }
  }
  return topics;
}
