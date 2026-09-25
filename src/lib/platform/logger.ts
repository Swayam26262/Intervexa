/**
 * Structured JSON logger. One line per event so platforms (Vercel, Cloud Run, Datadog)
 * can index fields. Errors are also forwarded to the error reporter.
 */
import { reportError } from "./error-reporter";

type Level = "debug" | "info" | "warn" | "error";
const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel = LEVELS[(process.env.LOG_LEVEL as Level) ?? "info"] ?? LEVELS.info;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack, cause: error.cause ? String(error.cause) : undefined };
  }
  return { message: String(error) };
}

function write(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  if (LEVELS[level] < minLevel) return;
  const { error, ...rest } = fields;
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    msg,
    ...rest,
    ...(error !== undefined ? { error: serializeError(error) } : {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, fields?: Record<string, unknown>) => write("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => write("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => write("warn", msg, fields),
  error: (msg: string, fields: Record<string, unknown> = {}) => {
    write("error", msg, fields);
    void reportError(fields.error ?? new Error(msg), { msg, ...fields });
  },
};
