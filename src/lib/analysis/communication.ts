import type { CommunicationStats, StarCoverage, Turn } from "@/lib/interview/types";

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

const STAR_MARKERS = {
  situation: /\b(when i was|at (?:my|our) (?:last|previous|current)|in my (?:last|previous|current)|we were|the situation|there was a time|back in|while working)\b/i,
  task: /\b(my (?:task|goal|responsibility|job) was|i (?:was|had) (?:asked|responsible|tasked)|i needed to|we had to|the goal was|objective)\b/i,
  action: /\b(i (?:decided|built|implemented|created|wrote|led|proposed|reached out|talked|set up|analy[sz]ed|fixed|designed|introduced|organized|started)|so i|my approach)\b/i,
  result: /\b(as a result|result(?:ed)?|in the end|outcome|we (?:reduced|increased|improved|shipped|delivered|saved)|which (?:led|reduced|increased|improved)|\d+\s?%|learned)\b/i,
};
const SIGNPOST = /\b(first(?:ly)?|second(?:ly)?|then|next|finally|lastly|to summari[sz]e|in summary|there are (?:two|three|\d) )\b/gi;
const STOPWORDS = new Set("the a an and or but so to of in on at for with is was were be been it that this i we you they my our as by from are have has had do did not".split(" "));

/** Phrases of 3+ words the candidate repeats across answers (verbal tics, "at the end of the day"). */
export function repeatedPhrases(texts: string[], minCount = 3): { phrase: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const text of texts) {
    const words = text.toLowerCase().replace(/[^\p{L}\p{N}'\s]/gu, " ").split(/\s+/).filter(Boolean);
    for (let i = 0; i + 3 <= words.length; i++) {
      const gram = words.slice(i, i + 3);
      if (gram.every((w) => STOPWORDS.has(w))) continue;
      const key = gram.join(" ");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase, count]) => ({ phrase, count }));
}

export function starCoverage(answers: string[]): StarCoverage | null {
  const long = answers.filter((a) => countWords(a) >= 25);
  if (!long.length) return null;
  const share = (re: RegExp) => Math.round((long.filter((a) => re.test(a)).length / long.length) * 100) / 100;
  return {
    situation: share(STAR_MARKERS.situation),
    task: share(STAR_MARKERS.task),
    action: share(STAR_MARKERS.action),
    result: share(STAR_MARKERS.result),
    answers: long.length,
  };
}

type AnalyzableTurn = Pick<Turn, "answer" | "answerDurationSec" | "inputMode"> & Partial<Pick<Turn, "index" | "speech">>;

export function analyzeCommunication(turns: AnalyzableTurn[], options: { star?: boolean } = {}): CommunicationStats {
  const answered = turns.filter((t) => t.answer && t.answer.trim().length > 0);
  const fillerWords: Record<string, number> = {};
  let totalWords = 0;
  let shortAnswers = 0;
  let voiceWords = 0;
  let voiceSeconds = 0;
  let pauses = 0;
  let longestPause = 0;
  let signposted = 0;
  let longAnswers = 0;
  const paceByAnswer: { turnIndex: number; wpm: number }[] = [];

  for (const turn of answered) {
    const text = turn.answer!;
    const words = countWords(text);
    totalWords += words;
    if (words < 15) shortAnswers += 1;
    if (words >= 60) {
      longAnswers += 1;
      if ((text.match(SIGNPOST)?.length ?? 0) >= 2) signposted += 1;
    }
    for (const [label, n] of Object.entries(countFillers(text))) {
      fillerWords[label] = (fillerWords[label] ?? 0) + n;
    }
    if (turn.inputMode === "voice" && turn.answerDurationSec && turn.answerDurationSec >= 5) {
      voiceWords += words;
      voiceSeconds += turn.answerDurationSec;
      paceByAnswer.push({ turnIndex: turn.index ?? paceByAnswer.length + 1, wpm: Math.round(words / (turn.answerDurationSec / 60)) });
    }
    if (turn.speech) {
      pauses += turn.speech.pauses;
      longestPause = Math.max(longestPause, turn.speech.longestPauseSec);
    }
  }

  const totalFillers = Object.values(fillerWords).reduce((a, b) => a + b, 0);
  const texts = answered.map((t) => t.answer!);
  return {
    answers: answered.length,
    totalWords,
    avgWordsPerAnswer: answered.length ? Math.round(totalWords / answered.length) : 0,
    shortAnswers,
    fillerWords,
    fillerPer100Words: totalWords ? Math.round((totalFillers / totalWords) * 1000) / 10 : 0,
    wordsPerMinute: voiceSeconds > 0 ? Math.round(voiceWords / (voiceSeconds / 60)) : null,
    paceByAnswer,
    pauses,
    longestPauseSec: longestPause ? Math.round(longestPause * 10) / 10 : null,
    repeatedPhrases: repeatedPhrases(texts),
    star: options.star ? starCoverage(texts) : null,
    signposting: longAnswers ? Math.round((signposted / longAnswers) * 100) / 100 : 0,
  };
}
