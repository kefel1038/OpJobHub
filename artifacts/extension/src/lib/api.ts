const API_BASE = process.env.PLASMO_PUBLIC_API_URL || "https://op-job-hub.vercel.app/api";

interface CandidateProfile {
  name: string;
  headline: string;
  location: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  profileUrl: string;
  photoUrl?: string;
}

interface MatchResult {
  score: number;
  matchedSkills: string[];
  skillGaps: string[];
  recommendedRole: string;
  reasons: string[];
}

interface SaveResult {
  candidateId: number;
  pipelineId: number;
  status: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { token } = await chrome.storage.local.get("token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function scoreCandidate(profile: CandidateProfile): Promise<MatchResult> {
  return request<MatchResult>("/extension/score-candidate", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function saveCandidate(profile: CandidateProfile, matchScore: number): Promise<SaveResult> {
  return request<SaveResult>("/extension/save-candidate", {
    method: "POST",
    body: JSON.stringify({ profile, matchScore }),
  });
}

export async function checkAuth(): Promise<{ authenticated: boolean; user?: { email: string; role: string } }> {
  try {
    return await request<{ authenticated: boolean; user?: { email: string; role: string } }>("/extension/auth-check");
  } catch {
    return { authenticated: false };
  }
}

export async function getEmployerJobs(): Promise<Array<{ id: number; title: string; skills: string[] }>> {
  return request<Array<{ id: number; title: string; skills: string[] }>>("/extension/employer-jobs");
}
