/**
 * Plans, products and entitlements. Pure functions (no DB) so they are easy to test.
 *
 * Billing is OFF unless BILLING_ENABLED=true: every user then gets unlimited, full-feature
 * interviews. When on:
 *  - Free: 3 interviews / calendar month, text answers, core report, 1 resume.
 *  - Credits: each credit is one Pro-level interview. Credits are used before the free quota.
 *  - Pro (30-day pass): unlimited interviews and every feature.
 */

export type ProductKind = "pro" | "credits";

export interface Product {
  id: string;
  kind: ProductKind;
  name: string;
  description: string;
  amountInr: number;
  days?: number;
  credits?: number;
  highlight?: boolean;
}

export const PRODUCTS: Product[] = [
  { id: "pro_30d", kind: "pro", name: "Pro", description: "30 days of unlimited interviews and every feature", amountInr: 199, days: 30, highlight: true },
  { id: "credits_3", kind: "credits", name: "3 interviews", description: "Pro-level interviews, never expire", amountInr: 49, credits: 3 },
  { id: "credits_10", kind: "credits", name: "10 interviews", description: "Pro-level interviews, never expire", amountInr: 99, credits: 10 },
  { id: "credits_30", kind: "credits", name: "30 interviews", description: "Pro-level interviews, never expire", amountInr: 199, credits: 30 },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export const FREE_MONTHLY_INTERVIEWS = 3;

export const FEATURES = {
  voice: "Voice interviews",
  jd: "Job-description tailoring",
  loops: "Full mock loops & readiness reports",
  packs: "Company-style interview packs",
  coding: "Coding rounds with a live editor",
  drills: "Personalised practice drills",
  analytics: "Progress analytics",
  fullReport: "Stronger-answer outlines & communication coaching",
  multiResume: "Multiple resumes",
  languages: "Interviews in Indian languages",
} as const;
export type Feature = keyof typeof FEATURES;

const ALL_FEATURES = Object.fromEntries(Object.keys(FEATURES).map((f) => [f, true])) as Record<Feature, boolean>;
const FREE_FEATURES = Object.fromEntries(Object.keys(FEATURES).map((f) => [f, false])) as Record<Feature, boolean>;

export type Tier = "unlimited" | "pro" | "credits" | "free";

export interface Entitlements {
  billingEnabled: boolean;
  tier: Tier;
  proUntil: Date | null;
  credits: number;
  freeUsed: number;
  freeLimit: number;
  /** Where the next interview's allowance comes from; null when none is left. */
  nextSource: "unlimited" | "pro" | "credit" | "free" | null;
  /** Features available for the next interview. */
  features: Record<Feature, boolean>;
  maxResumes: number;
}

export function billingEnabled(): boolean {
  return process.env.BILLING_ENABLED === "true";
}

export function computeEntitlements(
  input: { proUntil?: Date | null; credits?: number | null; freeUsedThisMonth: number },
  now: Date = new Date(),
  enabled: boolean = billingEnabled(),
): Entitlements {
  const proUntil = input.proUntil ? new Date(input.proUntil) : null;
  const credits = Math.max(0, input.credits ?? 0);
  const base = { billingEnabled: enabled, proUntil, credits, freeUsed: input.freeUsedThisMonth, freeLimit: FREE_MONTHLY_INTERVIEWS };

  if (!enabled) return { ...base, tier: "unlimited", nextSource: "unlimited", features: ALL_FEATURES, maxResumes: 5 };
  if (proUntil && proUntil > now) return { ...base, tier: "pro", nextSource: "pro", features: ALL_FEATURES, maxResumes: 5 };
  if (credits > 0) return { ...base, tier: "credits", nextSource: "credit", features: ALL_FEATURES, maxResumes: 5 };
  const freeLeft = input.freeUsedThisMonth < FREE_MONTHLY_INTERVIEWS;
  return { ...base, tier: "free", nextSource: freeLeft ? "free" : null, features: FREE_FEATURES, maxResumes: 1 };
}

export function startOfMonth(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}
