import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** The Material 3 type scale defined in globals.css (text-display-sm, text-label-lg, …). */
export const TYPE_SCALE = [
  "display-md",
  "display-sm",
  "headline-lg",
  "headline-md",
  "headline-sm",
  "title-lg",
  "title-md",
  "title-sm",
  "body-lg",
  "body-md",
  "body-sm",
  "label-lg",
  "label-md",
  "label-sm",
];

// Teach tailwind-merge that text-<scale> is a font size, not a text color; otherwise
// cn("text-on-primary", "text-label-lg") would drop the color.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: TYPE_SCALE }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

/** Tailwind text color for a 0-100 score. */
export function scoreTone(score: number | null | undefined): string {
  if (score === null || score === undefined) return "text-on-surface-variant";
  if (score >= 75) return "text-success";
  if (score >= 55) return "text-warning";
  return "text-error";
}

export function scoreBarTone(score: number): string {
  if (score >= 75) return "bg-success";
  if (score >= 55) return "bg-warning";
  return "bg-error";
}
