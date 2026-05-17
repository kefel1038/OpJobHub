import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type SearchResult } from "@/lib/api";
import { useCallback, useRef, useEffect } from "react";

export interface JobSearchApiParams {
  q?: string;
  location?: string;
  industry?: string;
  categories?: string;
  employmentType?: string;
  experienceLevel?: string;
  experienceLevels?: string;
  workTypes?: string;
  skills?: string;
  nationality?: string;
  nationalities?: string;
  datePosted?: string;
  aiMatchScore?: number;
  locations?: string;
  salaryMin?: number;
  salaryMax?: number;
  visaSponsored?: boolean;
  isRemote?: boolean;
  isUrgent?: boolean;
  source?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export function useJobSearch(params: JobSearchApiParams) {
  const queryClient = useQueryClient();
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const queryKey = ["jobs", params.sort, params.page, params.limit, params.q || "",
    params.location || "", params.categories || "", params.employmentType || "",
    params.locations || "", params.experienceLevels || "", params.workTypes || "",
    params.skills || "", params.nationalities || "", params.datePosted || "",
    params.salaryMin ?? "", params.salaryMax ?? "", params.visaSponsored ?? false,
    params.isRemote ?? false, params.isUrgent ?? false, params.aiMatchScore ?? "",
  ] as const;

  const result = useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      return api.searchJobs(paramsRef.current, signal);
    },
    staleTime: 1000 * 60 * 2,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

  return result;
}

export function usePrefetchJobSearch() {
  const queryClient = useQueryClient();
  return useCallback((params: JobSearchApiParams) => {
    const queryKey = ["jobs", params.sort, params.page, params.limit, params.q || "",
      params.location || "", params.categories || "", params.employmentType || "",
      params.locations || "", params.experienceLevels || "", params.workTypes || "",
      params.skills || "", params.nationalities || "", params.datePosted || "",
      params.salaryMin ?? "", params.salaryMax ?? "", params.visaSponsored ?? false,
      params.isRemote ?? false, params.isUrgent ?? false, params.aiMatchScore ?? "",
    ] as const;
    queryClient.prefetchQuery({ queryKey, queryFn: () => api.searchJobs(params) });
  }, [queryClient]);
}
