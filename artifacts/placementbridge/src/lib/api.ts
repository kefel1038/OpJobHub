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
  location: string;
  salary: string | null;
  description: string;
  createdBy: number | null;
  isFeatured: boolean;
  createdAt: string;
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
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof data.error === "string")
        ? data.error
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
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
  listJobs() {
    return request<Job[]>("/jobs");
  },
  getJob(id: number) {
    return request<Job>(`/jobs/${id}`);
  },
  createJob(payload: {
    title: string;
    company: string;
    location: string;
    salary: string;
    description: string;
    isFeatured?: boolean;
  }) {
    return request<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteJob(id: number) {
    return request<{ success: boolean }>(`/jobs/${id}`, { method: "DELETE" });
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
};
