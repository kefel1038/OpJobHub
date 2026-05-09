import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  LayoutDashboard, Briefcase, Users, MessageSquare, BarChart3,
  Settings, Bell, Search, Menu, X, Plus,
  Clock, Star, FileText, Eye, CheckCircle2, Plane,
  Calendar, Download, Filter, MoreVertical, TrendingUp,
  UserPlus, Sparkles, ShieldCheck, Globe, DollarSign,
  BrainCircuit, Building2, LogOut, Moon, Sun,
  Loader2, AlertCircle, GripVertical, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api, type Job, type EmployerStats, type Applicant, type AIMatch } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

type TabId = "overview" | "jobs" | "candidates" | "messages" | "analytics" | "team";

const navItems: { id: TabId; label: string; icon: React.ElementType; count?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "candidates", label: "Candidates", icon: Users },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "team", label: "Team", icon: Building2 },
];

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen bg-gray-50 ${darkMode ? "dark" : ""}`}>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-navy-900 text-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center font-bold">
                K
              </div>
              <span className="font-bold text-lg">KeFeL Talent</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {item.label}
                </div>
                {item.count && (
                  <Badge className={`rounded-full px-2 py-0.5 text-xs ${
                    activeTab === item.id
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-white/60"
                  }`}>
                    {item.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                {user?.email?.charAt(0).toUpperCase() || "E"}
              </div>
              <div>
                <div className="text-sm font-medium text-white">Employer</div>
                <div className="text-xs text-white/50 truncate max-w-[120px]">{user?.email || "Not signed in"}</div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link href="/" className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates, jobs..."
                  className="w-80 h-10 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 px-5 text-sm font-semibold shadow-lg shadow-blue-600/20">
                <Link href="/post-job">
                  <Plus className="h-4 w-4 mr-1" />
                  Post a Job
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "jobs" && <JobsTab />}
              {activeTab === "candidates" && <CandidatesTab />}
              {activeTab === "messages" && <MessagesTab />}
              {activeTab === "analytics" && <AnalyticsTab />}
              {activeTab === "team" && <TeamTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState<EmployerStats | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getEmployerStats(),
      api.getEmployerApplicants(5),
    ])
      .then(([s, a]) => {
        setStats(s);
        setApplicants(a);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 rounded-full">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-black text-gray-800">Employer Dashboard</h1>
        <p className="text-gray-500 mt-1">Here's your hiring overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Jobs", value: String(stats?.totalJobs ?? 0), icon: Briefcase, color: "text-blue-600", bgColor: "bg-blue-50" },
          { label: "Total Applicants", value: String(stats?.totalApplicants ?? 0), icon: Users, color: "text-indigo-600", bgColor: "bg-indigo-50" },
          { label: "Interviews This Week", value: String(stats?.interviewsThisWeek ?? 0), icon: Calendar, color: "text-amber-600", bgColor: "bg-amber-50" },
          { label: "Hired This Month", value: String(stats?.hiredThisMonth ?? 0), icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50" },
        ].map((stat) => (
          <Card key={stat.label} className="border-gray-100 card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-black text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="h-5 w-5 text-blue-200" />
                <span className="text-white font-bold">AI Hiring Recommendations</span>
              </div>
              <p className="text-blue-100 text-sm mb-4 max-w-xl">
                Based on your active jobs, we found highly-matched candidates ready for immediate hiring.
              </p>
              <Button asChild className="bg-white text-blue-700 hover:bg-blue-50 rounded-full px-6 h-10 font-semibold shadow-lg">
                <Link href="/ai-matching">
                  <Sparkles className="h-4 w-4 mr-2" />
                  View AI Matches
                </Link>
              </Button>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-black text-white">{stats?.totalApplicants ?? 0}</div>
                <div className="text-xs text-blue-200">Total Applicants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-white">{stats?.hiredThisMonth ?? 0}</div>
                <div className="text-xs text-blue-200">Hired This Month</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">Recent Applicants</h2>
            <Button variant="outline" className="rounded-full text-sm h-9 gap-1">
              <Eye className="h-4 w-4" />
              View All
            </Button>
          </div>

          {applicants.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No applications yet. Post a job to start receiving candidates.
            </div>
          ) : (
            <div className="space-y-3">
              {applicants.map((applicant) => (
                <div key={applicant.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 group hover:bg-gray-50 rounded-xl px-3 -mx-3 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {applicant.applicant?.email?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{applicant.applicant?.email || "Anonymous"}</div>
                      <div className="text-sm text-gray-500">{applicant.jobTitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={
                      applicant.status === "shortlisted" ? "bg-amber-100 text-amber-700 border-amber-200" :
                      applicant.status === "reviewed" ? "bg-blue-100 text-blue-700 border-blue-200" :
                      applicant.status === "applied" ? "bg-gray-100 text-gray-600 border-gray-200" :
                      applicant.status === "interviewed" ? "bg-purple-100 text-purple-700 border-purple-200" :
                      applicant.status === "hired" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      "bg-cyan-100 text-cyan-700 border-cyan-200"
                    }>
                      {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                    </Badge>
                    <span className="text-xs text-gray-400 hidden lg:block">{new Date(applicant.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-100">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Hiring Pipeline</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {["applied", "reviewed", "shortlisted", "interviewed", "hired", "deployed"].map((stage, i) => (
              <div key={stage} className="text-center bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className={`text-2xl font-black mb-1 ${
                  i <= 1 ? "text-blue-600" : i <= 3 ? "text-amber-600" : "text-emerald-600"
                }`}>
                  {stats?.pipeline?.[stage] ?? 0}
                </div>
                <div className="text-xs text-gray-500 font-medium capitalize">{stage}</div>
                <div className={`h-1 rounded-full mt-2 ${
                  i <= 1 ? "bg-blue-500" : i <= 3 ? "bg-amber-500" : "bg-emerald-500"
                }`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Jobs Tab ─────────────────────────────────────────────────────
function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEmployerJobs()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-black text-gray-800">Job Listings</h1>
          <p className="text-gray-500 mt-1">Manage your active job postings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full h-10 gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 shadow-lg shadow-blue-600/20">
            <Link href="/post-job">
              <Plus className="h-4 w-4 mr-1" />
              New Job
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-2">No jobs posted yet</p>
          <p className="text-sm text-gray-400 mb-4">Post your first job to start receiving applications.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
            <Link href="/post-job">Post a Job</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Job Title", "Status", "Type", "Location", "Created", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{job.title}</div>
                      <div className="text-xs text-gray-400">{job.company}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        job.status === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                        job.status === "draft" ? "bg-gray-100 text-gray-600 border-gray-200" :
                        "bg-amber-100 text-amber-700 border-amber-200"
                      }>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.employmentType || "Full-Time"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{job.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" className="rounded-full h-8">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Candidates Tab (Kanban Pipeline) ─────────────────────────────
const PIPELINE_STAGES = ["applied", "reviewed", "shortlisted", "interviewed", "hired", "deployed"];

const stageLabels: Record<string, string> = {
  applied: "Applied", reviewed: "Reviewed", shortlisted: "Shortlisted",
  interviewed: "Interviewed", hired: "Hired", deployed: "Deployed",
};

const stageColors: Record<string, string> = {
  applied: "bg-gray-100 text-gray-700 border-gray-200",
  reviewed: "bg-blue-100 text-blue-700 border-blue-200",
  shortlisted: "bg-amber-100 text-amber-700 border-amber-200",
  interviewed: "bg-purple-100 text-purple-700 border-purple-200",
  hired: "bg-emerald-100 text-emerald-700 border-emerald-200",
  deployed: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const stageDotColors: Record<string, string> = {
  applied: "bg-gray-400",
  reviewed: "bg-blue-500",
  shortlisted: "bg-amber-500",
  interviewed: "bg-purple-500",
  hired: "bg-emerald-500",
  deployed: "bg-cyan-500",
};

function CandidatesTab() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const dropTargets = useRef<Map<string, HTMLDivElement>>(new Map());

  const fetchApplicants = useCallback(async (limit = 50) => {
    try {
      const data = await api.getEmployerApplicants(limit);
      setApplicants(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

  const handleDragStart = (applicant: Applicant) => {
    setDraggingId(applicant.id);
  };

  const handleDragEnd = async (applicantId: number, newStatus: string) => {
    const prevApplicants = [...applicants];
    setApplicants((prev) =>
      prev.map((a) => (a.id === applicantId ? { ...a, status: newStatus } : a))
    );
    setDraggingId(null);
    setDragOverStage(null);

    try {
      await api.updateApplicationStatus(applicantId, newStatus);
    } catch {
      setApplicants(prevApplicants);
    }
  };

  const onDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const onDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const appId = Number(e.dataTransfer.getData("text/plain"));
    if (appId && draggingId === appId) {
      handleDragEnd(appId, stage);
    }
  };

  const grouped = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = applicants.filter((a) => a.status === stage);
    return acc;
  }, {} as Record<string, Applicant[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-black text-gray-800">
            Candidate Pipeline
          </h1>
          <p className="text-gray-500 mt-1">
            Drag and drop candidates between stages to update their status
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full h-10 gap-2"
            onClick={() => fetchApplicants(50)}
            disabled={loading}
          >
            <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{error}</p>
          <Button
            onClick={() => { setLoading(true); fetchApplicants(); }}
            variant="outline"
            className="mt-4 rounded-full"
          >
            Retry
          </Button>
        </div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No candidates yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Applications will appear here once candidates apply to your jobs.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4">
          {PIPELINE_STAGES.map((stage) => {
            const items = grouped[stage] || [];
            return (
              <div
                key={stage}
                ref={(el) => {
                  if (el) dropTargets.current.set(stage, el);
                  else dropTargets.current.delete(stage);
                }}
                onDragOver={(e) => onDragOver(e, stage)}
                onDrop={(e) => onDrop(e, stage)}
                onDragLeave={() => setDragOverStage(null)}
                className={`flex-shrink-0 w-72 snap-start rounded-2xl border-2 transition-all duration-200 ${
                  dragOverStage === stage
                    ? "border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-200/30"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${stageDotColors[stage]}`} />
                      <h3 className="font-bold text-gray-800 text-sm">
                        {stageLabels[stage]}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                      {items.length}
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-3 min-h-[200px]">
                  <AnimatePresence>
                    {items.map((applicant) => (
                      <motion.div
                        key={applicant.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          transition: { duration: 0.2 },
                        }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        draggable
                        onDragStart={() => handleDragStart(applicant)}
                        onDragEnd={() => {
                          if (draggingId === applicant.id && !dragOverStage) {
                            setDraggingId(null);
                          }
                        }}
                        onDrag={(e) => {
                          // dataTransfer only available in onDragStart/onDrop
                        }}
                        onDragStartCapture={(e) => {
                          e.dataTransfer.setData("text/plain", String(applicant.id));
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className={`bg-white rounded-xl border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
                          draggingId === applicant.id
                            ? "opacity-50 ring-2 ring-blue-400 ring-offset-2"
                            : "border-gray-100"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <GripVertical className="h-4 w-4 text-gray-300 mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {applicant.applicant?.email?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <div className="truncate">
                                <div className="font-semibold text-gray-800 text-sm truncate">
                                  {applicant.applicant?.email?.split("@")[0] || "Anonymous"}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-2">
                              {applicant.jobTitle}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(applicant.createdAt).toLocaleDateString()}
                              </span>
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-[10px] rounded-full bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Profile
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {items.length === 0 && (
                    <div className="text-center py-8">
                      <div className="h-8 w-8 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-2">
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-400">Drop candidates here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Messages Tab ─────────────────────────────────────────────────
function MessagesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-black text-gray-800">Messages</h1>
        <p className="text-gray-500 mt-1">Communicate with candidates</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid md:grid-cols-3 h-[600px]">
          <div className="border-r border-gray-100 overflow-y-auto p-4">
            <p className="text-sm text-gray-400 text-center pt-20">No conversations yet</p>
          </div>
          <div className="col-span-2 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Select a conversation</p>
              <p className="text-sm text-gray-400">Messages from candidates will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────
function AnalyticsTab() {
  const [stats, setStats] = useState<EmployerStats | null>(null);

  useEffect(() => {
    api.getEmployerStats().then(setStats).catch(() => {});
  }, []);

  const pipelineEntries = stats?.pipeline ? Object.entries(stats.pipeline) : [];
  const totalPipeline = pipelineEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-black text-gray-800">Recruitment Analytics</h1>
        <p className="text-gray-500 mt-1">Track your hiring performance</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Hiring Funnel
            </h3>
            {totalPipeline === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data yet. Start posting jobs to see your hiring funnel.</p>
            ) : (
              <div className="space-y-4">
                {pipelineEntries.map(([stage, count]) => {
                  const pct = totalPipeline > 0 ? Math.round((count / totalPipeline) * 100) : 0;
                  return (
                    <div key={stage}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 capitalize">{stage}</span>
                        <span className="font-semibold text-gray-800">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Key Metrics
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Active Jobs", value: stats?.totalJobs ?? 0 },
                { label: "Total Applicants", value: stats?.totalApplicants ?? 0 },
                { label: "Interviews This Week", value: stats?.interviewsThisWeek ?? 0 },
                { label: "Hired This Month", value: stats?.hiredThisMonth ?? 0 },
              ].map((m) => (
                <div key={m.label} className="text-center p-4 bg-gray-50 rounded-2xl">
                  <div className="text-2xl font-black text-gray-800">{m.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────
function TeamTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-black text-gray-800">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage your recruitment team</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 shadow-lg shadow-blue-600/20 gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card className="border-gray-100">
        <CardContent className="p-6">
          <p className="text-sm text-gray-400 text-center py-12">
            Team management is available on the Professional and Enterprise plans.
            <br />
            <Button variant="outline" className="mt-4 rounded-full" asChild>
              <Link href="/pricing">Upgrade to Professional</Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
