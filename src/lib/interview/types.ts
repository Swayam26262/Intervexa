import type { AnswerMode, Difficulty, InterviewType, Language, Personality } from "./config";

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
  language?: Language;
  /** Company-style interview pack id. */
  packId?: string;
  /** Short practice drill on `focus` (10 minutes, fundamentals → harder). */
  drill?: boolean;
  /** Coding round: problem id from the bank and the language the candidate writes in. */
  problemId?: string;
  codeLanguage?: CodeLanguage;
  /** Mock loop membership. */
  loopId?: string;
  roundIndex?: number;
}

export type CodeLanguage = "javascript" | "python";

export interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual?: string;
  error?: string;
}

export interface CodeSubmission {
  language: CodeLanguage;
  source: string;
  tests?: { passed: number; total: number; results: TestResult[] };
}

export interface SpeechMetrics {
  pauses: number;
  longestPauseSec: number;
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
  code?: CodeSubmission;
  /** Text summary of the candidate's whiteboard diagram at answer time. */
  diagram?: { summary: string };
  speech?: SpeechMetrics;
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

export interface JdSkill {
  name: string;
  importance: "must" | "nice";
  match: "strong" | "partial" | "missing";
  evidence: string;
}

export interface JdAnalysis {
  title: string;
  company: string | null;
  seniority: string | null;
  summary: string;
  requiredSkills: JdSkill[];
  focusAreas: string[];
  /** 0-100 practice readiness estimate from skill coverage (not a hiring prediction). */
  readiness: number;
}

export interface InterviewContext {
  candidate: CandidateContext;
  config: InterviewConfig;
  resume?: ResumeAnalysis;
  memory?: CandidateMemory;
  jd?: JdAnalysis;
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

export interface StarCoverage {
  situation: number;
  task: number;
  action: number;
  result: number;
  answers: number;
}

export interface CommunicationStats {
  answers: number;
  totalWords: number;
  avgWordsPerAnswer: number;
  shortAnswers: number;
  fillerWords: Record<string, number>;
  fillerPer100Words: number;
  wordsPerMinute: number | null;
  /** v2 metrics (optional for reports generated before they existed). */
  paceByAnswer?: { turnIndex: number; wpm: number }[];
  pauses?: number;
  longestPauseSec?: number | null;
  repeatedPhrases?: { phrase: string; count: number }[];
  /** Share (0-1) of behavioral answers covering each STAR component. */
  star?: StarCoverage | null;
  /** Share (0-1) of long answers that use signposting ("first… then… finally"). */
  signposting?: number;
}

export interface QuestionFeedback {
  turnIndex: number;
  score: number;
  didWell: string[];
  missing: string[];
  betterAnswer: string;
}

export interface ClaimCheck {
  claim: string;
  status: "verified" | "partial" | "unverified" | "not_discussed";
  note: string;
}

export interface CodeReview {
  correctness: number;
  complexity: number;
  edgeCases: number;
  codeQuality: number;
  explanation: number;
  timeComplexity: string;
  spaceComplexity: string;
  notes: string[];
}

export interface TopicImprovement {
  topic: string;
  before: number;
  after: number;
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
  /** Project deep dive: how each resume claim held up under questioning. */
  claims?: ClaimCheck[];
  /** Coding rounds: structured code review (scores 0-10). */
  coding?: CodeReview;
  /** Weak topics from earlier interviews re-tested in this one. */
  improvement?: TopicImprovement[];
  /** Per-topic average score (0-10) for analytics. */
  topicScores?: { topic: string; score: number; count: number }[];
}

export type ReportDraft = Omit<
  InterviewReport,
  "communication" | "generatedAt" | "improvement" | "topicScores"
>;
