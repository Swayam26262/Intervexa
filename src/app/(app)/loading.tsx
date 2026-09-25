import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 pt-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-72 rounded-full" />
      <Skeleton className="h-5 w-96 max-w-full rounded-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-[28px]" />
    </div>
  );
}
