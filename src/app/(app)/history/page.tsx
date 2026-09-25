import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, History, SearchX } from "lucide-react";
import { TypeIcon } from "@/components/interview-meta";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { isInterviewType, TYPE_META } from "@/lib/interview/config";
import { searchInterviews, type HistoryQuery } from "@/lib/server/data";
import { requireUserId } from "@/lib/server/session";
import { cn, formatDate, scoreTone } from "@/lib/utils";
import { HistoryFilters } from "./filters";

export const metadata: Metadata = { title: "History" };

type Params = { q?: string; type?: string; status?: string; sort?: string; page?: string };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Params> }) {
  const userId = await requireUserId();
  const params = await searchParams;
  const query: HistoryQuery = {
    q: params.q?.slice(0, 100),
    type: isInterviewType(params.type) ? params.type : undefined,
    status: params.status === "completed" || params.status === "in_progress" ? params.status : undefined,
    sort: (["oldest", "score_high", "score_low"] as const).find((s) => s === params.sort) ?? "newest",
    page: Number(params.page) || 1,
  };
  const { items, total, page, pages } = await searchInterviews(userId, query);
  const filtered = Boolean(query.q || query.type || query.status);
  const pageHref = (p: number) => {
    const next = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    next.set("page", String(p));
    return `/history?${next.toString()}`;
  };

  return (
    <div>
      <PageHeader title="History" description={`${total} interview${total === 1 ? "" : "s"}${filtered ? " match your filters" : " so far"}.`} />
      <HistoryFilters />

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon={filtered ? <SearchX /> : <History />}
            title={filtered ? "No interviews match" : "No interviews yet"}
            body={filtered ? "Try a different search or clear the filters." : "Your interviews and reports will appear here."}
            action={
              filtered ? (
                <Button asChild variant="tonal">
                  <Link href="/history">Clear filters</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/interview/new">Start an interview</Link>
                </Button>
              )
            }
          />
        ) : (
          <ul className="overflow-hidden rounded-[28px] border border-outline-variant bg-card">
            {items.map((iv, i) => {
              const live = iv.status === "in_progress";
              const topics = [...new Set(iv.turns?.map((t) => t.topic) ?? [])].slice(0, 3);
              return (
                <li key={String(iv._id)} className={cn(i > 0 && "border-t border-outline-variant")}>
                  <Link href={live ? `/interview/${iv._id}` : `/interview/${iv._id}/report`} className="state-layer flex items-center gap-4 px-5 py-4">
                    <TypeIcon type={iv.config.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-title-sm">{iv.config.drill ? `Drill · ${iv.config.focus}` : iv.config.role}</span>
                        {iv.config.loopId && <Badge variant="accent">Loop</Badge>}
                      </div>
                      <div className="truncate text-body-sm text-on-surface-variant">
                        {TYPE_META[iv.config.type].label} · {formatDate(iv.createdAt)} · {iv.config.durationMinutes} min
                        {topics.length ? ` · ${topics.join(", ")}` : ""}
                      </div>
                    </div>
                    {live ? (
                      <Badge variant="primary">Resume</Badge>
                    ) : iv.reportStatus === "pending" ? (
                      <Badge variant="secondary">Generating…</Badge>
                    ) : (
                      <span className={cn("text-title-lg tabular-nums", scoreTone(iv.report?.overallScore))}>
                        {iv.report?.overallScore ?? "—"}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-between" aria-label="Pagination">
          <Button asChild variant="outline" className={cn(page <= 1 && "pointer-events-none opacity-40")} aria-disabled={page <= 1}>
            <Link href={pageHref(page - 1)}>
              <ChevronLeft /> Previous
            </Link>
          </Button>
          <span className="text-body-md text-on-surface-variant">
            Page {page} of {pages}
          </span>
          <Button asChild variant="outline" className={cn(page >= pages && "pointer-events-none opacity-40")} aria-disabled={page >= pages}>
            <Link href={pageHref(page + 1)}>
              Next <ChevronRight />
            </Link>
          </Button>
        </nav>
      )}
    </div>
  );
}
