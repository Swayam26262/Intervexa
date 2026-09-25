"use client";

import { normalizeForCompare, type Comparator } from "@/lib/interview/coding-problems";
import type { CodeLanguage, TestResult } from "@/lib/interview/types";

export interface RunnableTest {
  name: string;
  args: unknown[];
  expected: unknown;
  hidden?: boolean;
}

export interface RunOutcome {
  results: TestResult[];
  passed: number;
  total: number;
  /** Compile/load error or timeout that prevented running tests. */
  error?: string;
  logs?: string[];
  ms: number;
}

const JS_WORKER = `
self.onmessage = (e) => {
  const { source, functionName, tests } = e.data;
  const logs = [];
  const fakeConsole = { log: (...a) => { if (logs.length < 50) logs.push(a.map((x) => { try { return typeof x === "string" ? x : JSON.stringify(x); } catch { return String(x); } }).join(" ")); } };
  fakeConsole.error = fakeConsole.log; fakeConsole.warn = fakeConsole.log; fakeConsole.info = fakeConsole.log;
  let fn;
  try {
    fn = new Function("console", "self", "postMessage", "fetch", "importScripts", source + "\\n;return typeof " + functionName + " === 'function' ? " + functionName + " : undefined;")(fakeConsole, undefined, undefined, undefined, undefined);
  } catch (err) { postMessage({ error: "Syntax error: " + (err && err.message || err) }); return; }
  if (!fn) { postMessage({ error: "Define a function named " + functionName + "." }); return; }
  const results = tests.map((args) => {
    try { const r = fn(...JSON.parse(JSON.stringify(args))); return { ok: true, actual: r === undefined ? null : r }; }
    catch (err) { return { ok: false, error: String(err && err.message || err) }; }
  });
  postMessage({ results, logs });
};`;

const PY_WORKER = (indexURL: string) => `
importScripts(${JSON.stringify(indexURL + "pyodide.js")});
let pyodideReady = loadPyodide({ indexURL: ${JSON.stringify(indexURL)} });
self.onmessage = async (e) => {
  const { source, functionName, tests } = e.data;
  try {
    const pyodide = await pyodideReady;
    pyodide.globals.set("__ivx_tests", JSON.stringify(tests));
    pyodide.globals.set("__ivx_source", source);
    const out = await pyodide.runPythonAsync(\`
import json, io, contextlib
__ivx_logs = io.StringIO()
__ivx_ns = {}
with contextlib.redirect_stdout(__ivx_logs):
    exec(__ivx_source, __ivx_ns)
__ivx_fn = __ivx_ns.get(${JSON.stringify("__FN__")})
__ivx_results = []
if __ivx_fn is None:
    raise NameError("Define a function named ${"__FN__"}.")
for __args in json.loads(__ivx_tests):
    try:
        with contextlib.redirect_stdout(__ivx_logs):
            __r = __ivx_fn(*__args)
        __ivx_results.append({"ok": True, "actual": __r})
    except Exception as __e:
        __ivx_results.append({"ok": False, "error": repr(__e)})
json.dumps({"results": __ivx_results, "logs": __ivx_logs.getvalue().splitlines()[:50]}, default=lambda o: list(o) if hasattr(o, "__iter__") else str(o))
\`.replaceAll("__FN__", functionName));
    postMessage(JSON.parse(out));
  } catch (err) { postMessage({ error: String(err && err.message || err).split("\\n").slice(-3).join(" ") }); }
};`;

let pyWorker: Worker | null = null;
function pythonWorker(): Worker {
  if (pyWorker) return pyWorker;
  const indexURL = process.env.NEXT_PUBLIC_PYODIDE_INDEX_URL || "https://cdn.jsdelivr.net/pyodide/v0.28.0/full/";
  pyWorker = new Worker(URL.createObjectURL(new Blob([PY_WORKER(indexURL)], { type: "text/javascript" })));
  return pyWorker;
}

function fmt(value: unknown): string {
  try {
    const s = JSON.stringify(value);
    return s.length > 300 ? `${s.slice(0, 300)}…` : s;
  } catch {
    return String(value);
  }
}

/**
 * Runs the candidate's function against tests in an isolated Web Worker (no DOM, no network
 * globals). Infinite loops are cut off by terminating the worker.
 */
export async function runTests(
  language: CodeLanguage,
  source: string,
  functionName: string,
  tests: RunnableTest[],
  compare: Comparator,
): Promise<RunOutcome> {
  const started = performance.now();
  const isPython = language === "python";
  const worker = isPython ? pythonWorker() : new Worker(URL.createObjectURL(new Blob([JS_WORKER], { type: "text/javascript" })));
  // Python's first run downloads the interpreter, so it gets a longer budget.
  const timeoutMs = isPython ? 30000 : 4000;

  type Raw = { results?: { ok: boolean; actual?: unknown; error?: string }[]; logs?: string[]; error?: string };
  const raw = await new Promise<Raw>((resolve) => {
    const timer = setTimeout(() => {
      worker.terminate();
      if (isPython) pyWorker = null;
      resolve({ error: `Time limit exceeded (${timeoutMs / 1000}s) — check for an infinite loop.` });
    }, timeoutMs);
    worker.onmessage = (e: MessageEvent<Raw>) => {
      clearTimeout(timer);
      resolve(e.data);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      resolve({ error: e.message || "Could not run your code." });
    };
    worker.postMessage({ source, functionName, tests: tests.map((t) => t.args) });
  });
  if (!isPython) worker.terminate();

  const ms = Math.round(performance.now() - started);
  if (raw.error || !raw.results) {
    return {
      results: tests.map((t) => ({ name: t.name, passed: false, expected: fmt(t.expected), error: raw.error ?? "No result" })),
      passed: 0,
      total: tests.length,
      error: raw.error,
      ms,
    };
  }
  const results: TestResult[] = tests.map((t, i) => {
    const r = raw.results![i];
    if (!r?.ok) return { name: t.name, passed: false, expected: fmt(t.expected), error: r?.error ?? "Error" };
    const passed = normalizeForCompare(r.actual, compare) === normalizeForCompare(t.expected, compare);
    return { name: t.name, passed, expected: fmt(t.expected), actual: fmt(r.actual) };
  });
  return { results, passed: results.filter((r) => r.passed).length, total: results.length, logs: raw.logs, ms };
}
