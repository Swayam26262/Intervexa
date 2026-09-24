import { countFillers, countWords } from "@/lib/analysis/communication";
import type { AnswerEvaluation, Signal } from "@/lib/interview/types";

const DONT_KNOW = /\b(i\s+(?:do\s*n[o']?t|dont)\s+know|no idea|not sure|never (?:used|worked with)|haven'?t (?:used|worked))\b/i;
const CLARIFY = /\b(repeat|rephrase|clarify|what do you mean|didn'?t (?:get|understand)|could you explain the question)\b/i;
const SPECIFICITY = [
  /\d/,
  /\bbecause\b/i,
  /\bfor example\b|\be\.g\.|\bfor instance\b/i,
  /\btrade-?offs?\b/i,
  /\binstead of\b|\brather than\b/i,
  /\bmeasured\b|\bmetric|\blatency\b|\bthroughput\b/i,
];

export function keywordHits(answer: string, keywords: string[]): { hit: string[]; missed: string[] } {
  const lower = ` ${answer.toLowerCase()} `;
  const hit: string[] = [];
  const missed: string[] = [];
  for (const k of keywords) {
    (lower.includes(k.toLowerCase()) ? hit : missed).push(k);
  }
  return { hit, missed };
}

export function signalFor(score: number): Signal {
  if (score >= 7.5) return "strong";
  if (score >= 5) return "adequate";
  if (score >= 3) return "weak";
  return "gap";
}

/** Deterministic, offline answer evaluation used by the demo engine. */
export function heuristicEvaluate(answer: string, keywords: string[]): AnswerEvaluation {
  const words = countWords(answer);

  if (words <= 15 && CLARIFY.test(answer)) {
    return { score: 0, signal: "clarification", strengths: [], missing: [], note: "Asked for clarification." };
  }
  if (words < 30 && DONT_KNOW.test(answer)) {
    return {
      score: 1.5,
      signal: "gap",
      strengths: ["Honest about what they don't know"],
      missing: keywords.slice(0, 4),
      note: "Candidate indicated they don't know this area.",
    };
  }

  const { hit, missed } = keywordHits(answer, keywords);
  const coverage = keywords.length ? hit.length / Math.min(keywords.length, 4) : 0.5;
  const specificity = SPECIFICITY.filter((re) => re.test(answer)).length / 3;
  const fillers = Object.values(countFillers(answer)).reduce((a, b) => a + b, 0);
  const fillerPenalty = words ? Math.min(1.5, (fillers / words) * 15) : 0;
  const lengthScore = Math.min(words, 120) / 120;

  const raw = 1 + lengthScore * 3 + Math.min(coverage, 1) * 4 + Math.min(specificity, 1) * 2 - fillerPenalty;
  // A substantive attempt is at worst "weak"; "gap" is for non-answers.
  const floor = words >= 8 ? 3 : 0;
  const score = Math.round(Math.min(10, Math.max(floor, raw)) * 10) / 10;
  const signal = signalFor(score);

  const strengths: string[] = [];
  if (hit.length) strengths.push(`Covered ${hit.slice(0, 3).join(", ")}`);
  if (specificity >= 0.66) strengths.push("Gave specific, justified detail");
  if (words >= 60) strengths.push("Developed the answer in depth");

  const missing = missed.slice(0, 4);
  if (specificity < 0.34) missing.push("concrete examples or justification");

  return {
    score,
    signal,
    strengths,
    missing,
    note:
      signal === "strong"
        ? "Solid, specific answer."
        : signal === "adequate"
          ? "Correct direction but could go deeper."
          : "Vague or missing key points.",
  };
}

/** Picks a short quote from the answer so follow-ups feel like they listened. */
export function quoteFrom(answer: string): string | null {
  const sentences = answer
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => countWords(s) >= 4);
  const pick = sentences.find((s) => /\bbecause\b|\bused\b|\bchose\b|\bwould\b/i.test(s)) ?? sentences[0];
  if (!pick) return null;
  const words = pick.replace(/[.!?]+$/, "").split(/\s+/);
  return words.length > 12 ? `${words.slice(0, 12).join(" ")}…` : words.join(" ");
}
