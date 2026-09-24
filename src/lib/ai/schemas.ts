import { z } from "zod";

const shortList = (description: string) => z.array(z.string()).describe(description);

export const planSchema = z.object({
  focusSummary: z.string().describe("One sentence describing what this interview will focus on and why."),
  topics: z
    .array(
      z.object({
        name: z.string().describe("Short topic name, 1-4 words."),
        reason: z.string().describe("Why this topic was chosen for this candidate."),
      }),
    )
    .describe("4-8 topics in priority order."),
  greeting: z
    .string()
    .describe("A short greeting by first name that sets up the interview (1-2 sentences). No question here."),
  openingTopic: z.string().describe("The topic of the opening question."),
  openingQuestion: z.string().describe("The first interview question."),
});

export const evaluationSchema = z.object({
  score: z.number().describe("0-10 score for the latest answer relative to difficulty and experience."),
  signal: z
    .enum(["strong", "adequate", "weak", "gap", "clarification"])
    .describe(
      "strong: solid, well-justified. adequate: correct but shallow. weak: vague or unjustified. gap: clear knowledge gap / doesn't know. clarification: the candidate asked to repeat or clarify the question instead of answering.",
    ),
  strengths: shortList("What the answer did well (short phrases). Empty if none."),
  missing: shortList("Important points the answer missed (short phrases)."),
  note: z.string().describe("One sentence private note on the answer quality."),
});

export const turnSchema = z.object({
  evaluation: evaluationSchema,
  action: z
    .enum(["follow_up", "probe", "easier", "next_topic", "clarify"])
    .describe("What the interviewer does next, following the adaptive rules."),
  topic: z.string().describe("Topic of the next question."),
  message: z
    .string()
    .describe(
      "Exactly what the interviewer says next: an optional brief acknowledgement (no scores, no answers revealed) followed by ONE question.",
    ),
});

export const wrapUpSchema = z.object({
  evaluation: evaluationSchema,
  message: z
    .string()
    .describe("Brief, professional closing remarks. Thank the candidate. Do not ask another question."),
});

const categoryScore = z.number().nullable();

export const reportSchema = z.object({
  overallScore: z.number().describe("0-100 overall interview score."),
  categoryScores: z.object({
    technicalKnowledge: categoryScore.describe("0-100, or null if not assessed in this round."),
    problemSolving: categoryScore.describe("0-100, or null if not assessed."),
    communication: categoryScore.describe("0-100."),
    projectUnderstanding: categoryScore.describe("0-100, or null if not assessed."),
    confidence: categoryScore.describe("0-100."),
    clarity: categoryScore.describe("0-100."),
  }),
  summary: z.string().describe("2-3 sentence coaching summary of the performance."),
  strengths: shortList("3-5 specific strengths observed."),
  weaknesses: shortList("3-5 specific weaknesses observed, phrased constructively."),
  weakTopics: shortList(
    "1-4 canonical short topic tags (1-3 words, Title Case, e.g. 'Database Scaling') for the weakest areas. Reuse the candidate's previous weak-topic tags when the same area is weak again.",
  ),
  missedTopics: shortList("Concepts the candidate should have mentioned but didn't."),
  suggestedTopics: shortList("3-5 topics to practise next."),
  questions: z
    .array(
      z.object({
        turnIndex: z.number().describe("The index of the question being reviewed."),
        score: z.number().describe("0-10."),
        didWell: shortList("What the answer did well."),
        missing: shortList("What was missing."),
        betterAnswer: z.string().describe("A concise outline of a stronger answer (3-6 sentences)."),
      }),
    )
    .describe("One entry per answered question."),
});

export const resumeAnalysisSchema = z.object({
  headline: z.string().describe("Short professional headline, e.g. 'Full-Stack Engineer · 1 yr'."),
  summary: z.string().describe("2-3 sentence summary of the candidate."),
  totalExperienceYears: z.number().nullable().describe("Total professional experience in years, null if unclear."),
  skills: z
    .array(
      z.object({
        name: z.string(),
        category: z.enum(["language", "frontend", "backend", "ai_ml", "database", "cloud_devops", "testing", "other"]),
        proficiency: z.number().describe("0-100 estimated from resume evidence."),
        evidence: z.string().describe("Where in the resume this shows up."),
      }),
    )
    .describe("Up to 25 skills."),
  strongAreas: z.array(z.object({ name: z.string(), score: z.number().describe("0-100") })).describe("Top 3-6 areas."),
  weakAreas: z
    .array(z.object({ name: z.string(), score: z.number().describe("0-100"), reason: z.string() }))
    .describe("3-6 potential weak areas relative to the target role."),
  projects: z.array(
    z.object({
      name: z.string(),
      summary: z.string(),
      technologies: z.array(z.string()),
      claims: z.array(z.string()).describe("Notable claims made about this project."),
    }),
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      duration: z.string(),
      highlights: z.array(z.string()),
    }),
  ),
  claimsToVerify: z
    .array(
      z.object({
        claim: z.string().describe("A resume claim that an interviewer would probe."),
        followUpQuestions: z.array(z.string()).describe("2-3 probing questions."),
      }),
    )
    .describe("3-6 claims, prioritising vague or impressive-sounding ones."),
});
