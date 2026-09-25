import type { Metadata } from "next";
import Link from "next/link";
import { Layers } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { ProBadge } from "@/components/pro-dialog";
import { ProgressRing } from "@/components/ui/progress";
import { getEntitlements } from "@/lib/billing/service";
import { getPack, PACK_DISCLAIMER, PACKS } from "@/lib/interview/packs";
import { listLoops } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { formatDate } from "@/lib/utils";
import { NewLoopForm } from "./new-loop";

export const metadata: Metadata = { title: "Mock loops" };

export default async function LoopsPage() {
  const userId = await requireUserId();
  const [loops, entitlements] = await Promise.all([listLoops(userId), getEntitlements(userId)]);
  return (
    <div className="space-y-8">
      <PageHeader
        title="Mock loops"
        description="Paste a real job description and run the whole interview loop — coding, technical, design and behavioral — then get a job-readiness report."
        actions={!entitlements.features.loops ? <ProBadge /> : undefined}
      />

      {loops.length > 0 && (
        <section aria-labelledby="loops-heading">
          <SectionTitle>
            <span id="loops-heading">Your loops</span>
          </SectionTitle>
          <ul className="grid gap-3 md:grid-cols-2">
            {loops.map((loop) => {
              const done = loop.rounds.filter((r) => r.status === "completed").length;
              const pct = Math.round((done / Math.max(1, loop.rounds.length)) * 100);
              return (
                <li key={String(loop._id)}>
                  <Link href={`/loops/${loop._id}`} className="state-layer flex items-center gap-4 rounded-[28px] border border-outline-variant bg-card p-5">
                    <ProgressRing value={loop.readiness ? loop.readiness.overall : pct} size={64} stroke={6} indicatorClassName={loop.readiness ? "stroke-tertiary" : "stroke-primary"}>
                      <span className="text-title-sm tabular-nums">{loop.readiness ? loop.readiness.overall : `${done}/${loop.rounds.length}`}</span>
                    </ProgressRing>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-title-md">{loop.title}</div>
                      <div className="text-body-sm text-on-surface-variant">
                        {getPack(loop.packId)?.label ?? "From job description"} · {formatDate(loop.createdAt)}
                      </div>
                      <div className="mt-1 text-label-lg text-primary">{loop.readiness ? "Readiness report ready" : done ? "In progress" : "Not started"}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="new-loop-heading" className="rounded-[28px] border border-outline-variant bg-card p-5 sm:p-8">
        <h2 id="new-loop-heading" className="mb-1 flex items-center gap-2 text-title-lg">
          <Layers className="size-5 text-primary" /> New mock loop
        </h2>
        <p className="mb-6 text-body-md text-on-surface-variant">We&apos;ll match the JD against your profile and resume, then plan 3–5 rounds.</p>
        <NewLoopForm
          locked={!entitlements.features.loops}
          packs={PACKS.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb }))}
          disclaimer={PACK_DISCLAIMER}
        />
      </section>
    </div>
  );
}
