import { useJobSearch } from "@/hooks/use-jobs-query";
import { JobCard } from "./JobCard";
import type { Job } from "@/lib/api";
import { Sparkles } from "lucide-react";

interface RecommendedJobsRailProps {
  currentParams?: any;
  onSelect: (job: Job) => void;
}

export function RecommendedJobsRail({ currentParams, onSelect }: RecommendedJobsRailProps) {
  // Fetch a small set of recommended jobs (could be based on current category or featured)
  const { data } = useJobSearch({
    ...currentParams,
    limit: 6,
    sort: "newest",
  });

  const recommended = data?.jobs?.slice(0, 5) || [];

  if (recommended.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Recommended For You</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">AI Powered</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x">
        {recommended.map((job, index) => (
          <div key={job.id} className="min-w-[320px] snap-start">
            <JobCard 
              job={job} 
              index={index} 
              onSelect={onSelect} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
