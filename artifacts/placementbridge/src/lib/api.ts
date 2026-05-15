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
  generateSocialContent(jobId: number, platform?: string) {
    return request<{ linkedin: string; twitter: string; whatsapp: string; instagram: string }>(
      "/ai/generate-social-content",
      { method: "POST", body: JSON.stringify({ jobId, platform }) }
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

  // ─── Phase 7: Workforce Knowledge Graph ─────────────────────────
  getGraphStatus() {
    return request<{ connected: boolean; isSyncing: boolean; nodeCounts: Record<string, number> }>("/graph/status");
  },
  syncGraph() {
    return request<{ status: string; counts: any }>("/graph/sync", { method: "POST" });
  },
  syncCandidateGraph(id: number, skills: string[]) {
    return request<{ synced: number }>(`/graph/sync/candidate/${id}`, { method: "POST", body: JSON.stringify({ skills }) });
  },
  runGraphQuery(params: { matchLabels?: string[]; whereConditions?: string[]; returnFields?: string[]; orderBy?: string; limit?: number; params?: any }) {
    return request<{ records: any[] }>("/graph/query", { method: "POST", body: JSON.stringify(params) });
  },
  runRawCypher(query: string, params?: any) {
    return request<{ records: any[]; summary: any }>("/graph/query/cypher", { method: "POST", body: JSON.stringify({ query, params }) });
  },
  findHiddenGems(skills: string[], location?: string, limit?: number) {
    return request<{ gems: any[] }>("/graph/hidden-gems", { method: "POST", body: JSON.stringify({ skills, location, limit }) });
  },
  getSkillAdjacency(skill: string) {
    return request<{ adjacency: any[] }>(`/graph/skill-adjacency?skill=${encodeURIComponent(skill)}`);
  },
  getCareerTransitions(role: string) {
    return request<{ transitions: any[] }>(`/graph/career-transitions?role=${encodeURIComponent(role)}`);
  },
  recommendFromGraph(jobTitle: string, skills: string[], location?: string, limit?: number) {
    return request<{ recommendations: any[] }>("/graph/recommend/job", { method: "POST", body: JSON.stringify({ jobTitle, skills, location, limit }) });
  },
  findHiddenTalent(requiredSkills: string[], adjacentSkills: string[], limit?: number) {
    return request<{ talent: any[] }>("/graph/hidden-talent", { method: "POST", body: JSON.stringify({ requiredSkills, adjacentSkills, limit }) });
  },
  getSimilarHires(candidateId: number | string, limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ similar: any[] }>(`/graph/similar-hires/${candidateId}${qs}`);
  },
  multiHopQuery(params: { skills?: string[]; location?: string; industry?: string; certification?: string; currentEmployer?: string; intentType?: string; minSkills?: number; limit?: number }) {
    return request<{ result: any[] }>("/graph/multi-hop-query", { method: "POST", body: JSON.stringify(params) });
  },
  getMigrationFlows() {
    return request<{ flows: any[] }>("/graph/migration-flows");
  },
  getLaborHotspots() {
    return request<{ hotspots: any[] }>("/graph/labor-hotspots");
  },
  getTalentExportClusters() {
    return request<{ clusters: any[] }>("/graph/talent-export-clusters");
  },
  getGccMigrationAnalysis() {
    return request<{ totalInterested: number; topSourceCountries: string[]; topSkillsDemanded: string[]; sponsorshipRate: number; avgUrgency: number }>("/graph/gcc-migration-analysis");
  },
  getSkillGapByLocation(location: string, industry?: string) {
    const qs = `?location=${encodeURIComponent(location)}${industry ? `&industry=${encodeURIComponent(industry)}` : ""}`;
    return request<any>(`/graph/skill-gap${qs}`);
  },
  getMigrationPathways(from: string, to: string) {
    return request<any>(`/graph/migration-pathways?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  },
  graphRagChat(message: string, skills?: string[], location?: string, industry?: string, depth?: number) {
    return request<{ reply: string; graphContext: string }>("/graph/rag/chat", { method: "POST", body: JSON.stringify({ message, skills, location, industry, depth }) });
  },
  graphRagReason(question: string) {
    return request<{ answer: string; path: string[]; confidence: number }>("/graph/rag/reason", { method: "POST", body: JSON.stringify({ question }) });
  },
  createGraphNode(labels: string[], properties: any) {
    return request<{ status: string }>("/graph/node", { method: "POST", body: JSON.stringify({ labels, properties }) });
  },
  createGraphRelation(type: string, fromLabels: string[], fromMatch: any, toLabels: string[], toMatch: any, properties?: any) {
    return request<{ status: string }>("/graph/relation", { method: "POST", body: JSON.stringify({ type, fromLabels, fromMatch, toLabels, toMatch, properties }) });
  },
  getTalentCluster(skills: string[], limit?: number) {
    return request<{ clusters: any[] }>("/graph/talent-cluster", { method: "POST", body: JSON.stringify({ skills, limit }) });
  },

  // ─── Graph Evolution ──────────────────────────────────────────────
  takeGraphSnapshot() {
    return request<{ status: string; snapshot: any }>("/graph/evolution/snapshot", { method: "POST" });
  },
  getGraphEvolutionHistory(days?: number) {
    const qs = days ? `?days=${days}` : "";
    return request<{ history: any[] }>(`/graph/evolution/history${qs}`);
  },
  getGraphGrowthTrends() {
    return request<{ candidateGrowth: any[]; skillGrowth: any[]; relationshipGrowth: any[] }>("/graph/evolution/trends");
  },
  getGraphHotspotEvolution(days?: number) {
    const qs = days ? `?days=${days}` : "";
    return request<{ hotspots: any[] }>(`/graph/evolution/hotspots${qs}`);
  },
  getLatestGraphSnapshot() {
    return request<{ snapshot: any }>("/graph/evolution/latest");
  },

  // ─── Phase 8: Hiring Simulation Engine ─────────────────────────
  simulateHiringSuccess(params: {
    employerId?: number; candidateId?: number; jobId?: number;
    candidateSkills?: string[]; jobSkills?: string[]; location?: string;
    industry?: string; experienceLevel?: string;
  }) {
    return request<{
      probability: number; confidence: number;
      confidenceIntervalLower: number; confidenceIntervalUpper: number;
      riskFactors: string[]; positiveFactors: string[];
    }>("/simulation/hiring-success", { method: "POST", body: JSON.stringify(params) });
  },
  simulateRetention(params: {
    employerId?: number; candidateId: number; location?: string;
    industry?: string; experienceLevel?: string;
  }) {
    return request<any>("/simulation/retention", { method: "POST", body: JSON.stringify(params) });
  },
  simulateInterviewSuccess(params: { employerId?: number; candidateId: number; jobId?: number }) {
    return request<any>("/simulation/interview-success", { method: "POST", body: JSON.stringify(params) });
  },
  simulateOfferAcceptance(params: {
    employerId?: number; candidateId: number; salary?: number; location?: string;
  }) {
    return request<any>("/simulation/offer-acceptance", { method: "POST", body: JSON.stringify(params) });
  },
  simulateSponsorshipSuccess(params: {
    employerId?: number; candidateId: number; nationality?: string; currentLocation?: string;
  }) {
    return request<any>("/simulation/sponsorship-success", { method: "POST", body: JSON.stringify(params) });
  },
  simulateSkillGapRisk(params: { jobSkills: string[]; candidateSkills: string[]; industry?: string }) {
    return request<any>("/simulation/skill-gap-risk", { method: "POST", body: JSON.stringify(params) });
  },
  simulateAll(params: {
    employerId?: number; candidateId?: number; jobId?: number;
    candidateSkills?: string[]; jobSkills?: string[]; location?: string;
    industry?: string; experienceLevel?: string; salary?: number;
    nationality?: string; currentLocation?: string;
  }) {
    return request<Record<string, any>>("/simulation/all", { method: "POST", body: JSON.stringify(params) });
  },

  // Outcome Learning
  recordSimulationOutcome(simulationId: number, actualOutcome: string, outcomeValue?: number, metadata?: any) {
    return request<{ id: number }>("/simulation/outcomes/record", {
      method: "POST", body: JSON.stringify({ simulationId, actualOutcome, outcomeValue, metadata }),
    });
  },
  getPredictionAccuracy(simulationType?: string, windowDays?: number) {
    const qs = new URLSearchParams();
    if (windowDays) qs.set("windowDays", String(windowDays));
    const path = simulationType ? `/simulation/accuracy/${simulationType}` : "/simulation/accuracy";
    return request<any>(`${path}?${qs.toString()}`);
  },
  getAccuracyHistory(simulationType?: string, limit?: number) {
    const qs = new URLSearchParams();
    if (simulationType) qs.set("simulationType", simulationType);
    if (limit) qs.set("limit", String(limit));
    return request<{ history: any[] }>(`/simulation/accuracy-history?${qs.toString()}`);
  },
  getCalibrationBias(simulationType: string) {
    return request<{ bias: number }>(`/simulation/calibration-bias/${simulationType}`);
  },

  // Simulation Memory
  getSimulationHistory(limit?: number, type?: string) {
    const qs = new URLSearchParams();
    if (limit) qs.set("limit", String(limit));
    if (type) qs.set("type", type);
    return request<{ simulations: any[] }>(`/simulation/history?${qs.toString()}`);
  },
  getAccuracyDrift(simulationType: string, windowDays?: number) {
    const qs = windowDays ? `?windowDays=${windowDays}` : "";
    return request<{
      currentAccuracy: number; previousAccuracy: number; driftAmount: number;
      driftDirection: string; totalPredictions: number; meanCalibrationError: number;
    }>(`/simulation/drift/${simulationType}${qs}`);
  },
  compareAccuracyPeriods(simulationType: string, period1Days?: number, period2Days?: number) {
    const qs = new URLSearchParams();
    qs.set("simulationType", simulationType);
    if (period1Days) qs.set("period1Days", String(period1Days));
    if (period2Days) qs.set("period2Days", String(period2Days));
    return request<any>(`/simulation/compare?${qs.toString()}`);
  },
  getCandidateSimulations(candidateId: number, limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ simulations: any[] }>(`/simulation/candidate/${candidateId}${qs}`);
  },
  getSimulationById(id: number) {
    return request<any>(`/simulation/${id}`);
  },

  // Risk Assessment
  assessChurnRisk(candidateId: number, jobId?: number) {
    return request<{
      riskScore: number; riskLevel: string; contributingFactors: string[];
      mitigationSuggestions: string[];
    }>("/simulation/risk/churn", { method: "POST", body: JSON.stringify({ candidateId, jobId }) });
  },
  assessMismatchRisk(candidateId: number, jobSkills?: string[], candidateSkills?: string[], jobId?: number) {
    return request<any>("/simulation/risk/mismatch", {
      method: "POST", body: JSON.stringify({ candidateId, jobSkills, candidateSkills, jobId }),
    });
  },
  assessSponsorshipFailureRisk(candidateId: number, jobId?: number) {
    return request<any>("/simulation/risk/sponsorship", {
      method: "POST", body: JSON.stringify({ candidateId, jobId }),
    });
  },
  assessFraudRisk(candidateId: number, jobId?: number) {
    return request<any>("/simulation/risk/fraud", {
      method: "POST", body: JSON.stringify({ candidateId, jobId }),
    });
  },
  assessSkillObsolescenceRisk(candidateId: number, industry?: string, jobId?: number) {
    return request<any>("/simulation/risk/skill-obsolescence", {
      method: "POST", body: JSON.stringify({ candidateId, industry, jobId }),
    });
  },
  assessMigrationInstabilityRisk(candidateId: number, jobId?: number) {
    return request<any>("/simulation/risk/migration-instability", {
      method: "POST", body: JSON.stringify({ candidateId, jobId }),
    });
  },
  assessAllRisks(candidateId: number, jobId?: number, jobSkills?: string[], candidateSkills?: string[]) {
    return request<Record<string, any>>("/simulation/risk/all", {
      method: "POST", body: JSON.stringify({ candidateId, jobId, jobSkills, candidateSkills }),
    });
  },

  // Scenario Analysis
  runSalaryScenario(candidateId: number, currentSalary: number, proposedSalary: number, location?: string) {
    return request<any>("/simulation/scenario/salary", {
      method: "POST", body: JSON.stringify({ candidateId, currentSalary, proposedSalary, location }),
    });
  },
  runLocationScenario(candidateId: number, currentLocation: string, proposedLocation: string) {
    return request<any>("/simulation/scenario/location", {
      method: "POST", body: JSON.stringify({ candidateId, currentLocation, proposedLocation }),
    });
  },
  runSkillsScenario(candidateId: number, currentSkills: string[], additionalSkills: string[], jobSkills: string[], industry?: string) {
    return request<any>("/simulation/scenario/skills", {
      method: "POST", body: JSON.stringify({ candidateId, currentSkills, additionalSkills, jobSkills, industry }),
    });
  },
  runCustomScenario(params: {
    name: string; description?: string; simulationParams: any; modifiedParams: any; simulationType: string;
  }) {
    return request<any>("/simulation/scenario/custom", {
      method: "POST", body: JSON.stringify(params),
    });
  },
  getScenarioHistory(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ scenarios: any[] }>(`/simulation/scenarios${qs}`);
  },
  getScenarioById(id: number) {
    return request<any>(`/simulation/scenario/${id}`);
  },
  getScenarioStats() {
    return request<{ totalScenarios: number; byType: Record<string, number>; averageImprovement: number }>("/simulation/scenario-stats");
  },

  // ─── Phase 9A: Labor Market Intelligence ───────────────────────
  refreshLaborIntelligence(windowDays?: number) {
    const qs = windowDays ? `?windowDays=${windowDays}` : "";
    return request<{
      demandIntelligence: any[]; supplyIntelligence: any[]; workforceFlows: Record<string, any>;
      skillEconomy: any[]; topEmployers: any[]; regionalProfiles: any[];
      ecosystemHealth: any; snapshotTimestamp: string;
    }>(`/labor/refresh${qs}`, { method: "POST" });
  },
  getLaborSummary(windowDays?: number) {
    const qs = windowDays ? `?windowDays=${windowDays}` : "";
    return request<any>(`/labor/summary${qs}`);
  },
  getLaborDemand(windowDays?: number) {
    const qs = windowDays ? `?windowDays=${windowDays}` : "";
    return request<{ demand: any[] }>(`/labor/demand${qs}`);
  },
  getLaborSupply(windowDays?: number) {
    const qs = windowDays ? `?windowDays=${windowDays}` : "";
    return request<{ supply: any[] }>(`/labor/supply${qs}`);
  },
  getWorkforceFlows(flowType?: string, limit?: number) {
    const qs = new URLSearchParams();
    if (flowType) qs.set("flowType", flowType);
    if (limit) qs.set("limit", String(limit));
    return request<any>(`/labor/flows?${qs.toString()}`);
  },
  refreshWorkforceFlows(windowDays?: number) {
    const qs = windowDays ? `?windowDays=${windowDays}` : "";
    return request<any>(`/labor/flows/refresh${qs}`, { method: "POST" });
  },
  getSkillTrends(trendType?: string, limit?: number, region?: string, industry?: string) {
    const qs = new URLSearchParams();
    if (trendType) qs.set("trendType", trendType);
    if (limit) qs.set("limit", String(limit));
    if (region) qs.set("region", region);
    if (industry) qs.set("industry", industry);
    return request<{ skills: any[] }>(`/labor/skills?${qs.toString()}`);
  },
  getSkillEconomySummary() {
    return request<{ rising: number; declining: number; emerging: number; total: number; topRising: string[]; topDeclining: string[] }>("/labor/skills/summary");
  },
  getSkillDetail(skillName: string) {
    return request<any>(`/labor/skills/${encodeURIComponent(skillName)}`);
  },
  refreshSkillEconomy(windowDays?: number) {
    const qs = windowDays ? `?windowDays=${windowDays}` : "";
    return request<{ skills: any[]; count: number }>(`/labor/skills/refresh${qs}`, { method: "POST" });
  },
  getTopEmployers(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ employers: any[] }>(`/labor/employers${qs}`);
  },
  getEmployerIntelligence(employerId: number, windowDays?: number) {
    const qs = windowDays ? `?windowDays=${windowDays}` : "";
    return request<any>(`/labor/employers/${employerId}${qs}`);
  },
  getEmployerMetrics(employerId: number, limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ metrics: any[] }>(`/labor/employers/${employerId}/metrics${qs}`);
  },
  getRegionalSnapshots(region?: string, limit?: number) {
    const qs = new URLSearchParams();
    if (region) qs.set("region", region);
    if (limit) qs.set("limit", String(limit));
    return request<{ regions: any[] }>(`/labor/regions?${qs.toString()}`);
  },
  getRegionalProfile(region: string) {
    return request<any>(`/labor/regions/${encodeURIComponent(region)}`);
  },
  getEcosystemHealth() {
    return request<{
      overallHealth: number; marketEfficiency: number; laborMobility: number;
      skillAdaptability: number; employerConfidence: number; migrationActivity: number;
    }>("/labor/ecosystem/health");
  },
  getLaborMetrics(metricType?: string, region?: string, limit?: number) {
    const qs = new URLSearchParams();
    if (metricType) qs.set("metricType", metricType);
    if (region) qs.set("region", region);
    if (limit) qs.set("limit", String(limit));
    return request<{ metrics: any[] }>(`/labor/metrics?${qs.toString()}`);
  },

  // ─── Migration Intelligence (Phase 9B) ────────────────────────

  analyzeCorridor(source: string, destination: string) {
    return request<any>("/migration/corridor/analyze", {
      method: "POST",
      body: JSON.stringify({ source, destination }),
    });
  },
  analyzeAllCorridors() {
    return request<{ corridors: any[]; count: number }>("/migration/corridors/analyze-all", { method: "POST" });
  },
  getTopCorridors(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ corridors: any[] }>(`/migration/corridors/top${qs}`);
  },
  getCorridorHistory(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ history: any[] }>(`/migration/corridors/history${qs}`);
  },
  getCorridorByRoute(source: string, destination: string) {
    return request<any>(`/migration/corridor?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`);
  },
  recordMigrationEvent(event: { candidateId: number; eventType: string; sourceCountry?: string; destinationCountry?: string; employerId?: number; jobId?: number; outcome?: string; metadata?: Record<string, unknown> }) {
    return request<{ id: number }>("/migration/events", {
      method: "POST",
      body: JSON.stringify(event),
    });
  },
  getMigrationEvents(candidateId?: number, employerId?: number, limit?: number) {
    const qs = new URLSearchParams();
    if (candidateId) qs.set("candidateId", String(candidateId));
    if (employerId) qs.set("employerId", String(employerId));
    if (limit) qs.set("limit", String(limit));
    return request<{ events: any[] }>(`/migration/events?${qs.toString()}`);
  },
  getMigrationStats() {
    return request<{ totalEvents: number; totalCorridors: number; averageHealthScore: number; topDestination: string; topSource: string }>("/migration/stats");
  },

  analyzeEmployerSponsorship(employerId?: number) {
    return request<any>("/migration/sponsorship/analyze", {
      method: "POST",
      body: JSON.stringify({ employerId }),
    });
  },
  getSponsorshipSummary() {
    return request<any>("/migration/sponsorship/summary");
  },
  recordSponsorshipOutcome(params: { candidateId: number; jobId?: number; nationality?: string; destinationCountry?: string; visaType?: string; status: string; processingDays?: number; sponsorCost?: number; retentionDays?: number; salaryAtSponsorship?: number; currentSalary?: number; metadata?: Record<string, unknown> }) {
    return request<{ id: number }>("/migration/sponsorship/record", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
  getEmployerSponsorshipHistory(employerId: number, limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ history: any[] }>(`/migration/sponsorship/history/${employerId}${qs}`);
  },
  getRoleSponsorshipLikelihood(role: string) {
    return request<{ role: string; sponsorshipLikelihood: number }>(`/migration/sponsorship/role/${encodeURIComponent(role)}`);
  },
  getNationalitySponsorshipRate(nationality: string) {
    return request<{ nationality: string; approvalRate: number }>(`/migration/sponsorship/nationality/${encodeURIComponent(nationality)}`);
  },

  assessCandidateStability(candidateId: number, destinationCountry?: string) {
    return request<any>(`/migration/stability/assess/${candidateId}`, {
      method: "POST",
      body: JSON.stringify({ destinationCountry }),
    });
  },
  getRelocationProfile(candidateId: number) {
    return request<any>(`/migration/stability/profile/${candidateId}`);
  },
  getStabilityAssessments(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ assessments: any[] }>(`/migration/stability/assessments${qs}`);
  },

  assessCorridorHealth(source: string, destination: string) {
    return request<any>(`/migration/health/${encodeURIComponent(source)}/${encodeURIComponent(destination)}`);
  },
  getAllCorridorHealths() {
    return request<{ corridors: any[]; count: number }>("/migration/health/all");
  },

  assessCorridorInstability(source: string, destination: string) {
    return request<any>("/migration/risk/corridor-instability", {
      method: "POST",
      body: JSON.stringify({ source, destination }),
    });
  },
  assessSponsorshipFraud(employerId?: number) {
    return request<any>("/migration/risk/sponsorship-fraud", {
      method: "POST",
      body: JSON.stringify({ employerId }),
    });
  },
  assessHighChurnCorridor(source: string, destination: string) {
    return request<any>("/migration/risk/high-churn", {
      method: "POST",
      body: JSON.stringify({ source, destination }),
    });
  },
  assessVisaRejectionRisk(nationality: string, destinationCountry: string) {
    return request<any>("/migration/risk/visa-rejection", {
      method: "POST",
      body: JSON.stringify({ nationality, destinationCountry }),
    });
  },
  getActiveMigrationRisks(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ risks: any[] }>(`/migration/risk/active${qs}`);
  },
  resolveMigrationRisk(id: number) {
    return request<{ success: boolean }>(`/migration/risk/resolve/${id}`, { method: "POST" });
  },

  // ─── Forecasting Engine (Phase 9C) ─────────────────────────

  refreshForecasts(horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<any>(`/forecast/refresh${qs}`, { method: "POST" });
  },
  getForecastSummary(horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<any>(`/forecast/summary${qs}`);
  },
  getDemandForecasts(horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<{ forecasts: any[] }>(`/forecast/demand${qs}`);
  },
  getRoleForecast(role: string, horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<any>(`/forecast/demand/role/${encodeURIComponent(role)}${qs}`);
  },
  getIndustryForecast(industry: string, region?: string, horizon?: string) {
    const qs = new URLSearchParams();
    if (region) qs.set("region", region);
    if (horizon) qs.set("horizon", horizon);
    const qstr = qs.toString();
    return request<any>(`/forecast/demand/industry/${encodeURIComponent(industry)}${qstr ? `?${qstr}` : ""}`);
  },
  getRegionalDemandForecast(region: string, horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<any>(`/forecast/demand/region/${encodeURIComponent(region)}${qs}`);
  },
  getShortageForecast(role: string, region?: string, horizon?: string) {
    const qs = new URLSearchParams();
    if (region) qs.set("region", region);
    if (horizon) qs.set("horizon", horizon);
    const qstr = qs.toString();
    return request<any>(`/forecast/shortage/${encodeURIComponent(role)}${qstr ? `?${qstr}` : ""}`);
  },
  getWageForecast(role: string, region?: string, horizon?: string) {
    const qs = new URLSearchParams();
    if (region) qs.set("region", region);
    if (horizon) qs.set("horizon", horizon);
    const qstr = qs.toString();
    return request<any>(`/forecast/wage/${encodeURIComponent(role)}${qstr ? `?${qstr}` : ""}`);
  },
  getEmployerDemandForecast(employerId: number, horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<any>(`/forecast/demand/employer/${employerId}${qs}`);
  },
  getSkillForecasts(horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<{ forecasts: any[] }>(`/forecast/skills${qs}`);
  },
  getEmergingSkills(horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<{ skills: any[] }>(`/forecast/skills/emerging${qs}`);
  },
  getDecliningSkills(horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<{ skills: any[] }>(`/forecast/skills/declining${qs}`);
  },
  getSkillForecast(skillName: string, horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<any>(`/forecast/skills/${encodeURIComponent(skillName)}${qs}`);
  },
  getMigrationForecasts(horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<{ forecasts: any[] }>(`/forecast/migration${qs}`);
  },
  getCorridorForecast(source: string, destination: string, horizon?: string) {
    const qs = new URLSearchParams({ source, destination });
    if (horizon) qs.set("horizon", horizon);
    return request<any>(`/forecast/migration/corridor?${qs.toString()}`);
  },
  getCorridorVolumeForecast(source: string, destination: string, horizon?: string) {
    const qs = new URLSearchParams({ source, destination });
    if (horizon) qs.set("horizon", horizon);
    return request<any>(`/forecast/migration/volume?${qs.toString()}`);
  },
  getSponsorshipDemandForecast(source: string, destination: string, horizon?: string) {
    const qs = new URLSearchParams({ source, destination });
    if (horizon) qs.set("horizon", horizon);
    return request<any>(`/forecast/migration/sponsorship?${qs.toString()}`);
  },
  getRiskForecasts(horizon?: string) {
    const qs = horizon ? `?horizon=${horizon}` : "";
    return request<{ forecasts: any[] }>(`/forecast/risks${qs}`);
  },
  getShortageRiskForecast(role: string, region?: string, horizon?: string) {
    const qs = new URLSearchParams();
    if (region) qs.set("region", region);
    if (horizon) qs.set("horizon", horizon);
    const qstr = qs.toString();
    return request<any>(`/forecast/risks/shortage/${encodeURIComponent(role)}${qstr ? `?${qstr}` : ""}`);
  },
  getChurnRiskForecast(industry?: string, region?: string, horizon?: string) {
    const qs = new URLSearchParams();
    if (industry) qs.set("industry", industry);
    if (region) qs.set("region", region);
    if (horizon) qs.set("horizon", horizon);
    const qstr = qs.toString();
    return request<any>(`/forecast/risks/churn${qstr ? `?${qstr}` : ""}`);
  },
  getCorridorInstabilityRisk(source: string, destination: string, horizon?: string) {
    const qs = new URLSearchParams({ source, destination });
    if (horizon) qs.set("horizon", horizon);
    return request<any>(`/forecast/risks/instability?${qs.toString()}`);
  },
  getSponsorshipBottleneckRisk(nationality: string, destination: string, horizon?: string) {
    const qs = new URLSearchParams({ nationality, destination });
    if (horizon) qs.set("horizon", horizon);
    return request<any>(`/forecast/risks/bottleneck?${qs.toString()}`);
  },
  getSaturationRiskForecast(role: string, region?: string, horizon?: string) {
    const qs = new URLSearchParams();
    if (region) qs.set("region", region);
    if (horizon) qs.set("horizon", horizon);
    const qstr = qs.toString();
    return request<any>(`/forecast/risks/saturation/${encodeURIComponent(role)}${qstr ? `?${qstr}` : ""}`);
  },
  getForecastCalibrations() {
    return request<{ calibrations: any[] }>("/forecast/calibrations");
  },
  getForecastCalibration(type: string) {
    return request<any>(`/forecast/calibrations/${encodeURIComponent(type)}`);
  },
  recordForecastAccuracy(params: { forecastType: string; forecastId?: number; predictedValue: number; actualValue: number; forecastHorizon?: string; region?: string; industry?: string }) {
    return request<{ success: boolean }>("/forecast/accuracy/record", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
  getForecastAccuracyHistory(forecastType?: string, limit?: number) {
    const qs = new URLSearchParams();
    if (forecastType) qs.set("forecastType", forecastType);
    if (limit) qs.set("limit", String(limit));
    const qstr = qs.toString();
    return request<{ history: any[] }>(`/forecast/accuracy/history${qstr ? `?${qstr}` : ""}`);
  },
  getForecastHistory(forecastType?: string, limit?: number) {
    const qs = new URLSearchParams();
    if (forecastType) qs.set("forecastType", forecastType);
    if (limit) qs.set("limit", String(limit));
    const qstr = qs.toString();
    return request<{ history: any[] }>(`/forecast/history${qstr ? `?${qstr}` : ""}`);
  },
  getSkillForecastHistory(skillName?: string, limit?: number) {
    const qs = new URLSearchParams();
    if (skillName) qs.set("skill", skillName);
    if (limit) qs.set("limit", String(limit));
    const qstr = qs.toString();
    return request<{ history: any[] }>(`/forecast/history/skills${qstr ? `?${qstr}` : ""}`);
  },
  getMigrationForecastHistory(forecastType?: string, limit?: number) {
    const qs = new URLSearchParams();
    if (forecastType) qs.set("forecastType", forecastType);
    if (limit) qs.set("limit", String(limit));
    const qstr = qs.toString();
    return request<{ history: any[] }>(`/forecast/history/migration${qstr ? `?${qstr}` : ""}`);
  },

  // ─── Workforce Orchestration (Phase 10A) ─────────────────────

  runOrchestration() {
    return request<any>("/orchestrate/run", { method: "POST" });
  },
  getOrchestrationSummary() {
    return request<any>("/orchestrate/summary");
  },
  getEcosystemAlerts(activeOnly?: boolean, limit?: number) {
    const qs = new URLSearchParams();
    if (activeOnly !== undefined) qs.set("activeOnly", String(activeOnly));
    if (limit) qs.set("limit", String(limit));
    const qstr = qs.toString();
    return request<{ alerts: any[] }>(`/orchestrate/alerts${qstr ? `?${qstr}` : ""}`);
  },
  resolveEcosystemAlert(id: number) {
    return request<{ success: boolean }>(`/orchestrate/alerts/${id}/resolve`, { method: "POST" });
  },
  getOrchestratorActions(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ actions: any[] }>(`/orchestrate/actions${qs}`);
  },
  getMarketBalances() {
    return request<{ balances: any[] }>("/orchestrate/balance");
  },
  getRoleMarketBalance(role: string, region?: string) {
    const qs = region ? `?region=${encodeURIComponent(region)}` : "";
    return request<any>(`/orchestrate/balance/role/${encodeURIComponent(role)}${qs}`);
  },
  getCorridorMarketBalance(source: string, destination: string) {
    const qs = new URLSearchParams({ source, destination });
    return request<any>(`/orchestrate/balance/corridor?${qs.toString()}`);
  },
  getMarketBalanceHistory(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ history: any[] }>(`/orchestrate/balance/history${qs}`);
  },
  getInterventions(limit?: number, status?: string) {
    const qs = new URLSearchParams();
    if (limit) qs.set("limit", String(limit));
    if (status) qs.set("status", status);
    const qstr = qs.toString();
    return request<{ interventions: any[] }>(`/orchestrate/interventions${qstr ? `?${qstr}` : ""}`);
  },
  getInterventionById(id: number) {
    return request<any>(`/orchestrate/interventions/${id}`);
  },
  updateInterventionStatus(id: number, status: string) {
    return request<{ success: boolean }>(`/orchestrate/interventions/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },
  createDigitalTwin(params: { name: string; description?: string; modelType: string; targetType?: string; targetId?: string; configuration?: Record<string, unknown> }) {
    return request<{ id: number }>("/orchestrate/twin/create", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
  simulateDigitalTwin(id: number, scenarioParams?: Record<string, unknown>) {
    return request<any>(`/orchestrate/twin/${id}/simulate`, {
      method: "POST",
      body: JSON.stringify({ scenarioParams }),
    });
  },
  simulateEcosystem(params: { demandShift?: number; supplyShift?: number; migrationImpact?: number; sponsorshipChange?: number; wageGrowth?: number; automationImpact?: number; horizon?: string }) {
    return request<any>("/orchestrate/twin/simulate-ecosystem", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
  getDigitalTwinModels(modelType?: string) {
    const qs = modelType ? `?modelType=${modelType}` : "";
    return request<{ models: any[] }>(`/orchestrate/twin/models${qs}`);
  },
  getDigitalTwinModel(id: number) {
    return request<any>(`/orchestrate/twin/models/${id}`);
  },
  getUpskillingPathways(skill: string) {
    return request<{ pathways: any[] }>(`/orchestrate/upskilling/pathways/${encodeURIComponent(skill)}`);
  },
  getUpskillingRecommendations(candidateId?: number, limit?: number) {
    const qs = new URLSearchParams();
    if (candidateId) qs.set("candidateId", String(candidateId));
    if (limit) qs.set("limit", String(limit));
    const qstr = qs.toString();
    return candidateId
      ? request<any>(`/orchestrate/upskilling/recommendations/${candidateId}${qstr ? `?${qstr}` : ""}`)
      : request<{ recommendations: any[] }>(`/orchestrate/upskilling/recommendations${qstr ? `?${qstr}` : ""}`);
  },
  getCertificationRecommendations(skill: string) {
    return request<{ certifications: any[] }>(`/orchestrate/upskilling/certifications/${encodeURIComponent(skill)}`);
  },
  recordEconomicSignal(params: { signalType: string; signalName: string; signalValue: number; previousValue?: number; region?: string; industry?: string; source?: string; confidence?: number; impact?: string }) {
    return request<{ id: number }>("/orchestrate/signals/record", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
  getEconomicSignals(signalType?: string, limit?: number) {
    const qs = new URLSearchParams();
    if (signalType) qs.set("signalType", signalType);
    if (limit) qs.set("limit", String(limit));
    const qstr = qs.toString();
    return request<{ signals: any[] }>(`/orchestrate/signals${qstr ? `?${qstr}` : ""}`);
  },
  getEconomicSignalImpact(id: number) {
    return request<any>(`/orchestrate/signals/impact/${id}`);
  },
  getActiveEconomicImpacts(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ impacts: any[] }>(`/orchestrate/signals/impacts${qs}`);
  },
  getMacroEconomicOutlook() {
    return request<any>("/orchestrate/signals/outlook");
  },

  // ─── Enterprise Infrastructure API ──────────────────────

  getEnterpriseTenants(activeOnly?: boolean) {
    const qs = activeOnly !== undefined ? `?activeOnly=${activeOnly}` : "";
    return request<{ tenants: any[] }>(`/enterprise/tenants${qs}`);
  },
  getEnterpriseTenant(id: number) {
    return request<any>(`/enterprise/tenants/${id}`);
  },
  createEnterpriseTenant(params: { name: string; slug: string; tenantType: string; industry?: string; region?: string; size?: string; contactName?: string; contactEmail?: string; domain?: string; features?: Record<string, unknown> }) {
    return request<any>("/enterprise/tenants", { method: "POST", body: JSON.stringify(params) });
  },
  updateEnterpriseTenant(id: number, params: Record<string, unknown>) {
    return request<any>(`/enterprise/tenants/${id}`, { method: "PUT", body: JSON.stringify(params) });
  },
  getEnterpriseStats() {
    return request<any>("/enterprise/stats");
  },
  createEnterpriseApiKey(tenantId: number, name: string, permissions?: string[], rateLimitTier?: string, expiresAt?: string) {
    return request<{ apiKey: any; rawKey: string }>("/enterprise/api-keys", {
      method: "POST", body: JSON.stringify({ tenantId, name, permissions, rateLimitTier, expiresAt }),
    });
  },
  getEnterpriseApiKeys(tenantId: number) {
    return request<{ keys: any[] }>(`/enterprise/api-keys/${tenantId}`);
  },
  revokeEnterpriseApiKey(id: number, tenantId: number) {
    return request<{ success: boolean }>(`/enterprise/api-keys/${id}/revoke`, {
      method: "POST", body: JSON.stringify({ tenantId }),
    });
  },
  getEnterpriseQuotas(tenantId: number) {
    return request<{ quotas: any[] }>(`/enterprise/quotas/${tenantId}`);
  },
  getEnterpriseAuditLog(tenantId: number, limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ log: any[] }>(`/enterprise/audit-log/${tenantId}${qs}`);
  },
  getEnterprisePartners(partnerType?: string, region?: string, activeOnly?: boolean, limit?: number) {
    const qs = new URLSearchParams();
    if (partnerType) qs.set("partnerType", partnerType);
    if (region) qs.set("region", region);
    if (activeOnly !== undefined) qs.set("activeOnly", String(activeOnly));
    if (limit) qs.set("limit", String(limit));
    const qstr = qs.toString();
    return request<{ partners: any[] }>(`/enterprise/partners${qstr ? `?${qstr}` : ""}`);
  },
  getEnterprisePartnerStats() {
    return request<any>("/enterprise/partners/stats");
  },
  getEnterprisePartner(id: number) {
    return request<any>(`/enterprise/partners/${id}`);
  },
  registerEnterprisePartner(params: { partnerType: string; organizationName: string; slug: string; description?: string; website?: string; region?: string; country?: string; specializations?: string[] }) {
    return request<any>("/enterprise/partners", { method: "POST", body: JSON.stringify(params) });
  },
  verifyEnterprisePartner(id: number) {
    return request<any>(`/enterprise/partners/${id}/verify`, { method: "POST" });
  },
  getEnterpriseIntegrations(partnerId: number) {
    return request<{ integrations: any[] }>(`/enterprise/integrations/${partnerId}`);
  },
  createEnterpriseIntegration(params: { partnerId: number; integrationType: string; name: string; configuration?: Record<string, unknown>; tenantId?: number }) {
    return request<any>("/enterprise/integrations", { method: "POST", body: JSON.stringify(params) });
  },
  getEnterpriseSignalSubscriptions(tenantId: number, activeOnly?: boolean) {
    const qs = activeOnly !== undefined ? `?activeOnly=${activeOnly}` : "";
    return request<{ subscriptions: any[] }>(`/enterprise/signal-subscriptions/${tenantId}${qs}`);
  },
  createEnterpriseSignalSubscription(params: { tenantId: number; signalType: string; channel?: string; endpoint?: string; filters?: Record<string, unknown>; throttleSeconds?: number }) {
    return request<any>("/enterprise/signal-subscriptions", { method: "POST", body: JSON.stringify(params) });
  },
  triggerSignalDetection() {
    return request<{ events: any[]; count: number }>("/enterprise/signal-subscriptions/detect", { method: "POST" });
  },
};
