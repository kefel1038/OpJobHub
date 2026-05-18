import { Skeleton } from "@/components/ui/skeleton";

export function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
