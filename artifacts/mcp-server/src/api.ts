const API_BASE = process.env.OPJOBHUB_API_URL || "https://op-job-hub.vercel.app/api";
const API_TOKEN = process.env.OPJOBHUB_API_TOKEN || "";

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  description: string;
  employmentType?: string;
  experienceLevel?: string;
  industry?: string;
  skills?: string[];
  visaSponsored?: boolean;
  isRemote?: boolean;
  isFeatured: boolean;
  postedAt?: string;
  aiMatchScore?: number | null;
}

export interface MarketInsight {
  marketSkills: Array<{ skill: string; demand: number; avgSalary: number }>;
  missingSkills: Array<{ skill: string; demand: number; avgSalary: number }>;
  aiAdvice: string;
  totalJobsAnalyzed: number;
}

export interface MatchResult {
  matches: Array<{
    jobId: number;
    title: string;
    company: string;
    location: string;
    salary: string;
    matchScore: number;
    reasons: string[];
    alignedSkills: string[];
    skillGaps: string[];
  }>;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_TOKEN) headers["Authorization"] = `Bearer ${API_TOKEN}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body || res.statusText}`);
  }

  return res.json();
}

export async function searchJobs(params: {
  q?: string;
  location?: string;
  industry?: string;
  employmentType?: string;
  experienceLevel?: string;
  visaSponsored?: boolean;
  remote?: boolean;
  limit?: number;
}): Promise<Job[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.location) qs.set("location", params.location);
  if (params.industry) qs.set("industry", params.industry);
  if (params.employmentType) qs.set("employmentType", params.employmentType);
  if (params.experienceLevel) qs.set("experienceLevel", params.experienceLevel);
  if (params.visaSponsored) qs.set("visaSponsored", "true");
  if (params.remote) qs.set("remote", "true");
  if (params.limit) qs.set("limit", String(params.limit));

  return request<Job[]>(`/jobs${qs.toString() ? `?${qs.toString()}` : ""}`);
}

export async function getJob(id: number): Promise<Job> {
  return request<Job>(`/jobs/${id}`);
}

export async function getMarketInsights(payload: {
  skills?: string[];
  targetRole?: string;
}): Promise<MarketInsight> {
  return request<MarketInsight>("/ai/career-gaps", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function matchByProfile(payload: {
  skills: string[];
  experience?: string;
  location?: string;
}): Promise<MatchResult> {
  return request<MatchResult>("/ai/match-by-profile", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getEmployerStats(): Promise<Record<string, number>> {
  return request<Record<string, number>>("/employer/stats");
}

export async function getEmployerAIMatches(): Promise<MatchResult> {
  return request<MatchResult>("/employer/ai-matches");
}
