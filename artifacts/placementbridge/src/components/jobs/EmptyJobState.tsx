import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, MapPin } from "lucide-react";

interface EmptyJobStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  suggestedCategories?: string[];
}

export function EmptyJobState({ hasActiveFilters, onClearFilters, suggestedCategories = [] }: EmptyJobStateProps) {
  const suggestions = suggestedCategories.length > 0 
    ? suggestedCategories 
    : ["Oil & Gas", "Engineering", "Healthcare", "IT", "Construction"];

  return (
    <div className="text-center py-20">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-xl font-bold mb-2">No jobs found</p>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {hasActiveFilters
          ? "Try adjusting your search terms or explore these growing sectors in Qatar."
          : "No active job listings right now. Check back later or try these trending areas."}
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {suggestions.slice(0, 5).map((cat) => (
          <Button
            key={cat}
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => window.location.href = `/jobs?categories=${encodeURIComponent(cat)}`}
          >
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            {cat}
          </Button>
        ))}
      </div>

      {hasActiveFilters && (
        <Button variant="default" onClick={onClearFilters} className="rounded-full">
          Clear all filters
        </Button>
      )}

      <div className="mt-8 text-left max-w-md mx-auto">
        <p className="text-sm font-medium text-muted-foreground mb-3">Quick tips:</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-primary" />
            Try broader locations like Doha or Lusail
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
            Enable "Visa Sponsored" for more international roles
          </li>
        </ul>
      </div>
    </div>
  );
}
