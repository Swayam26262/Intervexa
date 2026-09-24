import type { CommunicationStats, Turn } from "@/lib/interview/types";

/**
 * Filler phrases we coach on. "like" is only counted when it isn't part of a
 * common legitimate construction ("would like", "looks like", ...).
 */
const FILLER_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "um", pattern: /\b(?:um+|umm+)\b/gi },
  { label: "uh", pattern: /\b(?:uh+|uhh+|er+m?|ah+)\b/gi },
  {
    label: "like",
    pattern:
      /(?<!\b(?:would|'d|i'd|we'd|you'd|look|looks|looked|feel|feels|felt|seem|seems|seemed|something|anything|just|things?|more|much|sound|sounds)\s)\blike\b(?!\s+(?:this|that|to|a|an|the)\b)/gi,
  },
  { label: "basically", pattern: /\bbasically\b/gi },
  { label: "actually", pattern: /\bactually\b/gi },
  { label: "literally", pattern: /\bliterally\b/gi },
  { label: "you know", pattern: /\byou know\b(?!\s+(?:how|what|why|when|where|that|if)\b)/gi },
  { label: "i mean", pattern: /\bi mean\b/gi },
  { label: "sort of", pattern: /\bsort of\b/gi },
  { label: "kind of", pattern: /\bkind of\b/gi },
];

export function countWords(text: string): number {
  const matches = text.trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’+#.-]*/gu);
  return matches ? matches.length : 0;
}

export function countFillers(text: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const { label, pattern } of FILLER_PATTERNS) {
    const n = text.match(pattern)?.length ?? 0;
    if (n > 0) counts[label] = n;
  }
  return counts;
}

export function analyzeCommunication(turns: Pick<Turn, "answer" | "answerDurationSec" | "inputMode">[]): CommunicationStats {
  const answered = turns.filter((t) => t.answer && t.answer.trim().length > 0);
  const fillerWords: Record<string, number> = {};
  let totalWords = 0;
  let shortAnswers = 0;
  let voiceWords = 0;
  let voiceSeconds = 0;

  for (const turn of answered) {
    const text = turn.answer!;
    const words = countWords(text);
    totalWords += words;
    if (words < 15) shortAnswers += 1;
    for (const [label, n] of Object.entries(countFillers(text))) {
      fillerWords[label] = (fillerWords[label] ?? 0) + n;
    }
    if (turn.inputMode === "voice" && turn.answerDurationSec && turn.answerDurationSec >= 5) {
      voiceWords += words;
      voiceSeconds += turn.answerDurationSec;
    }
  }

  const totalFillers = Object.values(fillerWords).reduce((a, b) => a + b, 0);
  return {
    answers: answered.length,
    totalWords,
    avgWordsPerAnswer: answered.length ? Math.round(totalWords / answered.length) : 0,
    shortAnswers,
    fillerWords,
    fillerPer100Words: totalWords ? Math.round((totalFillers / totalWords) * 1000) / 10 : 0,
    wordsPerMinute: voiceSeconds > 0 ? Math.round(voiceWords / (voiceSeconds / 60)) : null,
  };
}
