export const INTERVIEW_TYPES = [
  "technical",
  "system_design",
  "project_deep_dive",
  "behavioral",
  "hr",
] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const PERSONALITIES = ["friendly", "professional", "strict"] as const;
export type Personality = (typeof PERSONALITIES)[number];

export const DURATIONS = [15, 30, 45] as const;
export type Duration = (typeof DURATIONS)[number];

export const ANSWER_MODES = ["text", "voice"] as const;
export type AnswerMode = (typeof ANSWER_MODES)[number];

export const TYPE_META: Record<
  InterviewType,
  { label: string; emoji: string; blurb: string; guidance: string }
> = {
  technical: {
    label: "Technical",
    emoji: "🎤",
    blurb: "Fundamentals, frameworks, databases, APIs and trade-offs in your stack.",
    guidance:
      "Assess technical depth across the candidate's stack: language fundamentals, frameworks, databases, APIs, architecture, debugging and trade-offs. Prefer 'why' and 'what happens if' questions over definitions.",
  },
  system_design: {
    label: "System Design",
    emoji: "🧠",
    blurb: "Design a real system, then defend it under scale and failure.",
    guidance:
      "Pose ONE realistic design problem suited to the role and drive it like a real system-design round: clarify requirements, high-level design, data model, APIs, scaling, caching, consistency, failure modes and trade-offs. Probe with concrete scale numbers and failure scenarios (e.g. 'what happens if Redis goes down?').",
  },
  project_deep_dive: {
    label: "Project Deep Dive",
    emoji: "🔍",
    blurb: "Drills into the projects on your resume like a real interviewer.",
    guidance:
      "Pick the candidate's projects and resume claims and drill into them: architecture, why each technology was chosen over alternatives, failure handling, scaling, data consistency, testing and what they would change. Verify vague or impressive-sounding resume claims with specifics.",
  },
  behavioral: {
    label: "Behavioral",
    emoji: "🤝",
    blurb: "STAR-style questions about real situations you've handled.",
    guidance:
      "Run a behavioral round using STAR (Situation, Task, Action, Result). Ask for specific past situations. If the candidate speaks in generalities, ask for a concrete example. Probe for their own actions (not the team's) and measurable results.",
  },
  hr: {
    label: "HR",
    emoji: "👔",
    blurb: "Tell me about yourself, motivation, expectations and fit.",
    guidance:
      "Run a classic HR round: background walkthrough, motivation for the role, reasons for change, strengths and weaknesses, career goals, expectations and culture fit. Evaluate clarity, honesty, structure and professionalism rather than technical depth.",
  },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; guidance: string }> = {
  easy: {
    label: "Easy",
    guidance: "Focus on fundamentals and practical usage. Be patient and give the candidate room.",
  },
  medium: {
    label: "Medium",
    guidance:
      "Mix fundamentals with applied, scenario-based questions. Expect justification of choices.",
  },
  hard: {
    label: "Hard",
    guidance:
      "Push on depth, edge cases, scale and trade-offs. Expect precise, well-justified answers and challenge hand-waving.",
  },
};

export const PERSONALITY_META: Record<Personality, { label: string; blurb: string; guidance: string }> = {
  friendly: {
    label: "Friendly",
    blurb: "Warm and encouraging. “Take your time.”",
    guidance:
      "Warm and encouraging. Use phrases like 'Take your time' or 'Let's explore that a little more'. Still hold a real bar — never accept vague answers without a follow-up.",
  },
  professional: {
    label: "Professional",
    blurb: "Neutral and efficient. “Okay. Let's move on.”",
    guidance:
      "Neutral, concise and efficient, like a typical industry interviewer. Short acknowledgements such as 'Okay.' or 'Got it.' before the next question.",
  },
  strict: {
    label: "Strict",
    blurb: "Direct and demanding. Calls out gaps immediately.",
    guidance:
      "Direct and demanding. If an answer misses the point, say so briefly (e.g. 'That doesn't address the scalability concern.') and push again. No small talk.",
  },
};

/** Roughly one question every ~2.5 minutes, with a small buffer. */
export function maxQuestionsFor(durationMinutes: number): number {
  return Math.max(4, Math.round(durationMinutes / 2.5) + 1);
}

export function isInterviewType(value: unknown): value is InterviewType {
  return typeof value === "string" && (INTERVIEW_TYPES as readonly string[]).includes(value);
}
