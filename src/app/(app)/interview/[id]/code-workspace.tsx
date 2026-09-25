"use client";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleX, FlaskConical, Loader2, Play, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { runTests, type RunOutcome } from "@/lib/coding/runner";
import type { PublicProblem } from "@/lib/interview/coding-problems";
import type { CodeLanguage } from "@/lib/interview/types";
import { cn } from "@/lib/utils";

/** Editor chrome drawn from the app's color tokens, so it follows light/dark automatically. */
const editorTheme = EditorView.theme({
  "&": { backgroundColor: "var(--surface-container-lowest)", color: "var(--on-surface)", fontSize: "13.5px", height: "100%" },
  ".cm-content": { fontFamily: "var(--font-code), ui-monospace, monospace", caretColor: "var(--primary)", padding: "12px 0" },
  ".cm-gutters": { backgroundColor: "var(--surface-container-low)", color: "var(--on-surface-variant)", border: "none" },
  ".cm-activeLine": { backgroundColor: "color-mix(in oklab, var(--primary) 6%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "color-mix(in oklab, var(--primary) 10%, transparent)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in oklab, var(--primary) 28%, transparent) !important",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-cursor": { borderLeftColor: "var(--primary)" },
});

export function CodeWorkspace({
  problem,
  language,
  storageKey,
  onChange,
  onRun,
}: {
  problem: PublicProblem;
  language: CodeLanguage;
  storageKey: string;
  onChange: (source: string) => void;
  onRun: (outcome: RunOutcome) => void;
}) {
  const starter = problem.starter[language];
  const [source, setSource] = useState(starter);
  const [running, setRunning] = useState<"visible" | "all" | null>(null);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSource(saved);
        onChange(saved);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const extensions = useMemo(() => [language === "python" ? python() : javascript(), editorTheme, EditorView.lineWrapping], [language]);

  function update(value: string) {
    setSource(value);
    onChange(value);
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      /* ignore */
    }
  }

  async function run(scope: "visible" | "all") {
    setRunning(scope);
    const tests = problem.tests.filter((t) => scope === "all" || !t.hidden);
    const result = await runTests(language, source, problem.functionName[language], tests, problem.compare);
    setOutcome(result);
    onRun(result);
    setRunning(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant px-4 py-2">
        <div className="flex items-center gap-2 text-label-lg text-on-surface-variant">
          <span className="rounded-md bg-surface-container px-2 py-0.5 font-mono">{language === "python" ? "Python 3" : "JavaScript"}</span>
          <span className="hidden font-mono sm:inline">{problem.functionName[language]}()</span>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Reset to starter code" onClick={() => update(starter)}>
            <RotateCcw />
          </Button>
          <Button type="button" variant="tonal" size="sm" disabled={running !== null} onClick={() => void run("visible")}>
            {running === "visible" ? <Loader2 className="animate-spin" /> : <Play />} Run
          </Button>
          <Button type="button" variant="default" size="sm" disabled={running !== null} onClick={() => void run("all")}>
            {running === "all" ? <Loader2 className="animate-spin" /> : <FlaskConical />} Submit tests
          </Button>
        </div>
      </div>

      <div className="min-h-[240px] flex-1 overflow-auto">
        <CodeMirror
          value={source}
          height="100%"
          className="h-full"
          extensions={extensions}
          onChange={update}
          basicSetup={{ foldGutter: false, highlightActiveLineGutter: true, autocompletion: true }}
          aria-label="Code editor"
        />
      </div>

      <div className="max-h-[40%] min-h-0 overflow-auto border-t border-outline-variant bg-surface-container-low" aria-live="polite">
        {running && language === "python" && !outcome && (
          <p className="px-4 py-3 text-body-sm text-on-surface-variant">Starting Python (first run downloads the interpreter)…</p>
        )}
        {!outcome && !running && <p className="px-4 py-3 text-body-sm text-on-surface-variant">Run your code to see test results.</p>}
        {outcome && (
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={outcome.passed === outcome.total && outcome.total > 0 ? "success" : "destructive"}>
                {outcome.passed}/{outcome.total} passed
              </Badge>
              <span className="text-body-sm text-on-surface-variant">{outcome.ms} ms</span>
            </div>
            {outcome.error && <p className="mb-2 rounded-lg bg-error-container px-3 py-2 font-mono text-body-sm text-on-error-container">{outcome.error}</p>}
            <ul className="space-y-1">
              {outcome.results.map((r) => (
                <li key={r.name} className="flex items-start gap-2 text-body-sm">
                  {r.passed ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <CircleX className="mt-0.5 size-4 shrink-0 text-error" />}
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{r.name}</span>
                    {!r.passed && !outcome.error && (
                      <span className={cn("block font-mono text-on-surface-variant")}>
                        expected {r.expected}, got {r.error ? `error: ${r.error}` : r.actual}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {outcome.logs && outcome.logs.length > 0 && (
              <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-surface-container px-3 py-2 font-mono text-body-sm">{outcome.logs.join("\n")}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
