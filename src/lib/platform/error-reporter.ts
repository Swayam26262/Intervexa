/**
 * Minimal Sentry-compatible error reporter (envelope API) — no SDK, no build plugin.
 * Enabled when SENTRY_DSN is set; otherwise a no-op. Never throws.
 */
import { randomUUID } from "node:crypto";

interface Dsn {
  key: string;
  host: string;
  projectId: string;
  protocol: string;
  raw: string;
}

function parseDsn(dsn: string | undefined): Dsn | null {
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    if (!url.username || !projectId) return null;
    return { key: url.username, host: url.host, projectId, protocol: url.protocol, raw: dsn };
  } catch {
    return null;
  }
}

function frames(stack: string | undefined) {
  return (stack ?? "")
    .split("\n")
    .slice(1, 30)
    .map((line) => line.trim().replace(/^at\s+/, ""))
    .reverse()
    .map((fn) => ({ function: fn, in_app: !fn.includes("node_modules") }));
}

export function buildSentryEnvelope(error: unknown, context: Record<string, unknown>, dsn: string, eventId = randomUUID().replace(/-/g, "")) {
  const err = error instanceof Error ? error : new Error(String(error));
  const now = new Date().toISOString();
  const event = {
    event_id: eventId,
    timestamp: now,
    platform: "node",
    level: "error",
    environment: process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    exception: { values: [{ type: err.name, value: err.message, stacktrace: { frames: frames(err.stack) } }] },
    extra: Object.fromEntries(Object.entries(context).filter(([k]) => k !== "error").map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)])),
  };
  return [JSON.stringify({ event_id: eventId, sent_at: now, dsn }), JSON.stringify({ type: "event" }), JSON.stringify(event)].join("\n");
}

export async function reportError(error: unknown, context: Record<string, unknown> = {}): Promise<void> {
  const dsn = parseDsn(process.env.SENTRY_DSN);
  if (!dsn) return;
  try {
    await fetch(`${dsn.protocol}//${dsn.host}/api/${dsn.projectId}/envelope/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.key}, sentry_client=intervexa/1.0`,
      },
      body: buildSentryEnvelope(error, context, dsn.raw),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Reporting must never break the request.
  }
}
