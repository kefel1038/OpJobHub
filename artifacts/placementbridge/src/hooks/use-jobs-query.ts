import { useQuery } from "@tanstack/react-query";
import { api, type SearchResult } from "@/lib/api";

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
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => api.searchJobs(params),
    placeholderData: (prev) => prev,
  });
}
