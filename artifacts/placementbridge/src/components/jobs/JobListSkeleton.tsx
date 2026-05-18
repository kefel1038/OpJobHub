import { JobCardSkeleton } from "./JobCardSkeleton";

interface JobListSkeletonProps {
  count?: number;
}

export function JobListSkeleton({ count = 5 }: JobListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}
