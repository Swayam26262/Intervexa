import type { AnswerMode, Difficulty, InterviewType, Personality } from "./config";

export type Signal = "strong" | "adequate" | "weak" | "gap" | "clarification";
export type TurnAction = "opening" | "follow_up" | "probe" | "easier" | "next_topic" | "clarify" | "wrap_up";

export interface InterviewConfig {
  role: string;
  experienceYears: number;
  type: InterviewType;
  difficulty: Difficulty;
  durationMinutes: number;
  personality: Personality;
  answerMode: AnswerMode;
  useResume: boolean;
  jobDescription?: string;
  focus?: string;
}

export interface PlanTopic {
  name: string;
  reason: string;
}

export interface InterviewPlan {
  focusSummary: string;
  topics: PlanTopic[];
  memoryNote?: string;
}

export interface AnswerEvaluation {
  score: number; // 0-10 (ignored when signal === "clarification")
  signal: Signal;
  strengths: string[];
  missing: string[];
  note: string;
}

export interface Turn {
  index: number;
  topic: string;
  action: TurnAction;
  question: string;
  askedAt: Date;
  answer?: string;
  answeredAt?: Date;
  answerDurationSec?: number;
  inputMode?: AnswerMode;
  evaluation?: AnswerEvaluation;
}

export interface SkillScore {
  name: string;
  score: number;
  reason?: string;
}

export interface ResumeAnalysis {
  headline: string;
  summary: string;
  totalExperienceYears: number | null;
  skills: { name: string; category: string; proficiency: number; evidence: string }[];
  strongAreas: SkillScore[];
  weakAreas: SkillScore[];
  projects: { name: string; summary: string; technologies: string[]; claims: string[] }[];
  experience: { company: string; role: string; duration: string; highlights: string[] }[];
  claimsToVerify: { claim: string; followUpQuestions: string[] }[];
}

export interface CandidateMemory {
  interviewsConsidered: number;
  recurringWeakTopics: { topic: string; count: number }[];
  lastScore?: number;
}

export interface CandidateContext {
  name: string;
  currentRole?: string;
  targetRole?: string;
  experienceYears?: number;
  education?: string;
  skills: string[];
}

export interface InterviewContext {
  candidate: CandidateContext;
  config: InterviewConfig;
  resume?: ResumeAnalysis;
  memory?: CandidateMemory;
}

export interface PlanResult {
  plan: InterviewPlan;
  greeting: string;
  openingQuestion: string;
  openingTopic: string;
}

export interface TurnResult {
  evaluation: AnswerEvaluation;
  action: TurnAction;
  topic: string;
  message: string;
}

export const CATEGORY_KEYS = [
  "technicalKnowledge",
  "problemSolving",
  "communication",
  "projectUnderstanding",
  "confidence",
  "clarity",
] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  technicalKnowledge: "Technical Knowledge",
  problemSolving: "Problem Solving",
  communication: "Communication",
  projectUnderstanding: "Project Understanding",
  confidence: "Confidence",
  clarity: "Clarity",
};

export interface CommunicationStats {
  answers: number;
  totalWords: number;
  avgWordsPerAnswer: number;
  shortAnswers: number;
  fillerWords: Record<string, number>;
  fillerPer100Words: number;
  wordsPerMinute: number | null;
}

export interface QuestionFeedback {
  turnIndex: number;
  score: number;
  didWell: string[];
  missing: string[];
  betterAnswer: string;
}

export interface InterviewReport {
  overallScore: number;
  categoryScores: Record<CategoryKey, number | null>;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  weakTopics: string[];
  missedTopics: string[];
  suggestedTopics: string[];
  questions: QuestionFeedback[];
  communication: CommunicationStats;
  generatedAt: Date;
}

export type ReportDraft = Omit<InterviewReport, "communication" | "generatedAt">;
