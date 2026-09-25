import type { Metadata } from "next";
import { Check, CreditCard, Info, Receipt, Sparkles, Zap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FEATURES, formatInr, FREE_MONTHLY_INTERVIEWS, getProduct, PRODUCTS } from "@/lib/billing/plans";
import { paymentsSimulated, razorpayConfigured } from "@/lib/billing/razorpay";
import { getEntitlements } from "@/lib/billing/service";
import { connectDB } from "@/lib/db";
import { Payment, type PaymentShape } from "@/lib/models/payment";
import { getUser } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { formatDate } from "@/lib/utils";
import { CheckoutButton } from "./checkout-button";

export const metadata: Metadata = { title: "Plan & billing" };

export default async function BillingPage() {
  const userId = await requireUserId();
  await connectDB();
  const [user, entitlements, payments] = await Promise.all([
    getUser(userId),
    getEntitlements(userId),
    Payment.find({ userId, status: "paid" }).sort({ createdAt: -1 }).limit(20).lean<(PaymentShape & { _id: unknown })[]>(),
  ]);
  const canPay = razorpayConfigured() || paymentsSimulated();
  const pro = PRODUCTS.find((p) => p.kind === "pro")!;
  const packs = PRODUCTS.filter((p) => p.kind === "credits");
  const buyer = { name: user?.name ?? "", email: user?.email ?? "" };

  const planName =
    entitlements.tier === "unlimited" ? "All features unlocked" : entitlements.tier === "pro" ? "Pro" : entitlements.tier === "credits" ? "Credits" : "Free";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader title="Plan & billing" description="Pay only when you're preparing — no auto-renewing subscriptions." />

      <section className="rounded-[28px] bg-primary-container p-6 text-on-primary-container sm:p-8" aria-labelledby="plan-heading">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-label-lg opacity-80">Current plan</p>
            <h2 id="plan-heading" className="mt-1 flex items-center gap-2 text-headline-md">
              {entitlements.tier === "pro" ? <Sparkles className="size-7" /> : <Zap className="size-7" />} {planName}
            </h2>
            <p className="mt-1 text-body-lg opacity-85">
              {entitlements.tier === "unlimited"
                ? "Billing is turned off on this deployment, so every feature is available."
                : entitlements.tier === "pro"
                  ? `Unlimited interviews until ${formatDate(entitlements.proUntil!)}.`
                  : entitlements.tier === "credits"
                    ? `${entitlements.credits} Pro-level interview credit${entitlements.credits === 1 ? "" : "s"} left.`
                    : `${FREE_MONTHLY_INTERVIEWS} interviews every month with text answers and the core report.`}
            </p>
          </div>
          {entitlements.billingEnabled && entitlements.tier !== "pro" && (
            <div className="w-full max-w-xs rounded-2xl bg-surface-container-lowest/70 p-4 text-on-surface">
              <div className="mb-2 flex justify-between text-body-md">
                <span>Free interviews this month</span>
                <span className="font-semibold tabular-nums">
                  {Math.min(entitlements.freeUsed, entitlements.freeLimit)}/{entitlements.freeLimit}
                </span>
              </div>
              <Progress value={(entitlements.freeUsed / entitlements.freeLimit) * 100} />
              {entitlements.credits > 0 && <p className="mt-2 text-body-sm text-on-surface-variant">Credits are used before your free quota.</p>}
            </div>
          )}
        </div>
      </section>

      {!canPay && (
        <p className="flex items-start gap-2 rounded-2xl bg-surface-container px-4 py-3 text-body-md text-on-surface-variant">
          <Info className="mt-0.5 size-4.5 shrink-0" /> Payments aren&apos;t configured on this deployment yet. Set the Razorpay keys (or PAYMENTS_MODE=simulate for development) to enable purchases.
        </p>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]" aria-label="Plans">
        <div className="flex flex-col rounded-[28px] border-2 border-primary bg-card p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-title-lg">
              <Sparkles className="size-5 text-primary" /> Pro
            </h3>
            <Badge variant="primary">Best value</Badge>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-display-sm">{formatInr(pro.amountInr)}</span>
            <span className="text-body-md text-on-surface-variant">for 30 days · no auto-renew</span>
          </div>
          <ul className="mt-6 grid flex-1 gap-2.5 text-body-md sm:grid-cols-2">
            {["Unlimited interviews", ...Object.values(FEATURES)].map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 size-4.5 shrink-0 text-primary" /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {canPay ? (
              <CheckoutButton productId={pro.id} label={entitlements.tier === "pro" ? "Extend 30 days" : "Get Pro"} user={buyer} />
            ) : null}
          </div>
        </div>
        <div className="rounded-[28px] border border-outline-variant bg-card p-6 sm:p-8">
          <h3 className="flex items-center gap-2 text-title-lg">
            <CreditCard className="size-5 text-primary" /> Interview credits
          </h3>
          <p className="mt-1 text-body-md text-on-surface-variant">One interview coming up? Each credit is a full Pro-level interview. Credits never expire.</p>
          <ul className="mt-6 space-y-3">
            {packs.map((p) => (
              <li key={p.id} className="flex items-center gap-4 rounded-2xl bg-surface-container-low p-4">
                <div className="min-w-0 flex-1">
                  <div className="text-title-md">{p.name}</div>
                  <div className="text-body-sm text-on-surface-variant">
                    {formatInr(p.amountInr)} · {formatInr(Math.round((p.amountInr / (p.credits ?? 1)) * 10) / 10)} per interview
                  </div>
                </div>
                <div className="w-28">{canPay && <CheckoutButton productId={p.id} label="Buy" user={buyer} variant="tonal" />}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="payments-heading" className="rounded-[28px] border border-outline-variant bg-card p-6">
        <h2 id="payments-heading" className="mb-4 flex items-center gap-2 text-title-lg">
          <Receipt className="size-5 text-primary" /> Payment history
        </h2>
        {payments.length ? (
          <table className="w-full text-left text-body-md">
            <thead className="text-label-md text-on-surface-variant">
              <tr>
                <th className="pb-2 font-semibold">Date</th>
                <th className="pb-2 font-semibold">Item</th>
                <th className="hidden pb-2 font-semibold sm:table-cell">Reference</th>
                <th className="pb-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {payments.map((p) => (
                <tr key={p.orderId} className="border-t border-outline-variant">
                  <td className="py-3">{formatDate(p.createdAt)}</td>
                  <td className="py-3">{getProduct(p.productId)?.name ?? p.productId}</td>
                  <td className="hidden py-3 font-mono text-body-sm text-on-surface-variant sm:table-cell">{p.paymentId ?? p.orderId}</td>
                  <td className="py-3 text-right">{formatInr(p.amountPaise / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-body-md text-on-surface-variant">No payments yet.</p>
        )}
      </section>
    </div>
  );
}
