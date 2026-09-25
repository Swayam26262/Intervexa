import type { InterviewType, Personality } from "./config";

export interface PackRound {
  title: string;
  type: InterviewType;
  focus: string;
  durationMinutes: number;
}

export interface InterviewPack {
  id: string;
  name: string;
  /** Short label shown on chips, e.g. "Amazon-style". */
  label: string;
  blurb: string;
  personality: Personality;
  /** Appended to the interviewer's instructions for every round in this pack. */
  guidance: string;
  rounds: PackRound[];
  /** Behavioral themes the offline interviewer uses for this pack. */
  themes?: { name: string; question: string; keywords: string[] }[];
}

export const PACK_DISCLAIMER =
  "Packs are modelled on publicly shared interview formats for practice. Intervexa isn't affiliated with or endorsed by these companies.";

export const PACKS: InterviewPack[] = [
  {
    id: "google",
    name: "Google-style software engineering",
    label: "Google-style",
    blurb: "Algorithmic problem solving, clean code, complexity — plus a collaboration round.",
    personality: "faang",
    guidance:
      "Emulate a Google-style loop: expect the candidate to clarify requirements, reason out loud, write clean correct code, test it with examples, and analyse complexity. Behavioral questions explore collaboration, handling ambiguity, learning and helping others (\"Googleyness\") and leadership without authority.",
    rounds: [
      { title: "Coding 1", type: "coding", focus: "Arrays, hashing and clear communication", durationMinutes: 30 },
      { title: "Coding 2", type: "coding", focus: "Sliding window / two pointers", durationMinutes: 30 },
      { title: "System design", type: "system_design", focus: "Scalable service design", durationMinutes: 30 },
      { title: "Googleyness & leadership", type: "behavioral", focus: "Collaboration, ambiguity, leadership", durationMinutes: 15 },
    ],
    themes: [
      { name: "Ambiguity", question: "Tell me about a time you had to make progress on a project where the requirements were unclear.", keywords: ["clarified", "assumptions", "stakeholders", "iterated", "result"] },
      { name: "Collaboration", question: "Describe a time you helped a teammate succeed, even though it wasn't your task.", keywords: ["helped", "team", "impact", "learned"] },
      { name: "Leading without authority", question: "Tell me about a time you influenced a technical decision without being the decision-maker.", keywords: ["data", "proposal", "convinced", "trade-off", "outcome"] },
    ],
  },
  {
    id: "amazon",
    name: "Amazon-style (Leadership Principles)",
    label: "Amazon-style",
    blurb: "Every round probes Leadership Principles with STAR stories and hard follow-ups.",
    personality: "faang",
    guidance:
      "Emulate an Amazon-style loop. Anchor behavioral questions in Leadership Principles (Customer Obsession, Ownership, Dive Deep, Bias for Action, Deliver Results, Have Backbone; Disagree and Commit, Earn Trust, Invent and Simplify, Insist on the Highest Standards). Demand STAR structure, the candidate's own actions, and specific metrics; follow up with 'what data did you use?' and 'what would you do differently?'. Technical rounds should also connect decisions to customer impact.",
    rounds: [
      { title: "Coding", type: "coding", focus: "Data structures with customer-impact discussion", durationMinutes: 30 },
      { title: "System design", type: "system_design", focus: "Scalable, cost-aware design", durationMinutes: 30 },
      { title: "Leadership Principles", type: "behavioral", focus: "Customer Obsession, Ownership, Dive Deep", durationMinutes: 15 },
      { title: "Bar raiser", type: "behavioral", focus: "Have Backbone, Deliver Results, Earn Trust", durationMinutes: 15 },
    ],
    themes: [
      { name: "Customer Obsession", question: "Tell me about a time you went above and beyond for a customer or user.", keywords: ["customer", "feedback", "impact", "metric", "result"] },
      { name: "Ownership", question: "Tell me about a time you took ownership of a problem outside your area.", keywords: ["owned", "noticed", "fixed", "long-term", "result"] },
      { name: "Dive Deep", question: "Describe a time you had to dig into data or logs to find the real root cause of a problem.", keywords: ["data", "logs", "root cause", "metric", "discovered"] },
      { name: "Have Backbone", question: "Tell me about a time you disagreed with your manager or team. What did you do?", keywords: ["disagreed", "data", "committed", "outcome", "respect"] },
      { name: "Deliver Results", question: "Tell me about a time you delivered an important result despite significant obstacles.", keywords: ["deadline", "obstacle", "prioritized", "delivered", "%"] },
    ],
  },
  {
    id: "microsoft",
    name: "Microsoft-style",
    label: "Microsoft-style",
    blurb: "Coding and design with an emphasis on growth mindset and collaboration.",
    personality: "professional",
    guidance:
      "Emulate a Microsoft-style loop: practical coding with attention to edge cases and testing, design discussions grounded in real products, and behavioral questions about growth mindset, learning from failure, customer empathy and collaboration across teams.",
    rounds: [
      { title: "Coding", type: "coding", focus: "Edge cases and testing", durationMinutes: 30 },
      { title: "Design", type: "system_design", focus: "Product-grounded system design", durationMinutes: 30 },
      { title: "Growth mindset", type: "behavioral", focus: "Learning from failure, collaboration", durationMinutes: 15 },
    ],
  },
  {
    id: "meta",
    name: "Meta-style",
    label: "Meta-style",
    blurb: "Fast-paced coding, product architecture and impact-focused behavioral.",
    personality: "faang",
    guidance:
      "Emulate a Meta-style loop: coding rounds reward speed and correctness with clear communication; design rounds focus on product architecture and scale; behavioral rounds focus on impact, conflict resolution, growth and moving fast.",
    rounds: [
      { title: "Coding", type: "coding", focus: "Two medium problems, speed and correctness", durationMinutes: 30 },
      { title: "Product architecture", type: "system_design", focus: "Feed / messaging style product at scale", durationMinutes: 30 },
      { title: "Behavioral", type: "behavioral", focus: "Impact, conflict, growth", durationMinutes: 15 },
    ],
  },
  {
    id: "flipkart",
    name: "Indian product company (Flipkart-style)",
    label: "Flipkart-style",
    blurb: "DSA, low-level design / machine coding, system design and a hiring-manager round.",
    personality: "professional",
    guidance:
      "Emulate an Indian product-company loop (Flipkart/Swiggy/PhonePe style): data structures and algorithms, low-level design (classes, interfaces, extensibility, design patterns), high-level design for Indian scale (sale-day traffic spikes, UPI payments, poor networks), and a hiring-manager round on ownership and past projects.",
    rounds: [
      { title: "DSA", type: "coding", focus: "Data structures and algorithms", durationMinutes: 30 },
      { title: "Low-level design", type: "technical", focus: "Object-oriented and low-level design", durationMinutes: 30 },
      { title: "High-level design", type: "system_design", focus: "Sale-day scale e-commerce", durationMinutes: 30 },
      { title: "Hiring manager", type: "project_deep_dive", focus: "Ownership and past projects", durationMinutes: 15 },
    ],
  },
  {
    id: "startup",
    name: "Product startup (Seed–Series B)",
    label: "Startup",
    blurb: "Practical, ownership-heavy rounds: ship, debug production, make pragmatic calls.",
    personality: "startup",
    guidance:
      "Emulate an early-stage startup loop: practical engineering over trivia, end-to-end ownership, debugging production incidents, pragmatic tool and cost choices, shipping under time pressure, and culture fit (bias for action, comfort with ambiguity, wearing many hats).",
    rounds: [
      { title: "Practical technical", type: "technical", focus: "Real-world engineering and debugging", durationMinutes: 30 },
      { title: "Project deep dive", type: "project_deep_dive", focus: "What you built and why", durationMinutes: 30 },
      { title: "Pragmatic design", type: "system_design", focus: "MVP architecture that can grow", durationMinutes: 30 },
      { title: "Founder chat", type: "behavioral", focus: "Ownership, ambiguity, motivation", durationMinutes: 15 },
    ],
  },
  {
    id: "services",
    name: "IT services campus hiring (TCS/Infosys-style)",
    label: "IT services",
    blurb: "CS fundamentals (OOP, DBMS, OS, networks), a coding basics round and HR.",
    personality: "friendly",
    guidance:
      "Emulate a campus-hiring loop at a large IT services company: core CS fundamentals (OOP concepts, DBMS and SQL, operating systems, computer networks), basic programming, the candidate's final-year project, and an HR round on relocation, shifts, bond and motivation. Keep difficulty appropriate for freshers.",
    rounds: [
      { title: "Technical fundamentals", type: "technical", focus: "OOP, DBMS, OS, networks", durationMinutes: 15 },
      { title: "Coding basics", type: "coding", focus: "Easy problems and clean code", durationMinutes: 15 },
      { title: "HR", type: "hr", focus: "Relocation, shifts, motivation", durationMinutes: 15 },
    ],
  },
];

export function getPack(id: string | undefined): InterviewPack | undefined {
  return PACKS.find((p) => p.id === id);
}
