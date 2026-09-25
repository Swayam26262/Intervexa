"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { TypeIcon } from "@/components/interview-meta";
import { FilterChip } from "@/components/ui/chip";
import { NativeSelect } from "@/components/ui/select";
import { INTERVIEW_TYPES, TYPE_META } from "@/lib/interview/config";

export function HistoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const type = params.get("type") ?? "";

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  // Debounced search.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="relative flex h-14 min-w-0 flex-1 items-center rounded-full bg-surface-container-high px-4 transition-shadow focus-within:shadow-elevation-1 sm:min-w-80">
          <span className="sr-only">Search interviews</span>
          {pending ? <Loader2 className="size-5 animate-spin text-on-surface-variant" /> : <Search className="size-5 text-on-surface-variant" />}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by role, topic or weak area"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-body-lg outline-none placeholder:text-on-surface-variant/80"
          />
          {q && (
            <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="state-layer grid size-9 place-items-center rounded-full">
              <X className="size-5" />
            </button>
          )}
        </label>
        <div className="flex gap-2">
          <NativeSelect aria-label="Status" value={params.get("status") ?? ""} onChange={(e) => update({ status: e.target.value || null })} className="h-14 rounded-full">
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In progress</option>
          </NativeSelect>
          <NativeSelect aria-label="Sort" value={params.get("sort") ?? "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })} className="h-14 rounded-full">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="score_high">Highest score</option>
            <option value="score_low">Lowest score</option>
          </NativeSelect>
        </div>
      </div>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by round type">
        <FilterChip selected={!type} onClick={() => update({ type: null })}>
          All rounds
        </FilterChip>
        {INTERVIEW_TYPES.map((t) => (
          <FilterChip
            key={t}
            selected={type === t}
            onClick={() => update({ type: type === t ? null : t })}
            icon={<TypeIcon type={t} size="sm" className="size-5 rounded-md bg-transparent [&_svg]:size-4" />}
          >
            {TYPE_META[t].label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
