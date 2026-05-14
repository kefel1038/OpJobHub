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
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  companySize?: string;
  companyOverview?: string;
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
  aiCategory?: string | null;
  aiMatchScore?: number | null;
  aiResumeOptimization?: string[];
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
    responsibilities?: string[];
    requirements?: string[];
    benefits?: string[];
    companySize?: string;
    companyOverview?: string;
    aiResumeOptimization?: string[];
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
  semanticMatch(payload: {
    skills?: string[];
    title?: string;
    experience?: string;
    location?: string;
    industry?: string;
    topN?: number;
  }) {
    return request<{
      matches: Array<{
        jobId: number; title: string; company: string; location: string;
        salary: string; salaryMin: number | null; salaryMax: number | null;
        employmentType: string; experienceLevel: string; industry: string;
        visaSponsored: boolean; isRemote: boolean; postedAt: string;
        matchScore: number; vectorScore: number; skillMatchScore: number;
        exactMatchSkills: string[]; transferableMatchSkills: string[];
        hiddenTalent: boolean; sponsorshipScore: number;
        skillGaps: string[]; reasons: string[];
      }>;
      hiddenGems: Array<any>;
      sponsorshipEligible: Array<any>;
      inferredSkills: string[];
      transferableRoles: string[];
      totalScored: number;
    }>("/ai/semantic-match", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  copilot(messages: Array<{ role: string; content: string }>) {
    return request<{ reply: string; context: { hasMarketData: boolean; hasJobData: boolean; mentionedSkills: string[] } }>(
      "/ai/copilot",
      { method: "POST", body: JSON.stringify({ messages }) }
    );
  },
  generateJobDescription(payload: {
    title: string;
    industry?: string;
    location?: string;
    experienceLevel?: string;
    employmentType?: string;
    skills?: string[];
    salaryRange?: string;
    companyName?: string;
    companyOverview?: string;
    aboutRole?: string;
  }) {
    return request<{
      description: string;
      responsibilities: string[];
      requirements: string[];
      benefits: string[];
      socialLinkedIn: string;
      socialWhatsApp: string;
      seoKeywords: string[];
      interviewQuestions: string[];
    }>("/ai/generate-job-description", {
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
  generateFollowUp(appId: number, payload: { stage: string; candidateName: string; jobTitle: string; companyName: string; customInstructions?: string }) {
    return request<{ message: string; stage: string; applicationId: number; candidateName: string; jobTitle: string }>(
      `/employer/applications/${appId}/follow-up`,
      { method: "POST", body: JSON.stringify(payload) }
    );
  },
  // ─── Agent System APIs ──────────────────────────────────────────
  startAgents() {
    return request<{ status: string; message: string }>("/agents/start", { method: "POST" });
  },
  stopAgents() {
    return request<{ status: string; message: string }>("/agents/stop", { method: "POST" });
  },
  getAgentStatus() {
    return request<{ active: boolean; recentEvents: number; registeredHandlers: string[] }>("/agents/status");
  },
  runSourcingAgent(jobId: number) {
    return request<{ sourcedCount: number; candidates: Array<{ name: string; email: string; matchReason: string; score: number }> }>(
      "/agents/sourcing/run", { method: "POST", body: JSON.stringify({ jobId }) }
    );
  },
  runRankingAgent(jobId: number) {
    return request<{ rankedCount: number; rankings: Array<{ candidateId: number; name: string; score: number; reasoning: string; recommendation: string }> }>(
      "/agents/ranking/run", { method: "POST", body: JSON.stringify({ jobId }) }
    );
  },
  runFullPipeline(jobId: number) {
    return request<{ sourcing: { sourcedCount: number }; ranking: { rankedCount: number } }>(
      "/agents/pipeline/run", { method: "POST", body: JSON.stringify({ jobId }) }
    );
  },
  generateOutreach(candidateId: number, jobId: number, stage: string, customNotes?: string) {
    return request<{ message: string; subject: string }>(
      "/agents/outreach/generate", { method: "POST", body: JSON.stringify({ candidateId, jobId, stage, customNotes }) }
    );
  },
  getAgentMemory() {
    return request<{ preferences: Array<{ key: string; value: string; confidence: number }>; patterns: any }>("/agents/memory");
  },
  storeAgentPreference(key: string, value: string, confidence?: number) {
    return request<{ status: string }>("/agents/memory/preference", { method: "POST", body: JSON.stringify({ key, value, confidence }) });
  },
  getAgentEvents(type?: string, limit?: number) {
    const qs = new URLSearchParams();
    if (type) qs.set("type", type);
    if (limit) qs.set("limit", String(limit));
    return request<{ events: Array<{ type: string; source: string; payload: any; timestamp: string }> }>(`/agents/events?${qs.toString()}`);
  },
  getPendingFollowUps() {
    return request<{ followUps: Array<{ applicationId: number; status: string; candidateName: string; jobTitle: string; companyName: string; appliedAt: string }> }>(
      "/employer/follow-ups/pending"
    );
  },

  // ─── Adaptive Intelligence ─────────────────────────────────────
  recordSignal(actionType: string, candidateId?: number, jobId?: number, metadata?: any) {
    return request<{ status: string; contradiction: string | null }>("/agents/signals/record", {
      method: "POST",
      body: JSON.stringify({ actionType, candidateId, jobId, metadata }),
    });
  },
  getSignals(limit?: number, offset?: number) {
    const qs = new URLSearchParams();
    if (limit) qs.set("limit", String(limit));
    if (offset) qs.set("offset", String(offset));
    return request<{ signals: any[]; total: number }>(`/agents/signals?${qs.toString()}`);
  },
  inferPreferences() {
    return request<{ inferred: number; suggestions: any[] }>("/agents/preferences/infer", { method: "POST" });
  },
  getInferredPreferences(activeOnly?: boolean) {
    const qs = activeOnly !== undefined ? `?active_only=${activeOnly}` : "";
    return request<{ preferences: any[] }>(`/agents/preferences/inferred${qs}`);
  },
  decayPreferences() {
    return request<{ status: string; count: number }>("/agents/preferences/decay", { method: "POST" });
  },
  getPreferenceSummary() {
    return request<{
      preferredSkills: string[];
      avoidedSkills: string[];
      preferredLocations: string[];
      preferredExperienceLevels: string[];
      preferredCertifications: string[];
      learningProgress: number;
      totalSignals: number;
      totalPreferences: number;
    }>("/agents/preferences/summary");
  },
  getConsolidatedProfile() {
    return request<{
      manualPreferences: any[];
      inferredPreferences: any[];
      hiringPatterns: any;
      behavioralSummary: any;
    }>("/agents/preferences/consolidated");
  },
  generateEmbeddings(key?: string, value?: string) {
    return request<{ status: string; count?: number }>("/agents/embeddings/generate", {
      method: "POST",
      body: JSON.stringify({ key, value }),
    });
  },

  // ─── Phase 5B: Observability & Governance ──────────────────────
  recordReasoning(artifact: {
    decisionType: string; agentType: string; targetId?: number; targetType?: string;
    score?: number; confidence: number; reasoning: any[]; inputContext?: any; metadata?: any;
  }) {
    return request<{ id: number; status: string }>("/agents/reasoning/record", {
      method: "POST", body: JSON.stringify(artifact),
    });
  },
  getReasoningLogs(limit?: number, offset?: number) {
    const qs = new URLSearchParams();
    if (limit) qs.set("limit", String(limit));
    if (offset) qs.set("offset", String(offset));
    return request<{ logs: any[]; total: number }>(`/agents/reasoning?${qs.toString()}`);
  },
  getReasoningForTarget(targetId: number, targetType: string) {
    return request<{ logs: any[] }>(`/agents/reasoning/target?targetId=${targetId}&targetType=${targetType}`);
  },
  explainRanking(candidateId: number, jobId: number) {
    return request<{ explanation: any }>(`/agents/reasoning/explain?candidateId=${candidateId}&jobId=${jobId}`);
  },
  submitApproval(actionType: string, confidence: number, aiSuggestion?: any, reasoning?: any[], targetId?: number, targetType?: string) {
    return request<{ id: number; status: string; autoExecuted: boolean }>("/agents/approvals/submit", {
      method: "POST", body: JSON.stringify({ actionType, confidence, aiSuggestion, reasoning, targetId, targetType }),
    });
  },
  approveApproval(id: number) {
    return request<{ status: string }>(`/agents/approvals/${id}/approve`, { method: "POST" });
  },
  rejectApproval(id: number, reason: string) {
    return request<{ status: string }>(`/agents/approvals/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
  },
  getPendingApprovals(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ approvals: any[]; stats: any }>(`/agents/approvals/pending${qs}`);
  },
  getApprovalHistory(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ history: any[] }>(`/agents/approvals/history${qs}`);
  },
  getApprovalStats() {
    return request<any>("/agents/approvals/stats");
  },
  getConfidenceThreshold() {
    return request<{ threshold: number }>("/agents/approvals/threshold");
  },
  setConfidenceThreshold(threshold: number) {
    return request<{ status: string; threshold: number }>("/agents/approvals/threshold", {
      method: "POST", body: JSON.stringify({ threshold }),
    });
  },
  getOverrides(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ overrides: any[]; patterns: any }>(`/agents/overrides${qs}`);
  },
  getBlindSpots() {
    return request<{ blindSpots: any[] }>("/agents/overrides/blind-spots");
  },
  getSafetyFlags(activeOnly?: boolean, severity?: string) {
    const qs = new URLSearchParams();
    if (activeOnly !== undefined) qs.set("active_only", String(activeOnly));
    if (severity) qs.set("severity", severity);
    return request<{ flags: any[]; summary: any }>(`/agents/safety/flags?${qs.toString()}`);
  },
  resolveSafetyFlag(id: number) {
    return request<{ status: string }>(`/agents/safety/flags/${id}/resolve`, { method: "POST" });
  },
  getObservabilityDashboard() {
    return request<any>("/agents/observability/dashboard");
  },
  getAgentHealth() {
    return request<any>("/agents/observability/health");
  },
  getDecisionAnalytics() {
    return request<any>("/agents/observability/decisions");
  },
  getAgentMetrics(agentType?: string, metricName?: string, limit?: number) {
    const qs = new URLSearchParams();
    if (agentType) qs.set("agentType", agentType);
    if (metricName) qs.set("metricName", metricName);
    if (limit) qs.set("limit", String(limit));
    return request<{ metrics: any[] }>(`/agents/observability/metrics?${qs.toString()}`);
  },

  // ─── Phase 6A: Autonomous Sourcing ──────────────────────────────
  getCandidateSources() {
    return request<{ sources: any[] }>("/agents/sources");
  },
  registerSource(name: string, displayName: string, type: string, baseUrl?: string, rateLimitPerHour?: number, config?: any) {
    return request<{ id: number; status: string }>("/agents/sources/register", {
      method: "POST", body: JSON.stringify({ name, displayName, type, baseUrl, rateLimitPerHour, config }),
    });
  },
  toggleSource(id: number, active: boolean) {
    return request<{ status: string }>(`/agents/sources/${id}/toggle`, {
      method: "POST", body: JSON.stringify({ active }),
    });
  },
  initializeSources() {
    return request<{ status: string }>("/agents/sources/initialize", { method: "POST" });
  },
  runDiscovery(sources?: string[], skills?: string[], roles?: string[], locations?: string[]) {
    return request<{ discovered: number; candidates: Array<{ id: number; name: string | null; source: string; score: number }> }>(
      "/agents/discovery/run", { method: "POST", body: JSON.stringify({ sources, skills, roles, locations }) }
    );
  },
  runAiDiscovery(jobId: number, sourceFilter?: string[]) {
    return request<{ discovered: number; candidates: any[] }>("/agents/discovery/ai-generate", {
      method: "POST", body: JSON.stringify({ jobId, sourceFilter }),
    });
  },
  getDiscoveredCandidates(limit?: number, offset?: number, status?: string) {
    const qs = new URLSearchParams();
    if (limit) qs.set("limit", String(limit));
    if (offset) qs.set("offset", String(offset));
    if (status) qs.set("status", status);
    return request<{ candidates: any[]; total: number }>(`/agents/discovery/candidates?${qs.toString()}`);
  },
  enrichCandidate(candidateId: number) {
    return request<any>("/agents/enrichment/run", { method: "POST", body: JSON.stringify({ candidateId }) });
  },
  batchEnrich(candidateIds: number[]) {
    return request<{ enriched: number }>("/agents/enrichment/batch", { method: "POST", body: JSON.stringify({ candidateIds }) });
  },
  getEnrichments(candidateId: number) {
    return request<{ enrichments: any[] }>(`/agents/enrichment/${candidateId}`);
  },
  verifyCandidate(candidateId: number) {
    return request<any>("/agents/verification/run", { method: "POST", body: JSON.stringify({ candidateId }) });
  },
  matchCandidateToJob(candidateId: number, jobId: number) {
    return request<any>("/agents/relevance/match", { method: "POST", body: JSON.stringify({ candidateId, jobId }) });
  },
  findBestMatches(jobId: number, limit?: number) {
    return request<{ matches: any[] }>("/agents/relevance/best-for-job", {
      method: "POST", body: JSON.stringify({ jobId, limit }),
    });
  },
  analyzeIntent(candidateId: number) {
    return request<any>("/agents/intent/analyze", { method: "POST", body: JSON.stringify({ candidateId }) });
  },
  getIntentSummary() {
    return request<{ totalSignals: number; byType: Record<string, number>; relocationSeekers: number; immediateAvailable: number; sponsorshipSeeking: number; emergingTrends: any[] }>("/agents/intent/summary");
  },
  buildGraph(candidateId: number) {
    return request<{ edges: number }>("/agents/graph/build", { method: "POST", body: JSON.stringify({ candidateId }) });
  },
  queryGraph(relationType?: string, relationValue?: string, candidateId?: number, limit?: number) {
    const qs = new URLSearchParams();
    if (relationType) qs.set("relationType", relationType);
    if (relationValue) qs.set("relationValue", relationValue);
    if (candidateId) qs.set("candidateId", String(candidateId));
    if (limit) qs.set("limit", String(limit));
    return request<{ results: any[] }>(`/agents/graph/query?${qs.toString()}`);
  },
  findSimilarCandidates(candidateId: number, limit?: number) {
    const qs = new URLSearchParams();
    qs.set("candidateId", String(candidateId));
    if (limit) qs.set("limit", String(limit));
    return request<{ similar: any[] }>(`/agents/graph/similar?${qs.toString()}`);
  },
  getGraphSummary() {
    return request<{ totalNodes: number; totalEdges: number; topSkills: any[]; topLocations: any[]; topIndustries: any[] }>("/agents/graph/summary");
  },
  runFullSourcingPipeline(jobId: number, sources?: string[], skills?: string[], roles?: string[], locations?: string[], autoReachOut?: boolean) {
    return request<{ discovery: { discovered: number }; enrichment: { enriched: number }; verification: { verified: number }; matching: { matched: number }; outreach: { contacted: number } }>(
      "/agents/pipeline/full-run", { method: "POST", body: JSON.stringify({ jobId, sources, skills, roles, locations, autoReachOut }) }
    );
  },
  getPipelineHistory(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ history: any[] }>(`/agents/pipeline/history${qs}`);
  },
};
