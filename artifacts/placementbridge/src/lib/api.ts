const API_BASE = "/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export interface User {
  id: number;
  email: string;
  role: "jobseeker" | "employer" | "admin";
}

export interface Job {
  id: number;
  title: string;
  company: string;
  companyId?: number | null;
  companyLogo?: string | null;
  location: string;
  salary: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  description: string;
  descriptionCleaned?: string | null;
  employmentType?: string;
  experienceLevel?: string | null;
  industry?: string | null;
  category?: string | null;
  tags?: string[];
  skills?: string[];
  visaSponsored?: boolean;
  isRemote?: boolean;
  isUrgent?: boolean;
  isFeatured: boolean;
  isVerified?: boolean;
  nationalityFriendly?: string[];
  source?: string;
  sourceUrl?: string | null;
  applyUrl?: string | null;
  postedAt?: string;
  expiresAt?: string;
  scrapedAt?: string;
  aiSummary?: string | null;
  aiMatchScore?: number | null;
  status?: string;
  viewCount?: number;
  applyCount?: number;
  saveCount?: number;
  createdBy: number | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  url: string | null;
  thumbnail: string | null;
  featured: boolean;
  status: string | null;
  createdAt: string;
}

export interface SearchResult {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SearchStats {
  totalJobs: number;
  recentJobs: number;
  industries: Array<{ industry: string; count: number }>;
  locations: Array<{ location: string; count: number }>;
}

export interface ScraperStats {
  totalJobs: number;
  expiredJobs: number;
  recentJobs: number;
  lastScrape: any;
  sources: Array<{ source: string; count: number }>;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("auth-change"));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("auth-change"));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON response (HTML error page, etc.)
    if (!res.ok) {
      throw new Error(`Server error (${res.status}). Please try again later.`);
    }
    throw new Error("Unexpected response from server");
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof data.error === "string")
        ? data.error
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export interface EmployerStats {
  totalJobs: number;
  totalApplicants: number;
  interviewsThisWeek: number;
  hiredThisMonth: number;
  pipeline: Record<string, number>;
}

export interface Applicant {
  id: number;
  jobId: number;
  userId: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  jobTitle: string;
  applicant: { id: number; email: string } | null;
}

export interface AIMatch {
  candidateId: number;
  email: string;
  matchScore: number;
  matchedJobs: string[];
}

export const api = {
  register(email: string, password: string, role: "jobseeker" | "employer") {
    return request<{ token: string; user: User }>("/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
  },
  login(email: string, password: string) {
    return request<{ token: string; user: User }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  listJobs(params?: { status?: string }) {
    const qs = params?.status ? `?status=${params.status}` : "";
    return request<Job[]>(`/jobs${qs}`);
  },
  getJob(id: number) {
    return request<Job>(`/jobs/${id}`);
  },
  getFeaturedJobs() {
    return request<Job[]>("/jobs/featured");
  },
  getRecentJobs() {
    return request<Job[]>("/jobs/recent");
  },
  getUrgentJobs() {
    return request<Job[]>("/jobs/urgent");
  },
  getVisaSponsoredJobs() {
    return request<Job[]>("/jobs/visa-sponsored");
  },
  getIndustryJobs(industry: string) {
    return request<Job[]>(`/jobs/industry/${industry}`);
  },
  getSimilarJobs(id: number) {
    return request<Job[]>(`/jobs/${id}/similar`);
  },
  createJob(payload: {
    title: string;
    company: string;
    location: string;
    salary?: string;
    description: string;
    employmentType?: string;
    industry?: string;
    isFeatured?: boolean;
    visaSponsored?: boolean;
    applyUrl?: string;
  }) {
    return request<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateJob(id: number, payload: Partial<Job>) {
    return request<Job>(`/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteJob(id: number) {
    return request<{ success: boolean }>(`/jobs/${id}`, { method: "DELETE" });
  },
  reportJob(id: number) {
    return request<{ success: boolean }>(`/jobs/${id}/report`, { method: "POST" });
  },
  saveJob(id: number) {
    return request<{ saved: boolean }>(`/jobs/${id}/save`, { method: "POST" });
  },
  getSavedJobs() {
    return request<Job[]>("/saved-jobs");
  },

  searchJobs(params: {
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
  }) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        qs.set(key, String(value));
      }
    });
    return request<SearchResult>(`/search?${qs.toString()}`);
  },
  searchSuggestions(q: string) {
    return request<{ suggestions: string[] }>(`/search/suggestions?q=${encodeURIComponent(q)}`);
  },
  searchTrending() {
    return request<{ trending: string[] }>("/search/trending");
  },
  searchStats() {
    return request<SearchStats>("/search/stats");
  },

  scraperSources() {
    return request<any[]>("/scraper/sources");
  },
  scraperLogs() {
    return request<any[]>("/scraper/logs");
  },
  scraperStats() {
    return request<ScraperStats>("/scraper/stats");
  },
  runScraper(source?: string) {
    return request<{ success: boolean; message: string }>("/scraper/run", {
      method: "POST",
      body: JSON.stringify({ source }),
    });
  },
  cleanupExpiredJobs() {
    return request<{ success: boolean; deleted: number }>("/scraper/cleanup", {
      method: "POST",
    });
  },

  createCheckoutSession() {
    return request<{ url: string; id: string }>("/create-checkout-session", {
      method: "POST",
    });
  },
  registerAdmin(email: string, password: string, adminSecret: string) {
    return request<{ token: string; user: User }>("/register-admin", {
      method: "POST",
      body: JSON.stringify({ email, password, adminSecret }),
    });
  },
  adminStats() {
    return request<{
      totalUsers: number;
      totalJobs: number;
      featuredJobs: number;
      usersByRole: Record<string, number>;
    }>("/admin/stats");
  },
  adminListUsers() {
    return request<
      Array<{ id: number; email: string; role: string; createdAt: string }>
    >("/admin/users");
  },
  adminUpdateRole(id: number, role: "jobseeker" | "employer" | "admin") {
    return request<User>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },
  adminDeleteUser(id: number) {
    return request<{ success: boolean }>(`/admin/users/${id}`, {
      method: "DELETE",
    });
  },

  // ─── AI Matching ──────────────────────────────────────────────
  async analyzeResume(file: File) {
    const formData = new FormData();
    formData.append("resume", file);
    const res = await fetch(`${API_BASE}/ai/analyze-resume`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();

    if (res.status === 202) {
      // Analysis is processing asynchronously — poll for results
      return new Promise<{
        resumeId: number;
        analysis: any;
        matches: any[];
      }>((resolve, reject) => {
        const poll = async () => {
          try {
            const statusRes = await fetch(`${API_BASE}/ai/analyze-resume/status/${data.resumeId}`, {
              headers: { Authorization: `Bearer ${getToken()}` },
            });
            const statusData = await statusRes.json();
            if (statusData.status === "complete") {
              resolve({ resumeId: data.resumeId, analysis: statusData.analysis, matches: [] });
            } else if (statusData.status === "error") {
              reject(new Error(statusData.error || "Analysis failed"));
            } else {
              setTimeout(poll, 3000);
            }
          } catch {
            setTimeout(poll, 3000);
          }
        };
        poll();
      });
    }

    if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
    return data;
  },
  getAIMatches() {
    return request<{ matches: any[] }>("/ai/matches");
  },
  matchByProfile(payload: {
    skills: string[];
    experience?: string;
    location?: string;
    preferences?: string[];
  }) {
    return request<{
      matches: Array<{
        jobId: number;
        title: string;
        company: string;
        companyLogo?: string;
        location: string;
        salary?: string;
        salaryMin?: number;
        salaryMax?: number;
        employmentType?: string;
        experienceLevel?: string;
        isRemote?: boolean;
        isVerified?: boolean;
        matchScore: number;
        reasons: string[];
        alignedSkills: string[];
        skillGaps: string[];
        improvementSuggestions: string[];
      }>;
    }>("/ai/match-by-profile", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  careerGaps(payload: { skills: string[]; targetRole?: string }) {
    return request<{
      marketSkills: Array<{ skill: string; demand: number; avgSalary: number }>;
      missingSkills: Array<{ skill: string; demand: number; avgSalary: number }>;
      aiAdvice: string;
      totalJobsAnalyzed: number;
    }>("/ai/career-gaps", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ─── Freelance/Gig Marketplace APIs ───────────────────────────────
  getFreelanceGigs(params?: { category?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<Job[]>(`/freelance/gigs?${qs.toString()}`);
  },
  getFreelanceStats() {
    return request<{ totalGigs: number }>("/freelance/stats");
  },
  getFreelanceCategories() {
    return request<Array<{ category: string; count: number }>>("/freelance/categories");
  },

  // ─── Resources ──────────────────────────────────────────────────
  listResources(params?: { category?: string; search?: string; featured?: string; page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          qs.set(key, String(value));
        }
      });
    }
    const queryStr = qs.toString();
    return request<{ resources: Resource[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } }>(`/resources${queryStr ? `?${queryStr}` : ""}`);
  },

  // ─── Employer-Specific APIs ─────────────────────────────────────
  getEmployerStats() {
    return request<EmployerStats>("/employer/stats");
  },
  getEmployerJobs(status?: string) {
    const qs = status ? `?status=${status}` : "";
    return request<Job[]>(`/employer/jobs${qs}`);
  },
  getEmployerApplicants(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<Applicant[]>(`/employer/applicants${qs}`);
  },
  updateApplicationStatus(id: number, status: string) {
    return request<{ id: number; status: string }>(`/employer/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  getEmployerAIMatches() {
    return request<{ matches: AIMatch[] }>("/employer/ai-matches");
  },
};
