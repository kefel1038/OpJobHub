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
  Loader2, AlertCircle, GripVertical, ArrowRight,
  Bot, Play, Square, Cpu, History, Activity, RotateCcw,
  Radio, GitBranch, Network, Shield, MapIcon, Target, MapPin,
  Share2, GitFork, Route, Compass, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api, type Job, type EmployerStats, type Applicant, type AIMatch } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import FollowUpPanel from "@/components/employers/FollowUpPanel";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar
} from 'recharts';

type TabId = "overview" | "jobs" | "candidates" | "messages" | "analytics" | "team" | "agents" | "observability" | "sourcing" | "knowledge-graph" | "predictive" | "labor" | "migration";

const navItems: { id: TabId; label: string; icon: React.ElementType; count?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "candidates", label: "Candidates", icon: Users },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "team", label: "Team", icon: Building2 },
  { id: "agents", label: "AI Agents", icon: Bot },
  { id: "observability", label: "Observability", icon: ShieldCheck },
  { id: "sourcing", label: "Sourcing", icon: Radio },
  { id: "knowledge-graph", label: "Knowledge Graph", icon: GitBranch },
  { id: "predictive", label: "Predictive AI", icon: BrainCircuit },
  { id: "labor", label: "Labor Intel", icon: Globe },
  { id: "migration", label: "Migration", icon: Network },
];

export default function EmployerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Default to dark for premium feel

  // Role-based protection
  useEffect(() => {
    if (isAuthenticated && user?.role !== "employer" && user?.role !== "admin") {
      window.location.href = "/";
    }
  }, [user, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-center space-y-6 max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/20">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
          <p className="text-white/60">Please sign in with an employer account to access the dashboard.</p>
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

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

      <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-[#0a0c10] border-r border-white/5 text-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-600/20">
                K
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tight leading-none text-white">KeFeL</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Talent OS</span>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    activeTab === item.id
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 transition-colors ${activeTab === item.id ? "text-white" : "text-white/30 group-hover:text-white"}`} />
                    {item.label}
                  </div>
                  {item.count && (
                    <Badge className={`rounded-full px-2 py-0.5 text-[10px] border-none ${
                      activeTab === item.id
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/40"
                    }`}>
                      {item.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10] to-transparent">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white/10 shadow-inner">
                {user?.email?.charAt(0).toUpperCase() || "E"}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">Employer Portal</div>
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{user?.email?.split('@')[0] || "Team Member"}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className={`lg:pl-72 min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#050608] text-white" : "bg-gray-50 text-gray-900"}`}>
        <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors duration-300 ${
          darkMode ? "bg-[#050608]/80 border-white/5" : "bg-white/80 border-gray-100"
        }`}>
          <div className="flex items-center justify-between px-6 lg:px-10 h-20">
            <div className="flex items-center gap-6">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-white/60">
                <Menu className="h-6 w-6" />
              </button>
              <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search applicants, jobs, analytics..."
                  className={`w-96 h-12 pl-12 pr-4 rounded-2xl transition-all duration-200 border text-sm focus:outline-none focus:ring-4 ${
                    darkMode 
                      ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-blue-500/10 focus:border-blue-500/50" 
                      : "bg-gray-100 border-transparent text-gray-900 placeholder:text-gray-400 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600/20"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-3 rounded-2xl hover:bg-white/5 transition-colors">
                <Bell className="h-5 w-5 text-white/60" />
                <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-[#050608]" />
              </button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-6 text-sm font-bold shadow-xl shadow-blue-600/20 border-t border-white/10">
                <Link href="/post-job">
                  <Plus className="h-4 w-4 mr-2" />
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
              {activeTab === "overview" && <OverviewTab onTabChange={setActiveTab} />}
              {activeTab === "jobs" && <JobsTab />}
              {activeTab === "candidates" && <CandidatesTab />}
              {activeTab === "messages" && <MessagesTab />}
              {activeTab === "analytics" && <AnalyticsTab />}
              {activeTab === "team" && <TeamTab />}
              {activeTab === "agents" && <AgentsTab />}
              {activeTab === "observability" && <ObservabilityTab />}
              {activeTab === "sourcing" && <SourcingTab />}
              {activeTab === "knowledge-graph" && <KnowledgeGraphTab />}
              {activeTab === "predictive" && <PredictiveIntelligenceTab />}
              {activeTab === "labor" && <LaborIntelligenceTab />}
              {activeTab === "migration" && <MigrationIntelligenceTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────
function OverviewTab({ onTabChange }: { onTabChange: (tab: TabId) => void }) {
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
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Failed to load dashboard</h3>
        <p className="text-white/40 mt-1">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-6 rounded-xl border-white/10 hover:bg-white/5">
          <RotateCcw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Command Center</h1>
          <p className="text-white/40 mt-2 font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            Verified Employer Account • {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM ACTIVE
            </div>
            <Separator orientation="vertical" className="h-4 bg-white/10" />
            <div className="text-white/40 uppercase tracking-widest">v2.4.0</div>
          </div>
        </div>
      </div>

      {/* Row 1 — Core Hiring KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Jobs", value: stats?.totalJobs ?? 0, icon: Briefcase, color: "text-blue-500", trend: "+2 this month" },
          { label: "Total Applicants", value: stats?.totalApplicants ?? 0, icon: Users, color: "text-indigo-500", trend: "+48 new" },
          { label: "Shortlisted", value: stats?.pipeline?.shortlisted ?? 0, icon: Star, color: "text-amber-500", trend: "12 pending" },
          { label: "Interviews", value: stats?.interviewsThisWeek ?? 0, icon: Calendar, color: "text-purple-500", trend: "3 today" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-[#0f1115] border-white/5 overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                  {stat.trend}
                </div>
              </div>
              <div className="text-4xl font-black tracking-tight">{stat.value}</div>
              <div className="text-sm font-bold text-white/40 uppercase tracking-widest mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Area (Column 1-2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Hiring Assistant Widget */}
          <Card className="border-none bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-2xl shadow-blue-900/20 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <BrainCircuit className="h-32 w-32 text-white" />
            </div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white uppercase tracking-widest">
                  AI Intelligence
                </div>
                <Badge className="bg-emerald-500 text-white border-none text-[10px] font-black uppercase">Optimization Active</Badge>
              </div>
              
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-4">AI Hiring Assistant</h2>
              <p className="text-blue-50/80 text-sm mb-8 max-w-xl leading-relaxed">
                "We found 12 candidates matching your <span className="text-white font-bold underline decoration-blue-300">Senior React Engineer</span> role. Based on current market trends, adding 'Next.js' to your requirements could increase applicant quality by 45%."
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild className="bg-white text-blue-700 hover:bg-blue-50 rounded-xl px-8 h-12 font-bold shadow-xl shadow-blue-900/40">
                  <Link href="/ai-matching">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Review Best Matches
                  </Link>
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl px-6 h-12 font-bold">
                  Optimize Job Posts
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Applicants Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Recent Applicants
              </h2>
              <Button variant="link" className="text-blue-500 font-bold p-0" onClick={() => onTabChange("candidates")}>
                View Pipeline <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <Card className="bg-[#0f1115] border-white/5 rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                {applicants.length === 0 ? (
                  <div className="text-center py-16 text-white/20">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p className="font-bold">No applications detected</p>
                    <p className="text-xs">Post a job to begin gathering candidates</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {applicants.map((applicant) => (
                      <div key={applicant.id} className="flex items-center justify-between p-5 group hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-blue-400 font-black border border-blue-500/20 shadow-inner">
                            {applicant.applicant?.email?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{applicant.applicant?.email || "Anonymous"}</div>
                            <div className="text-xs text-white/40 flex items-center gap-2 mt-0.5">
                              <Briefcase className="h-3 w-3" />
                              {applicant.jobTitle}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="hidden md:block text-right">
                            <div className="text-xs font-bold text-emerald-400">92% Match</div>
                            <div className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-0.5">AI SCORE</div>
                          </div>
                          <Badge className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase border-none ${
                            applicant.status === "shortlisted" ? "bg-amber-500/20 text-amber-400" :
                            applicant.status === "hired" ? "bg-emerald-500/20 text-emerald-400" :
                            "bg-blue-500/20 text-blue-400"
                          }`}>
                            {applicant.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="text-white/20 hover:text-white rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Widgets (Column 3) */}
        <div className="space-y-8">
          {/* Quick Actions Panel */}
          <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Quick Actions</h3>
            </div>
            <CardContent className="p-4 space-y-2">
              <Button asChild className="w-full justify-start h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-3 group">
                <Link href="/post-job">
                  <Plus className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
                  Post New Job
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-white/5 hover:bg-white/10 border-white/10 text-white rounded-xl font-bold gap-3" onClick={() => onTabChange("candidates")}>
                <Search className="h-5 w-5 text-blue-400" />
                Search Candidates
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-white/5 hover:bg-white/10 border-white/10 text-white rounded-xl font-bold gap-3">
                <Download className="h-5 w-5 text-emerald-400" />
                Download CVs
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-white/5 hover:bg-white/10 border-white/10 text-white rounded-xl font-bold gap-3">
                <Calendar className="h-5 w-5 text-purple-400" />
                Schedule Interview
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-white/5 hover:bg-white/10 border-white/10 text-white rounded-xl font-bold gap-3">
                <MessageSquare className="h-5 w-5 text-amber-400" />
                Send Bulk Messages
              </Button>
            </CardContent>
          </Card>

          {/* Hiring Success Widget */}
          <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
            <CardContent className="p-6 text-center">
              <div className="relative h-24 w-24 mx-auto mb-4">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/10" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-500" strokeWidth="3" strokeDasharray="75, 100" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">75%</span>
                </div>
              </div>
              <h4 className="font-bold text-white mb-1">Hiring Success Rate</h4>
              <p className="text-xs text-white/40">You're in the top 10% of employers in the Gulf region.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hiring Pipeline Visualization */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          Hiring Pipeline Status
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {["applied", "reviewed", "shortlisted", "interviewed", "hired", "deployed"].map((stage, i) => (
            <Card key={stage} className="bg-[#0f1115] border-white/5 hover:border-white/10 transition-colors group">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-black mb-1 group-hover:scale-110 transition-transform ${
                  i <= 1 ? "text-blue-500" : i <= 3 ? "text-amber-500" : "text-emerald-500"
                }`}>
                  {stats?.pipeline?.[stage] ?? 0}
                </div>
                <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">{stage}</div>
                <div className={`h-1.5 rounded-full mt-3 ${
                  i <= 1 ? "bg-blue-500" : i <= 3 ? "bg-amber-500" : "bg-emerald-500"
                }`} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Follow-Up Assistant */}
      <FollowUpPanel />
    </div>
  );
}

// ─── Jobs Tab ─────────────────────────────────────────────────────
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Active Listings</h1>
          <p className="text-white/40 mt-2 font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-500" />
            Manage and monitor your job postings performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-bold gap-2 px-6">
            <Filter className="h-4 w-4" />
            Advanced Filter
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-8 font-bold shadow-xl shadow-blue-600/20 border-t border-white/10">
            <Link href="/post-job">
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10 border-dashed">
          <Briefcase className="h-16 w-16 text-white/10 mx-auto mb-6" />
          <h3 className="text-xl font-bold">No active listings</h3>
          <p className="text-white/40 mt-1">Start hiring by creating your first job post.</p>
          <Button asChild className="mt-8 bg-blue-600 hover:bg-blue-700 h-12 rounded-xl px-8 font-bold">
            <Link href="/post-job">Post a Job Now</Link>
          </Button>
        </div>
      ) : (
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {["Job Specification", "Status", "Metrics", "Market Signal", "Actions"].map((h) => (
                    <th key={h} className="text-left px-8 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {jobs.map((job) => (
                  <tr key={job.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{job.title}</div>
                      <div className="text-xs text-white/40 mt-1 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-blue-500/60" />
                        {job.location} • {job.employmentType || "Full-Time"}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase border-none ${
                        job.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                        job.status === "draft" ? "bg-white/10 text-white/40" :
                        "bg-amber-500/20 text-amber-400"
                      }`}>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-black text-white">{job.applyCount || 0}</div>
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Apps</div>
                        </div>
                        <Separator orientation="vertical" className="h-8 bg-white/5" />
                        <div className="text-center">
                          <div className="text-sm font-black text-white">{job.viewCount || 0}</div>
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Views</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[75%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        </div>
                        <span className="text-[10px] font-black text-blue-400">HIGH</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-white/20 hover:text-white rounded-xl hover:bg-white/5 transition-colors" asChild>
                          <Link href={`/edit-job?id=${job.id}`}>
                            <FileText className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white/20 hover:text-blue-400 rounded-xl hover:bg-white/5 transition-colors">
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
  const dropTargets = useRef<globalThis.Map<string, HTMLDivElement>>(new globalThis.Map());

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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Talent Pipeline</h1>
          <p className="text-white/40 mt-2 font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Drag and drop candidates to manage hiring stages
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-bold gap-2 px-6"
            onClick={() => fetchApplicants(50)}
            disabled={loading}
          >
            <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-6 font-bold">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Candidate
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-6 overflow-x-auto pb-8 -mx-10 px-10">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-80 h-[600px] bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white/60">{error}</p>
          <Button onClick={() => { setLoading(true); fetchApplicants(); }} variant="outline" className="mt-6 rounded-xl border-white/10 hover:bg-white/5">
            Retry Connection
          </Button>
        </div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10 border-dashed">
          <Users className="h-16 w-16 text-white/10 mx-auto mb-6" />
          <h3 className="text-xl font-bold">Zero applicants detected</h3>
          <p className="text-white/40 mt-1">Share your job posts to begin populating your pipeline.</p>
          <Button asChild className="mt-8 bg-blue-600 hover:bg-blue-700 h-12 rounded-xl px-8 font-bold">
            <Link href="/post-job">Post Your First Job</Link>
          </Button>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-8 -mx-10 px-10 snap-x snap-mandatory scroll-smooth">
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
                className={`flex-shrink-0 w-80 snap-start rounded-3xl border transition-all duration-300 ${
                  dragOverStage === stage
                    ? "border-blue-500 bg-blue-500/5 shadow-2xl shadow-blue-500/10 ring-2 ring-blue-500/20"
                    : "border-white/5 bg-[#0a0c10]/40 backdrop-blur-sm"
                }`}
              >
                <div className="p-5 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${stageDotColors[stage]} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                      <h3 className="font-black text-white text-xs uppercase tracking-widest">
                        {stageLabels[stage]}
                      </h3>
                    </div>
                    <Badge className="bg-white/5 text-white/40 border-none font-black text-[10px] rounded-lg h-6 px-2">
                      {items.length}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 space-y-4 min-h-[500px]">
                  <AnimatePresence>
                    {items.map((applicant) => (
                      <motion.div
                        key={applicant.id}
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        draggable
                        onDragStart={() => handleDragStart(applicant)}
                        onDragEnd={() => setDraggingId(null)}
                        onDragStartCapture={(e) => {
                          e.dataTransfer.setData("text/plain", String(applicant.id));
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className={`group bg-[#111318] rounded-2xl border p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-xl hover:border-white/20 transition-all duration-200 relative ${
                          draggingId === applicant.id
                            ? "opacity-30 border-blue-500 ring-4 ring-blue-500/20"
                            : "border-white/5"
                        }`}
                      >
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-4 w-4 text-white/20" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-blue-400 font-black border border-blue-500/20 shadow-inner text-xs">
                            {applicant.applicant?.email?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-sm truncate pr-4">
                              {applicant.applicant?.email?.split("@")[0] || "Anonymous"}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">94% AI Match</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[11px] text-white/40">
                            <Briefcase className="h-3 w-3 text-blue-500/60" />
                            <span className="truncate">{applicant.jobTitle}</span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1.5 text-[10px] text-white/20 font-bold uppercase tracking-wider">
                              <Clock className="h-3 w-3" />
                              {new Date(applicant.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                            <Button
                              size="sm"
                              className="h-7 px-3 text-[10px] rounded-lg bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white font-bold uppercase tracking-widest"
                            >
                              Profile
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {items.length === 0 && (
                    <div className="h-32 rounded-2xl border-2 border-dashed border-white/[0.03] flex flex-col items-center justify-center text-center p-4">
                      <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <Plus className="h-4 w-4 text-white/20" />
                      </div>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Stage Empty</p>
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

  // Mock data for charts
  const trendData = [
    { name: 'Mon', apps: 4 },
    { name: 'Tue', apps: 7 },
    { name: 'Wed', apps: 5 },
    { name: 'Thu', apps: 12 },
    { name: 'Fri', apps: 9 },
    { name: 'Sat', apps: 2 },
    { name: 'Sun', apps: 1 },
  ];

  const sourceData = [
    { name: 'Direct', value: 400, color: '#3b82f6' },
    { name: 'LinkedIn', value: 300, color: '#6366f1' },
    { name: 'Indeed', value: 200, color: '#8b5cf6' },
    { name: 'Referral', value: 100, color: '#10b981' },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Hiring Intelligence</h1>
        <p className="text-white/40 mt-2 font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          Real-time performance metrics and applicant trends
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Applicant Trends (Last 7 Days)</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500/10 text-blue-400 border-none">+12.4% vs last week</Badge>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1d23', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="apps" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Hiring Funnel</h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-5">
                  {pipelineEntries.map(([stage, count]) => {
                    const pct = totalPipeline > 0 ? Math.round((count / totalPipeline) * 100) : 0;
                    return (
                      <div key={stage} className="space-y-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/60 font-bold uppercase tracking-widest">{stage}</span>
                          <span className="font-black text-white">{count} <span className="text-white/20 ml-1">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" 
                          />
                        </div>
                      </div>
                    );
                  })}
                  {totalPipeline === 0 && (
                    <div className="text-center py-12 text-white/20 font-bold italic">No funnel data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Applicant Sources</h3>
              </div>
              <CardContent className="p-6">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1d23', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {sourceData.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs font-bold text-white/60">{s.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-none rounded-3xl overflow-hidden shadow-2xl">
            <CardContent className="p-8 text-center text-white">
              <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-black mb-2">Market Insights</h3>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                Your job posts are receiving 25% more engagement than similar roles in Qatar.
              </p>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="text-3xl font-black mb-1">94%</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-200">Engagement Score</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Operational KPIs</h3>
            </div>
            <CardContent className="p-6 space-y-6">
              {[
                { label: "Time to Hire", value: "14 days", trend: "-2 days" },
                { label: "Cost per Hire", value: "$420", trend: "-$50" },
                { label: "Interview Pass Rate", value: "32%", trend: "+5%" },
              ].map((kpi) => (
                <div key={kpi.label} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40">{kpi.label}</div>
                    <div className="text-xl font-black text-white mt-1">{kpi.value}</div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">{kpi.trend}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
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

// ─── AI Agents Tab ─────────────────────────────────────────────────
interface AgentStatus {
  active: boolean;
  recentEvents: number;
  registeredHandlers: string[];
}

function AgentsTab() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [events, setEvents] = useState<Array<{ type: string; source: string; payload: any; timestamp: string }>>([]);
  const [memory, setMemory] = useState<{ preferences: Array<{ key: string; value: string; confidence: number }>; patterns: any } | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [prefSummary, setPrefSummary] = useState<any>(null);
  const [inferredPrefs, setInferredPrefs] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [signalTotal, setSignalTotal] = useState(0);
  const [consolidated, setConsolidated] = useState<any>(null);
  const [inferring, setInferring] = useState(false);
  const [showAllSignals, setShowAllSignals] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e, m, j, ps, ip, sg] = await Promise.allSettled([
        api.getAgentStatus(),
        api.getAgentEvents(undefined, 20),
        api.getAgentMemory(),
        api.getEmployerJobs(),
        api.getPreferenceSummary(),
        api.getInferredPreferences(),
        api.getSignals(10),
      ]);
      if (s.status === "fulfilled") setStatus(s.value);
      if (e.status === "fulfilled") setEvents(e.value.events);
      if (m.status === "fulfilled") setMemory(m.value);
      if (j.status === "fulfilled") setJobs(j.value);
      if (ps.status === "fulfilled") setPrefSummary(ps.value);
      if (ip.status === "fulfilled") setInferredPrefs(ip.value.preferences);
      if (sg.status === "fulfilled") { setSignals(sg.value.signals); setSignalTotal(sg.value.total); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInfer = async () => {
    setInferring(true);
    try {
      const res = await api.inferPreferences();
      setResult(`Inferred ${res.inferred} new preference patterns from behavioral signals`);
      await fetchData();
    } catch (e: any) {
      setResult(e.message);
    } finally {
      setInferring(false);
    }
  };

  const handleDecay = async () => {
    setInferring(true);
    try {
      const res = await api.decayPreferences();
      setResult(`Decayed ${res.count} stale preferences`);
      await fetchData();
    } catch (e: any) {
      setResult(e.message);
    } finally {
      setInferring(false);
    }
  };

  const handleEmbed = async () => {
    setInferring(true);
    try {
      const res = await api.generateEmbeddings();
      setResult(`Generated embeddings for ${res.count || 0} preferences`);
    } catch (e: any) {
      setResult(e.message);
    } finally {
      setInferring(false);
    }
  };

  const handleLoadProfile = async () => {
    setInferring(true);
    try {
      const profile = await api.getConsolidatedProfile();
      setConsolidated(profile);
    } catch (e: any) {
      setResult(e.message);
    } finally {
      setInferring(false);
    }
  };

  const handleStart = async () => {
    setRunning(true);
    try {
      const res = await api.startAgents();
      setResult(res.message);
      await fetchData();
    } catch (e: any) {
      setResult(e.message);
    } finally {
      setRunning(false);
    }
  };

  const handleStop = async () => {
    setRunning(true);
    try {
      const res = await api.stopAgents();
      setResult(res.message);
      await fetchData();
    } catch (e: any) {
      setResult(e.message);
    } finally {
      setRunning(false);
    }
  };

  const handlePipeline = async () => {
    if (!selectedJobId) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await api.runFullPipeline(selectedJobId);
      setResult(`Pipeline complete — sourced ${res.sourcing.sourcedCount}, ranked ${res.ranking.rankedCount}`);
      await fetchData();
    } catch (e: any) {
      setResult(e.message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-white/5 rounded-xl" />
        <div className="grid lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white/5 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight">AI Recruitment Agents</h1>
          <p className="text-white/40 mt-2 font-medium flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-500" />
            Autonomous sourcing, ranking, outreach, and adaptive intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status?.active ? (
            <Button onClick={handleStop} disabled={running} className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 px-6 font-bold gap-2">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Stop Agents
            </Button>
          ) : (
            <Button onClick={handleStart} disabled={running} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-6 font-bold gap-2">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start Agents
            </Button>
          )}
          <Button onClick={fetchData} variant="outline" className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-bold gap-2 px-6">
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {result && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold">
          {result}
        </div>
      )}

      {/* Agent Status Cards */}
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${status?.active ? "bg-emerald-500/20" : "bg-white/5"}`}>
                <Cpu className={`h-5 w-5 ${status?.active ? "text-emerald-500" : "text-white/20"}`} />
              </div>
              <div>
                <div className="text-sm font-black text-white">{status?.active ? "Active" : "Inactive"}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Orchestrator</div>
              </div>
            </div>
            <div className={`h-2 rounded-full mb-4 ${status?.active ? "bg-emerald-500" : "bg-white/5"}`} />
            <div className="text-[10px] font-bold text-white/40">
              {status?.registeredHandlers?.length || 0} registered handlers
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-black text-white">{events.length}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Recent Events</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-blue-500/20 mb-4">
              <div className="h-full w-3/4 rounded-full bg-blue-500" />
            </div>
            <div className="text-[10px] font-bold text-white/40">
              Last: {events[0]?.type ? events[0].type.split('.').pop() : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <BrainCircuit className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-sm font-black text-white">{inferredPrefs.length}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Inferred Preferences</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-purple-500/20 mb-4">
              <div className={`h-full rounded-full bg-purple-500 ${prefSummary ? `w-[${prefSummary.learningProgress}%]` : "w-0"}`} />
            </div>
            <div className="text-[10px] font-bold text-white/40">
              {prefSummary?.totalSignals || 0} signals analyzed
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-black text-white">{prefSummary?.learningProgress || 0}%</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Learning Progress</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-amber-500/20 mb-4">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${prefSummary?.learningProgress || 0}%` }} />
            </div>
            <div className="text-[10px] font-bold text-white/40">
              {prefSummary?.totalPreferences || 0} active preferences
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Runner */}
      <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
          <Play className="h-5 w-5 text-blue-500" />
          <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Pipeline Runner</h3>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Select Job</label>
              <select
                value={selectedJobId ?? ""}
                onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
              >
                <option value="" className="bg-[#0f1115]">-- Choose a job posting --</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id} className="bg-[#0f1115]">{job.title}</option>
                ))}
              </select>
            </div>
            <Button onClick={handlePipeline} disabled={running || !selectedJobId}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-12 px-10 font-bold gap-2 shadow-xl shadow-blue-600/20 disabled:opacity-50"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Run Full Pipeline
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">1. Source</div>
              <div className="text-xs text-white/40">AI finds matching candidates</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">2. Rank</div>
              <div className="text-xs text-white/40">Scores & prioritizes by fit</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">3. Outreach</div>
              <div className="text-xs text-white/40">Generates personalized messages</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adaptive Intelligence Controls */}
      <Card className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
          <BrainCircuit className="h-5 w-5 text-purple-500" />
          <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Adaptive Intelligence Engine</h3>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleInfer} disabled={inferring} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 px-6 font-bold gap-2">
              {inferring ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
              Infer Preferences from Signals
            </Button>
            <Button onClick={handleDecay} disabled={inferring} variant="outline" className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-bold gap-2 px-6">
              <Activity className="h-4 w-4" />
              Decay Stale Preferences
            </Button>
            <Button onClick={handleEmbed} disabled={inferring} variant="outline" className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-bold gap-2 px-6">
              <Sparkles className="h-4 w-4" />
              Generate Embeddings
            </Button>
            <Button onClick={handleLoadProfile} disabled={inferring} variant="outline" className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-bold gap-2 px-6">
              <FileText className="h-4 w-4" />
              Load Full Profile
            </Button>
          </div>

          <div className="mt-6 grid md:grid-cols-5 gap-3 text-center text-[10px]">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="font-black text-purple-400 mb-1">Signals</div>
              <div className="font-bold text-white">{prefSummary?.totalSignals || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="font-black text-purple-400 mb-1">Inferred</div>
              <div className="font-bold text-white">{prefSummary?.totalPreferences || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="font-black text-purple-400 mb-1">Skills</div>
              <div className="font-bold text-white">{prefSummary?.preferredSkills?.length || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="font-black text-purple-400 mb-1">Locations</div>
              <div className="font-bold text-white">{prefSummary?.preferredLocations?.length || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="font-black text-purple-400 mb-1">Certs</div>
              <div className="font-bold text-white">{prefSummary?.preferredCertifications?.length || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Inferred Preferences + Behavioral Signals */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Inferred Preferences */}
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <BrainCircuit className="h-5 w-5 text-purple-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Inferred Preferences</h3>
            <Badge className="ml-auto bg-purple-500/10 text-purple-400 border-none text-[10px]">{inferredPrefs.length}</Badge>
          </div>
          <CardContent className="p-4 max-h-[420px] overflow-y-auto">
            {inferredPrefs.length > 0 ? (
              <div className="space-y-2">
                {inferredPrefs.map((pref: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-white/10 text-white/60 border-none text-[9px] font-black uppercase tracking-widest rounded-lg">
                        {pref.preference_key.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase border-none ${
                        pref.confidence > 0.8 ? "bg-emerald-500/20 text-emerald-400" :
                        pref.confidence > 0.5 ? "bg-amber-500/20 text-amber-400" :
                        "bg-white/5 text-white/40"
                      }`}>
                        {Math.round(Number(pref.confidence) * 100)}%
                      </Badge>
                    </div>
                    <div className="text-sm font-bold text-white">{pref.preference_value}</div>
                    <div className="flex items-center gap-3 text-[9px] text-white/30 font-bold uppercase tracking-widest">
                      <span>{pref.source}</span>
                      <span>•</span>
                      <span>{pref.supporting_signals || 0} signals</span>
                      {pref.decay_started_at && <span className="text-amber-500">• decaying</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/20">
                <BrainCircuit className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">No inferred preferences yet</p>
                <p className="text-[10px] mt-1">Run "Infer Preferences" above to detect patterns from your recruiter actions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Behavioral Signals Log */}
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Behavioral Signals</h3>
            <Badge className="ml-auto bg-blue-500/10 text-blue-400 border-none text-[10px]">{signalTotal} total</Badge>
          </div>
          <CardContent className="p-4 max-h-[420px] overflow-y-auto">
            {signals.length > 0 ? (
              <div className="space-y-1">
                {signals.map((sig: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      Number(sig.signal_strength) > 0.5 ? 'bg-emerald-500' :
                      Number(sig.signal_strength) > 0 ? 'bg-blue-500' :
                      Number(sig.signal_strength) > -0.5 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                        {sig.action_type.replace(/_/g, ' ')}
                        <span className={`text-[9px] ${Number(sig.signal_strength) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ({Number(sig.signal_strength) > 0 ? '+' : ''}{sig.signal_strength})
                        </span>
                      </div>
                      <div className="text-[10px] text-white/30 truncate">
                        candidate #{sig.candidate_id || 'N/A'} • job #{sig.job_id || 'N/A'}
                      </div>
                    </div>
                    <div className="text-[9px] text-white/20 font-bold uppercase whitespace-nowrap">
                      {new Date(sig.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
                {signalTotal > 10 && !showAllSignals && (
                  <Button onClick={() => setShowAllSignals(true)} variant="ghost" className="w-full text-blue-400 text-[10px] font-bold h-8">
                    +{signalTotal - 10} more signals
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-white/20">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">No signals recorded yet</p>
                <p className="text-[10px] mt-1">Signals are generated automatically when you shortlist, reject, or hire candidates</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consolidated Profile */}
      {consolidated && (
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <FileText className="h-5 w-5 text-emerald-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Consolidated Recruiter Profile</h3>
          </div>
          <CardContent className="p-6 space-y-6">
            {consolidated.manualPreferences?.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Manual Preferences ({consolidated.manualPreferences.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {consolidated.manualPreferences.map((p: any, i: number) => (
                    <Badge key={i} className="bg-blue-500/10 text-blue-400 border-none font-bold text-[10px] rounded-lg px-3 py-1">
                      {p.key}: {p.value} ({Math.round(p.confidence * 100)}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {consolidated.behavioralSummary?.avoidedSkills?.length > 0 && (
              <div className="border-t border-white/5 pt-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400/60 mb-3">Avoided Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {consolidated.behavioralSummary.avoidedSkills.map((s: string, i: number) => (
                    <Badge key={i} className="bg-red-500/10 text-red-400 border-none font-bold text-[10px] rounded-lg px-3 py-1">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 text-center border-t border-white/5 pt-6">
              <div className="p-3 rounded-xl bg-white/5">
                <div className="font-black text-emerald-400 text-lg">{consolidated.behavioralSummary?.preferredSkills?.length || 0}</div>
                <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Preferred Skills</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <div className="font-black text-blue-400 text-lg">{consolidated.behavioralSummary?.preferredLocations?.length || 0}</div>
                <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Locations</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <div className="font-black text-purple-400 text-lg">{consolidated.behavioralSummary?.preferredCertifications?.length || 0}</div>
                <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Certifications</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Documentation */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-white/5 rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-6 w-6 text-purple-400" />
            <h3 className="font-black text-lg text-white">How Adaptive Intelligence Works</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-2xl font-black text-purple-500 mb-2">1</div>
              <h4 className="font-bold text-white mb-2">Signal Collection</h4>
              <p className="text-xs text-white/40 leading-relaxed">Every recruiter action — shortlisting, rejecting, hiring, sending outreach — generates a behavioral signal with positive or negative weight stored in the signal database.</p>
            </div>
            <div>
              <div className="text-2xl font-black text-indigo-500 mb-2">2</div>
              <h4 className="font-bold text-white mb-2">Pattern Inference</h4>
              <p className="text-xs text-white/40 leading-relaxed">The inference engine analyzes signal patterns to detect recruiter preferences: preferred skills, locations, experience levels, and certifications — automatically and continuously.</p>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-500 mb-2">3</div>
              <h4 className="font-bold text-white mb-2">Confidence Evolution</h4>
              <p className="text-xs text-white/40 leading-relaxed">Preferences use confidence-weighted scoring with decay over time. Reinforced patterns strengthen; contradicted patterns weaken. Stale preferences below threshold are automatically deactivated.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sourcing Tab ──────────────────────────────────────────────────
function SourcingTab() {
  const [sources, setSources] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [intentSummary, setIntentSummary] = useState<any>(null);
  const [graphSummary, setGraphSummary] = useState<any>(null);
  const [pipelineHistory, setPipelineHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState("");
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const candidateStatus = (c: any) => c.status || "discovered";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, cRes, intent, graph, history] = await Promise.all([
        api.getCandidateSources(),
        api.getDiscoveredCandidates(20, 0),
        api.getIntentSummary(),
        api.getGraphSummary(),
        api.getPipelineHistory(10),
      ]);
      setSources(s.sources);
      setCandidates(cRes.candidates);
      setTotalCandidates(cRes.total);
      setIntentSummary(intent);
      setGraphSummary(graph);
      setPipelineHistory(history.history);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRunPipeline = async () => {
    if (!jobId || isNaN(Number(jobId))) return;
    setPipelineRunning(true);
    setPipelineResult(null);
    try {
      const result = await api.runFullSourcingPipeline(Number(jobId));
      setPipelineResult(result);
      loadData();
    } catch (e: any) {
      setPipelineResult({ error: e.message });
    } finally {
      setPipelineRunning(false);
    }
  };

  const handleEnrichSingle = async (id: number) => {
    try {
      await api.enrichCandidate(id);
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleVerifySingle = async (id: number) => {
    try {
      await api.verifyCandidate(id);
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 rounded-2xl bg-white/5" />
        <div className="grid lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-3xl bg-white/5" />)}
        </div>
        <div className="h-96 rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <AlertCircle className="h-16 w-16 mx-auto mb-6 text-red-500/50" />
        <h2 className="text-2xl font-black text-white mb-2">Sourcing Error</h2>
        <p className="text-white/40 mb-8">{error}</p>
        <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700 rounded-xl">Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Radio className="h-7 w-7 text-blue-400" />
            Autonomous Sourcing
          </h2>
          <p className="text-white/40 text-sm mt-1 font-medium">
            Continuous talent discovery across the internet
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-white/5 text-white/60 border-white/5 rounded-xl text-[10px] font-bold">
            {totalCandidates} discovered
          </Badge>
          <Button onClick={() => api.initializeSources().then(loadData)} variant="ghost" size="sm" className="text-white/40 hover:text-white rounded-xl text-[10px]">
            Init Sources
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Globe className="h-6 w-6 text-blue-500" />
              <Badge className="bg-blue-500/10 text-blue-400 border-none text-[10px] font-black">{sources.filter((s: any) => s.isActive).length} active</Badge>
            </div>
            <div className="text-3xl font-black text-white">{sources.length}</div>
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Sources Connected</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-white">{candidates.filter((c: any) => c.verificationStatus === "verified").length}</div>
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Verified Candidates</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <MapIcon className="h-6 w-6 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-white">{intentSummary?.relocationSeekers || 0}</div>
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Relocation Seekers</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Network className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-3xl font-black text-white">{graphSummary?.totalNodes || 0}</div>
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Graph Nodes</div>
            <div className="text-[9px] text-white/20 mt-1">{graphSummary?.totalEdges || 0} edges</div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Runner */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-white/5 rounded-3xl shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-5 w-5 text-blue-400" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Run Discovery Pipeline</h3>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={jobId}
              onChange={e => setJobId(e.target.value)}
              placeholder="Enter Job ID..."
              className="h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 w-48"
            />
            <Button onClick={handleRunPipeline} disabled={pipelineRunning || !jobId}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-8 font-bold shadow-xl shadow-blue-600/20">
              {pipelineRunning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...</> : "Run Pipeline"}
            </Button>
          </div>
          {pipelineResult && (
            <div className="mt-4 grid grid-cols-5 gap-4">
              {[
                { label: "Discovered", value: pipelineResult.discovery?.discovered, color: "text-blue-400" },
                { label: "Enriched", value: pipelineResult.enrichment?.enriched, color: "text-emerald-400" },
                { label: "Verified", value: pipelineResult.verification?.verified, color: "text-amber-400" },
                { label: "Matched", value: pipelineResult.matching?.matched, color: "text-purple-400" },
                { label: "Contacted", value: pipelineResult.outreach?.contacted, color: "text-pink-400" },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className={`text-xl font-black ${item.color}`}>{item.value ?? 0}</div>
                  <div className="text-[9px] text-white/40 font-bold uppercase">{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sources Grid */}
      <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
          <Globe className="h-5 w-5 text-blue-500" />
          <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Connected Sources</h3>
        </div>
        <CardContent className="p-4">
          {sources.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sources.map((source: any) => (
                <div key={source.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">{source.displayName}</span>
                    <div className={`h-2 w-2 rounded-full ${source.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/20"}`} />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40">
                    <Badge className="bg-white/5 text-white/40 border-none text-[8px]">{source.type}</Badge>
                    <span>Trust: {Math.round((source.trustScore || 0) * 100)}%</span>
                    {source.lastQueriedAt && <span>Last: {new Date(source.lastQueriedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/20">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">No sources configured</p>
              <Button onClick={() => api.initializeSources().then(loadData)} size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs">Initialize Default Sources</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidates Table + Intent Signals + Graph */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Discovered Candidates */}
        <Card className="lg:col-span-2 bg-[#0f1115] border-white/5 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Discovered Candidates</h3>
            <Badge className="ml-auto bg-white/5 text-white/40 border-none text-[10px]">{totalCandidates} total</Badge>
          </div>
          <CardContent className="p-0 max-h-[500px] overflow-y-auto">
            {candidates.length > 0 ? (
              <div className="divide-y divide-white/5">
                {candidates.map((c: any) => (
                  <div key={c.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-white font-bold text-xs border border-white/5">
                          {(c.fullName || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{c.fullName || "Unknown"}</div>
                          <div className="text-[10px] text-white/40">{c.email || ""}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`border-none text-[8px] font-black uppercase ${c.verificationStatus === "verified" ? "bg-emerald-500/10 text-emerald-400" : c.verificationStatus === "suspicious" ? "bg-amber-500/10 text-amber-400" : c.verificationStatus === "rejected" ? "bg-red-500/10 text-red-400" : "bg-white/5 text-white/40"}`}>
                          {c.verificationStatus || "pending"}
                        </Badge>
                        <Badge className="bg-white/5 text-white/40 border-none text-[8px]">{c.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/40">
                      {c.headline && <span className="truncate max-w-[200px]">{c.headline}</span>}
                      {c.location && <span>📍 {c.location}</span>}
                      {c.normalizedSkills?.length > 0 && (
                        <span className="text-emerald-400/60">{c.normalizedSkills.slice(0, 3).join(", ")}</span>
                      )}
                    </div>
                    {c.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(c.skills as string[]).slice(0, 5).map((s: string, i: number) => (
                          <span key={i} className="text-[8px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/5">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEnrichSingle(c.id)}
                        className="h-6 px-2 text-[8px] text-blue-400 hover:text-blue-300 rounded-lg font-bold">Enrich</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleVerifySingle(c.id)}
                        className="h-6 px-2 text-[8px] text-amber-400 hover:text-amber-300 rounded-lg font-bold">Verify</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-white/20">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold text-lg">No candidates discovered yet</p>
                <p className="text-xs mt-2">Run a sourcing pipeline or trigger discovery to find talent</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intent Signals + Graph Summary */}
        <div className="space-y-8">
          <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <MapIcon className="h-5 w-5 text-amber-500" />
              <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Intent Signals</h3>
            </div>
            <CardContent className="p-4">
              {intentSummary && intentSummary.totalSignals > 0 ? (
                <div className="space-y-3">
                  {intentSummary.emergingTrends?.map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-white">{t.description}</span>
                          <span className="text-[9px] font-black text-white/40">{t.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, (t.count / intentSummary.totalSignals) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <div className="text-lg font-black text-emerald-400">{intentSummary.immediateAvailable}</div>
                      <div className="text-[8px] text-white/40 font-bold uppercase">Available Now</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/5">
                      <div className="text-lg font-black text-blue-400">{intentSummary.sponsorshipSeeking}</div>
                      <div className="text-[8px] text-white/40 font-bold uppercase">Need Sponsorship</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-white/20">
                  <p className="text-xs">No intent signals detected yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <Network className="h-5 w-5 text-purple-500" />
              <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Opportunity Graph</h3>
            </div>
            <CardContent className="p-4">
              {graphSummary && graphSummary.totalNodes > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                      <div className="text-lg font-black text-purple-400">{graphSummary.totalNodes}</div>
                      <div className="text-[8px] text-white/40 font-bold uppercase">Candidates</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                      <div className="text-lg font-black text-purple-400">{graphSummary.totalEdges}</div>
                      <div className="text-[8px] text-white/40 font-bold uppercase">Relationships</div>
                    </div>
                  </div>
                  {graphSummary.topSkills?.length > 0 && (
                    <div>
                      <h4 className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-2">Top Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {graphSummary.topSkills.slice(0, 8).map((s: any, i: number) => (
                          <span key={i} className="text-[8px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {s.value} ({s.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-white/20">
                  <Network className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Graph is being built as candidates are discovered</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pipeline History */}
      <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
          <History className="h-5 w-5 text-white/40" />
          <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Pipeline History</h3>
        </div>
        <CardContent className="p-0 max-h-[300px] overflow-y-auto">
          {pipelineHistory.length > 0 ? (
            <div className="divide-y divide-white/5">
              {pipelineHistory.map((p: any) => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      {p.name}
                      <div className={`h-1.5 w-1.5 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-white/20"}`} />
                    </div>
                    <div className="text-[10px] text-white/40 mt-0.5">
                      Sources: {(p.sources || []).join(", ")} | Schedule: {p.schedule}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-white/40">
                    <div>{p.totalDiscovered} discovered</div>
                    {p.lastRunAt && <div>{new Date(p.lastRunAt).toLocaleDateString()}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/20">
              <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No pipeline runs yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-white/5 rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Radio className="h-6 w-6 text-blue-400" />
            <h3 className="font-black text-lg text-white">Autonomous Talent Discovery Network</h3>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-black text-emerald-500 mb-2">1</div>
              <h4 className="font-bold text-white mb-2">Discovery</h4>
              <p className="text-xs text-white/40 leading-relaxed">Continuously scans external sources (LinkedIn, GitHub, Telegram, etc.) to find candidate profiles and public resumes.</p>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-500 mb-2">2</div>
              <h4 className="font-bold text-white mb-2">Enrichment</h4>
              <p className="text-xs text-white/40 leading-relaxed">AI infers skills, normalizes experience, detects languages, and assesses migration likelihood and sponsorship readiness.</p>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-500 mb-2">3</div>
              <h4 className="font-bold text-white mb-2">Verification</h4>
              <p className="text-xs text-white/40 leading-relaxed">Scores authenticity, profile quality, spam probability, and fraud risk. Only verified candidates enter the matching pipeline.</p>
            </div>
            <div>
              <div className="text-2xl font-black text-blue-500 mb-2">4</div>
              <h4 className="font-bold text-white mb-2">Intent + Graph</h4>
              <p className="text-xs text-white/40 leading-relaxed">Detects employment/relocation intent signals. Builds a lightweight opportunity graph connecting candidates to skills, locations, and industries.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Knowledge Graph Tab ────────────────────────────────────────────
function KnowledgeGraphTab() {
  const [graphStatus, setGraphStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cypherQuery, setCypherQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryRunning, setQueryRunning] = useState(false);
  const [syncRunning, setSyncRunning] = useState(false);
  const [ragQuestion, setRagQuestion] = useState("");
  const [ragResult, setRagResult] = useState<any>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "query" | "rag" | "migration">("overview");
  const [hiddenGemSkills, setHiddenGemSkills] = useState("");
  const [hiddenGemResult, setHiddenGemResult] = useState<any>(null);
  const [skillAdjResult, setSkillAdjResult] = useState<any>(null);
  const [skillAdjSkill, setSkillAdjSkill] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const status = await api.getGraphStatus();
      setGraphStatus(status);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleSync = async () => {
    setSyncRunning(true);
    try {
      const result = await api.syncGraph();
      setGraphStatus((prev: any) => ({ ...prev, ...result }));
      loadStatus();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSyncRunning(false);
    }
  };

  const handleRunCypher = async () => {
    if (!cypherQuery.trim()) return;
    setQueryRunning(true);
    setQueryResult(null);
    try {
      const result = await api.runRawCypher(cypherQuery);
      setQueryResult(result);
    } catch (e: any) {
      setQueryResult({ error: e.message });
    } finally {
      setQueryRunning(false);
    }
  };

  const handleRagQuery = async () => {
    if (!ragQuestion.trim()) return;
    setRagLoading(true);
    try {
      const result = await api.graphRagReason(ragQuestion);
      setRagResult(result);
    } catch (e: any) {
      setRagResult({ error: e.message });
    } finally {
      setRagLoading(false);
    }
  };

  const handleHiddenGems = async () => {
    if (!hiddenGemSkills.trim()) return;
    try {
      const skills = hiddenGemSkills.split(",").map(s => s.trim());
      const result = await api.findHiddenGems(skills);
      setHiddenGemResult(result);
    } catch (e: any) {
      setHiddenGemResult({ error: e.message });
    }
  };

  const handleSkillAdj = async () => {
    if (!skillAdjSkill.trim()) return;
    try {
      const result = await api.getSkillAdjacency(skillAdjSkill.trim());
      setSkillAdjResult(result);
    } catch (e: any) {
      setSkillAdjResult({ error: e.message });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 rounded-2xl bg-white/5" />
        <div className="grid lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-3xl bg-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <GitBranch className="h-7 w-7 text-purple-400" />
            Workforce Knowledge Graph
          </h2>
          <p className="text-white/40 text-sm mt-1 font-medium">
            Neo4j-powered labor intelligence infrastructure
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`rounded-xl px-3 py-1 text-[10px] font-black border-none ${graphStatus?.connected ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {graphStatus?.connected ? "Connected" : "Disconnected"}
          </Badge>
          <Button onClick={handleSync} disabled={syncRunning}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 px-5 text-xs font-bold">
            {syncRunning ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Syncing...</> : "Sync Graph"}
          </Button>
        </div>
      </div>

      {/* Section Nav */}
      <div className="flex gap-2 border-b border-white/5 pb-4">
        {[
          { id: "overview", label: "Overview", icon: Database },
          { id: "query", label: "Query", icon: Route },
          { id: "rag", label: "GraphRAG", icon: Compass },
          { id: "migration", label: "Migration", icon: Share2 },
        ].map(section => {
          const Icon = section.icon;
          return (
            <button key={section.id} onClick={() => setActiveSection(section.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === section.id
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                  : "text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent"
              }`}>
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-8">
          {/* Node Count Cards */}
          <div className="grid lg:grid-cols-5 gap-4">
            {[
              { label: "Candidates", key: "Candidate", color: "text-blue-400" },
              { label: "Employers", key: "Employer", color: "text-emerald-400" },
              { label: "Skills", key: "Skill", color: "text-amber-400" },
              { label: "Locations", key: "Location", color: "text-purple-400" },
              { label: "Relationships", key: "_relationships", color: "text-pink-400" },
            ].map(item => (
              <Card key={item.key} className="bg-[#0f1115] border-white/5 rounded-2xl shadow-xl">
                <CardContent className="p-5 text-center">
                  <div className={`text-3xl font-black ${item.color}`}>
                    {graphStatus?.nodeCounts?.[item.key] ?? 0}
                  </div>
                  <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">{item.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hidden Gems + Skill Adjacency */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                <Target className="h-5 w-5 text-amber-500" />
                <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Hidden Gem Discovery</h3>
              </div>
              <CardContent className="p-5">
                <p className="text-[10px] text-white/40 mb-3">Find candidates who DON'T have these skills but have adjacent ones:</p>
                <div className="flex gap-2 mb-3">
                  <input value={hiddenGemSkills} onChange={e => setHiddenGemSkills(e.target.value)}
                    placeholder="react, node, python..."
                    className="flex-1 h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-purple-500/10" />
                  <Button onClick={handleHiddenGems} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-bold h-10">
                    Find Gems
                  </Button>
                </div>
                {hiddenGemResult?.gems?.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {hiddenGemResult.gems.slice(0, 5).map((g: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-xs font-bold text-white">{g.candidate?.fullName || "Unknown"}</div>
                        <div className="text-[9px] text-white/40">{g.candidate?.headline}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(g.candidateSkills as string[])?.slice(0, 4).map((s: string, j: number) => (
                            <span key={j} className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                <Share2 className="h-5 w-5 text-blue-500" />
                <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Skill Adjacency</h3>
              </div>
              <CardContent className="p-5">
                <p className="text-[10px] text-white/40 mb-3">Discover skills that commonly co-occur with:</p>
                <div className="flex gap-2 mb-3">
                  <input value={skillAdjSkill} onChange={e => setSkillAdjSkill(e.target.value)}
                    placeholder="e.g. react"
                    className="flex-1 h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/20 focus:outline-none focus:ring-4" />
                  <Button onClick={handleSkillAdj} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold h-10">
                    Analyze
                  </Button>
                </div>
                {skillAdjResult?.adjacency?.length > 0 && (
                  <div className="space-y-2">
                    {skillAdjResult.adjacency.slice(0, 8).map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-bold text-white">{a.skill}</span>
                            <span className="text-white/40">{a.frequency}x</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-1">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (a.frequency / Math.max(...skillAdjResult.adjacency.map((x: any) => x.frequency))) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sync Status */}
          {!graphStatus?.connected && (
            <Card className="bg-amber-500/5 border-amber-500/20 rounded-3xl">
              <CardContent className="p-6 flex items-center gap-4">
                <AlertCircle className="h-6 w-6 text-amber-400" />
                <div>
                  <h4 className="font-bold text-white text-sm">Neo4j Not Connected</h4>
                  <p className="text-[10px] text-white/40">Set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables, then sync the graph.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Query Section */}
      {activeSection === "query" && (
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Route className="h-5 w-5 text-blue-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Cypher Query Console</h3>
          </div>
          <CardContent className="p-5">
            <textarea value={cypherQuery} onChange={e => setCypherQuery(e.target.value)}
              placeholder="MATCH (c:Candidate)-[:HAS_SKILL]->(s:Skill {name: 'react'}) RETURN c.fullName, c.headline LIMIT 10"
              className="w-full h-32 p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-mono placeholder:text-white/20 focus:outline-none focus:ring-4 resize-none" />
            <div className="flex items-center gap-3 mt-3">
              <Button onClick={handleRunCypher} disabled={queryRunning || !cypherQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6 text-xs font-bold">
                {queryRunning ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Running...</> : "Run Query"}
              </Button>
              <span className="text-[9px] text-white/30">Use Cypher syntax for Neo4j traversal</span>
            </div>
            {queryResult && (
              <div className="mt-4">
                {queryResult.error ? (
                  <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-[10px] font-mono">{queryResult.error}</div>
                ) : (
                  <div>
                    <div className="text-[10px] text-white/40 mb-2">{queryResult.records?.length || 0} records returned</div>
                    <pre className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[9px] text-white/60 font-mono max-h-80 overflow-y-auto">
                      {JSON.stringify(queryResult.records?.slice(0, 20), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* GraphRAG Section */}
      {activeSection === "rag" && (
        <div className="space-y-8">
          <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-white/5 rounded-3xl shadow-xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <Compass className="h-5 w-5 text-purple-400" />
              <h3 className="font-black text-sm uppercase tracking-widest text-white/60">GraphRAG — Graph-Enhanced AI Reasoning</h3>
            </div>
            <CardContent className="p-5">
              <p className="text-[10px] text-white/40 mb-3">Ask complex questions about your workforce. The AI generates Cypher queries, runs them against the graph, and answers with data-driven insights.</p>
              <textarea value={ragQuestion} onChange={e => setRagQuestion(e.target.value)}
                placeholder='e.g. "Find telecom engineers in East Africa with GCC-adjacent experience and migration intent toward Qatar"'
                className="w-full h-24 p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/20 focus:outline-none focus:ring-4 resize-none" />
              <Button onClick={handleRagQuery} disabled={ragLoading || !ragQuestion.trim()}
                className="mt-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 px-6 text-xs font-bold">
                {ragLoading ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Reasoning...</> : "Reason with Graph"}
              </Button>
              {ragResult && (
                <div className="mt-4 space-y-3">
                  {ragResult.error ? (
                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-[10px]">{ragResult.error}</div>
                  ) : (
                    <>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`border-none text-[8px] font-black ${ragResult.confidence > 0.7 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                            {Math.round(ragResult.confidence * 100)}% confidence
                          </Badge>
                          <span className="text-[9px] text-white/30">{ragResult.path?.length || 0} queries generated</span>
                        </div>
                        <p className="text-sm text-white leading-relaxed">{ragResult.answer}</p>
                      </div>
                      {ragResult.path?.length > 0 && (
                        <details className="text-[10px] text-white/30">
                          <summary className="cursor-pointer hover:text-white/50 font-bold">Generated Cypher Queries</summary>
                          <pre className="mt-2 p-3 rounded-xl bg-white/5 text-[8px] font-mono overflow-x-auto">
                            {ragResult.path.map((q: string, i: number) => `// Query ${i + 1}\n${q}`).join("\n\n")}
                          </pre>
                        </details>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discovery Cards */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-3 text-blue-400" />
                <h4 className="font-bold text-sm text-white mb-1">Multi-Hop Discovery</h4>
                <p className="text-[10px] text-white/40">Traverse the graph across multiple relationship hops to find candidates that simple skill matching misses.</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
              <CardContent className="p-6 text-center">
                <Share2 className="h-8 w-8 mx-auto mb-3 text-emerald-400" />
                <h4 className="font-bold text-sm text-white mb-1">Skill Adjacency</h4>
                <p className="text-[10px] text-white/40">Discover skill co-occurrence patterns — identify which skills frequently appear together in the workforce.</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
              <CardContent className="p-6 text-center">
                <Route className="h-8 w-8 mx-auto mb-3 text-amber-400" />
                <h4 className="font-bold text-sm text-white mb-1">Career Transitions</h4>
                <p className="text-[10px] text-white/40">Model career mobility — see which roles candidates transition between based on actual graph relationships.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Migration Section */}
      {activeSection === "migration" && (
        <div className="space-y-8">
          <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-white/5 rounded-3xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Share2 className="h-5 w-5 text-blue-400" />
                <h3 className="font-black text-sm uppercase tracking-widest text-white/60">GCC Migration Intelligence</h3>
              </div>
              <div className="grid lg:grid-cols-4 gap-4">
                {[
                  { label: "Relocation Intents", key: "totalInterested", color: "text-blue-400" },
                  { label: "Sponsorship Rate", key: "sponsorshipRate", color: "text-amber-400", fmt: (v: number) => `${Math.round(v * 100)}%` },
                  { label: "Urgency Score", key: "avgUrgency", color: "text-emerald-400", fmt: (v: number) => `${Math.round(v * 100)}%` },
                  { label: "Source Countries", key: "topSourceCountries", color: "text-purple-400", fmt: (v: string[]) => `${v?.length || 0} countries` },
                ].map(item => (
                  <div key={item.label} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <div className={`text-2xl font-black ${item.color}`}>
                      {item.fmt ? null : (graphStatus?.connected ? "—" : "N/A")}
                    </div>
                    <div className="text-[9px] text-white/40 font-bold uppercase mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/40 mt-4 text-center">
                Connect Neo4j and sync the graph to enable GCC migration intelligence analytics
              </p>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                <Globe className="h-5 w-5 text-blue-500" />
                <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Labor Hotspots</h3>
              </div>
              <CardContent className="p-4 max-h-80 overflow-y-auto">
                <p className="text-[10px] text-white/30 mb-3 text-center">Connect to Neo4j to see labor concentration by location</p>
                <div className="text-center py-12 text-white/20">
                  <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-bold">Neo4j Connection Required</p>
                  <p className="text-[9px] mt-1">Sync the graph to populate migration analytics</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1115] border-white/5 rounded-3xl shadow-xl">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                <Share2 className="h-5 w-5 text-emerald-500" />
                <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Skill Gap by Location</h3>
              </div>
              <CardContent className="p-4">
                <p className="text-[10px] text-white/30 mb-3 text-center">Analyze skill supply/demand imbalances by region</p>
                <div className="text-center py-12 text-white/20">
                  <Share2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-bold">Sync to Enable</p>
                  <p className="text-[9px] mt-1">Connecting Neo4j unlocks workforce gap analysis</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Documentation */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-white/5 rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <GitBranch className="h-6 w-6 text-purple-400" />
            <h3 className="font-black text-lg text-white">Workforce Knowledge Graph Infrastructure</h3>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            <div>
              <div className="text-2xl font-black text-emerald-500 mb-2">N</div>
              <h4 className="font-bold text-white mb-2">Nodes</h4>
              <p className="text-xs text-white/40 leading-relaxed">Candidate, Employer, Skill, Certification, Industry, Location, University, Intent Signal, Job Role, Migration Path</p>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-500 mb-2">E</div>
              <h4 className="font-bold text-white mb-2">Edges</h4>
              <p className="text-xs text-white/40 leading-relaxed">HAS_SKILL, WORKED_AT, INTERESTED_IN, MATCHES, HIRED_BY, CERTIFIED_IN, LOCATED_IN, MIGRATES_TO, BELONGS_TO</p>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-500 mb-2">Q</div>
              <h4 className="font-bold text-white mb-2">Queries</h4>
              <p className="text-xs text-white/40 leading-relaxed">Multi-hop traversal, talent clustering, shortest path, skill adjacency, career transitions, hidden gem discovery</p>
            </div>
            <div>
              <div className="text-2xl font-black text-blue-500 mb-2">R</div>
              <h4 className="font-bold text-white mb-2">Recommendation</h4>
              <p className="text-xs text-white/40 leading-relaxed">Relationship-aware matching, similar hires, recruiter preference clusters, multi-hop talent query</p>
            </div>
            <div>
              <div className="text-2xl font-black text-pink-500 mb-2">M</div>
              <h4 className="font-bold text-white mb-2">Migration</h4>
              <p className="text-xs text-white/40 leading-relaxed">Labor flows, talent export clusters, GCC migration analysis, skill gap by location, hotspot mapping</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Observability Tab ────────────────────────────────────────────
function ObservabilityTab() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [approvalStats, setApprovalStats] = useState<any>(null);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [overridePatterns, setOverridePatterns] = useState<any>(null);
  const [blindSpots, setBlindSpots] = useState<any[]>([]);
  const [safetyFlags, setSafetyFlags] = useState<any[]>([]);
  const [safetySummary, setSafetySummary] = useState<any>(null);
  const [threshold, setThreshold] = useState(0.95);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [d, pa, ov, bs, sf, th] = await Promise.allSettled([
        api.getObservabilityDashboard(),
        api.getPendingApprovals(20),
        api.getOverrides(20),
        api.getBlindSpots(),
        api.getSafetyFlags(true),
        api.getConfidenceThreshold(),
      ]);
      if (d.status === "fulfilled") setDashboard(d.value);
      if (pa.status === "fulfilled") { setPendingApprovals(pa.value.approvals); setApprovalStats(pa.value.stats); }
      if (ov.status === "fulfilled") { setOverrides(ov.value.overrides); setOverridePatterns(ov.value.patterns); }
      if (bs.status === "fulfilled") setBlindSpots(bs.value.blindSpots);
      if (sf.status === "fulfilled") { setSafetyFlags(sf.value.flags); setSafetySummary(sf.value.summary); }
      if (th.status === "fulfilled") setThreshold(th.value.threshold);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApprove = async (id: number) => {
    setActionLoading((p) => ({ ...p, [`approve-${id}`]: true }));
    try { await api.approveApproval(id); await fetchAll(); }
    finally { setActionLoading((p) => ({ ...p, [`approve-${id}`]: false })); }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    setActionLoading((p) => ({ ...p, [`reject-${id}`]: true }));
    try { await api.rejectApproval(id, reason); await fetchAll(); }
    finally { setActionLoading((p) => ({ ...p, [`reject-${id}`]: false })); }
  };

  const handleThresholdChange = async (val: number) => {
    setThreshold(val);
    await api.setConfidenceThreshold(val);
  };

  const handleResolveFlag = async (id: number) => {
    setActionLoading((p) => ({ ...p, [`resolve-${id}`]: true }));
    try { await api.resolveSafetyFlag(id); await fetchAll(); }
    finally { setActionLoading((p) => ({ ...p, [`resolve-${id}`]: false })); }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-white/5 rounded-xl" />
        <div className="grid lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  const health = dashboard?.health;
  const decisions = dashboard?.decisions;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Observability</h1>
          <p className="text-white/40 mt-2 font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            AI governance, trust metrics, and human control systems
          </p>
        </div>
        <Button onClick={fetchAll} variant="outline" className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-bold gap-2 px-6">
          <RotateCcw className="h-4 w-4" /> Refresh Dashboard
        </Button>
      </div>

      {/* Agent Health Cards */}
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-black text-white">{health?.activeAgents?.length || 0}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Active Agents</div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-white/40">{health?.totalExecutions || 0} total executions</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-black text-white">{decisions?.totalDecisions || 0}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">AI Decisions</div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-white/40">
              Avg confidence: {decisions?.averageConfidence ? Math.round(decisions.averageConfidence * 100) : 0}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-sm font-black text-white">{decisions?.recruiterTrustScore || 100}%</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Trust Score</div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-white/40">
              {decisions?.overrideRate || 0}% override rate
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${safetySummary?.activeFlags > 0 ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
              <AlertCircle className={`h-5 w-5 ${safetySummary?.activeFlags > 0 ? "text-red-500" : "text-emerald-500"}`} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="text-sm font-black text-white">{safetySummary?.activeFlags || 0}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Active Flags</div>
              </div>
            </div>
            <div className="text-[10px] font-bold text-white/40">
              {safetySummary?.criticalFlags || 0} critical • {safetySummary?.warningFlags || 0} warnings
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals + Override Insights */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Pending Approvals</h3>
            <Badge className="ml-auto bg-amber-500/10 text-amber-400 border-none text-[10px]">
              {approvalStats?.pending || 0} pending
            </Badge>
          </div>
          <CardContent className="p-4 max-h-[420px] overflow-y-auto">
            {pendingApprovals.length > 0 ? (
              <div className="space-y-3">
                {pendingApprovals.map((a: any) => (
                  <div key={a.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-500/10 text-blue-400 border-none text-[9px] font-black uppercase tracking-widest">
                        {a.action_type.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={`rounded-lg px-2 py-0.5 text-[10px] font-black border-none ${
                        a.confidence > 0.8 ? "bg-emerald-500/20 text-emerald-400" :
                        a.confidence > 0.5 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {Math.round(Number(a.confidence) * 100)}% confidence
                      </Badge>
                    </div>
                    {a.ai_suggestion && (
                      <div className="text-xs text-white/60">
                        <span className="font-bold text-white/80">Suggestion: </span>
                        {JSON.stringify(a.ai_suggestion).slice(0, 120)}...
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(a.id)} disabled={actionLoading[`approve-${a.id}`]}
                        className="h-8 px-4 text-[10px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1">
                        {actionLoading[`approve-${a.id}`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                        Approve
                      </Button>
                      <Button size="sm" onClick={() => handleReject(a.id)} disabled={actionLoading[`reject-${a.id}`]}
                        variant="outline" className="h-8 px-4 text-[10px] rounded-lg bg-white/5 border-white/10 text-white/60 hover:text-red-400 font-bold gap-1">
                        <X className="h-3 w-3" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/20">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">No pending approvals</p>
                <p className="text-[10px] mt-1">All AI actions are either trusted or within confidence thresholds</p>
              </div>
            )}
            {approvalStats && (
              <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-4 gap-2 text-center text-[9px]">
                <div><span className="font-black text-emerald-400">{approvalStats.approved || 0}</span><span className="text-white/30"> approved</span></div>
                <div><span className="font-black text-red-400">{approvalStats.rejected || 0}</span><span className="text-white/30"> rejected</span></div>
                <div><span className="font-black text-blue-400">{approvalStats.auto_executed || 0}</span><span className="text-white/30"> auto</span></div>
                <div><span className="font-black text-white/60">{approvalStats.approvalRate || 0}%</span><span className="text-white/30"> rate</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Override Insights</h3>
            <Badge className="ml-auto bg-blue-500/10 text-blue-400 border-none text-[10px]">{overridePatterns?.totalOverrides || 0} total</Badge>
          </div>
          <CardContent className="p-4 max-h-[420px] overflow-y-auto">
            {overridePatterns?.topActionTypes?.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Most Overridden Actions</h4>
                {overridePatterns.topActionTypes.map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-xs font-bold text-white">{a.actionType.replace(/_/g, ' ')}</span>
                    <Badge className="bg-red-500/10 text-red-400 border-none text-[9px]">{a.count}x</Badge>
                  </div>
                ))}
              </div>
            )}
            {overridePatterns?.commonReasons?.length > 0 && (
              <div className="mb-4 pt-4 border-t border-white/5">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Common Reasons</h4>
                <div className="space-y-1">
                  {overridePatterns.commonReasons.slice(0, 5).map((r: string, i: number) => (
                    <div key={i} className="text-[10px] text-white/50 flex items-start gap-2">
                      <span className="text-white/20 mt-0.5">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {overridePatterns?.confidenceAtOverride?.average > 0 && (
              <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-[9px]">
                <div><span className="font-black text-white/80">{Math.round(overridePatterns.confidenceAtOverride.average * 100)}%</span><span className="text-white/30"> avg conf</span></div>
                <div><span className="font-black text-white/80">{Math.round(overridePatterns.confidenceAtOverride.min * 100)}%</span><span className="text-white/30"> min</span></div>
                <div><span className="font-black text-white/80">{Math.round(overridePatterns.confidenceAtOverride.max * 100)}%</span><span className="text-white/30"> max</span></div>
              </div>
            )}
            {blindSpots.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-red-400/60 mb-2">AI Blind Spots</h4>
                <div className="space-y-2">
                  {blindSpots.map((bs: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`border-none text-[8px] font-black uppercase ${bs.severity === "warning" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>{bs.severity}</Badge>
                        <span className="text-[10px] font-bold text-white">{bs.blindSpot}</span>
                      </div>
                      <p className="text-[9px] text-white/40 leading-relaxed">{bs.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!overridePatterns?.totalOverrides || overridePatterns.totalOverrides === 0) && (
              <div className="text-center py-12 text-white/20">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">No overrides recorded</p>
                <p className="text-[10px] mt-1">Recruiter overrides will appear here as the system learns</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Safety Flags + Confidence Threshold */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Safety Flags</h3>
            <Badge className={`ml-auto border-none text-[10px] ${safetySummary?.activeFlags > 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
              {safetySummary?.activeFlags || 0} active
            </Badge>
          </div>
          <CardContent className="p-4 max-h-[350px] overflow-y-auto">
            {safetyFlags.length > 0 ? (
              <div className="space-y-2">
                {safetyFlags.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${f.severity === "critical" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : f.severity === "warning" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-blue-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-white truncate flex items-center gap-2">
                        {f.title}
                        <Badge className={`border-none text-[8px] font-black uppercase ${f.severity === "critical" ? "bg-red-500/20 text-red-400" : f.severity === "warning" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>{f.severity}</Badge>
                      </div>
                      <div className="text-[9px] text-white/30">{f.flag_type.replace(/_/g, ' ')}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleResolveFlag(f.id)}
                      className="h-7 px-2 text-[9px] text-emerald-400 hover:text-emerald-300 rounded-lg font-bold">
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/20">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">No active safety flags</p>
                <p className="text-[10px] mt-1">The system is operating within normal parameters</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Automation Threshold</h3>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-black text-white">{Math.round(threshold * 100)}%</div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Auto-Execute Threshold</div>
                </div>
                <Badge className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase border-none ${threshold >= 0.95 ? "bg-emerald-500/10 text-emerald-400" : threshold >= 0.85 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                  {threshold >= 0.95 ? "Conservative" : threshold >= 0.85 ? "Balanced" : "Aggressive"}
                </Badge>
              </div>
              <input type="range" min="0.5" max="0.99" step="0.01" value={threshold}
                onChange={(e) => handleThresholdChange(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-white/10 accent-blue-500 cursor-pointer" />
              <div className="flex justify-between text-[9px] text-white/30 font-bold mt-2">
                <span>50% (Aggressive)</span>
                <span>99% (Conservative)</span>
              </div>
              <p className="text-[10px] text-white/40 mt-4 leading-relaxed">
                Actions with confidence above this threshold execute automatically.
                Below this threshold, they require recruiter approval.
              </p>
            </CardContent>
          </Card>

          {decisions?.topFactors?.length > 0 && (
            <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Top Decision Factors</h3>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {decisions.topFactors.map((f: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                      <span className="text-[9px] font-black text-white/40 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-white truncate">{f.factor}</div>
                        <div className="h-1.5 rounded-full bg-white/5 mt-1 overflow-hidden">
                          <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(100, f.avgWeight * 100)}%` }} />
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-white/40">{f.count}x</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Documentation */}
      <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-white/5 rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <BrainCircuit className="h-6 w-6 text-blue-400" />
            <h3 className="font-black text-lg text-white">Explainable AI Infrastructure</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-2xl font-black text-emerald-500 mb-2">1</div>
              <h4 className="font-bold text-white mb-2">Structured Reasoning</h4>
              <p className="text-xs text-white/40 leading-relaxed">Every AI decision generates structured reasoning artifacts showing which factors influenced the outcome and by how much.</p>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-500 mb-2">2</div>
              <h4 className="font-bold text-white mb-2">Human Oversight</h4>
              <p className="text-xs text-white/40 leading-relaxed">Approval workflows ensure critical actions require recruiter confirmation. Confidence-based thresholds enable progressive autonomy.</p>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-500 mb-2">3</div>
              <h4 className="font-bold text-white mb-2">Safety Monitoring</h4>
              <p className="text-xs text-white/40 leading-relaxed">Continuous drift detection, bias monitoring, and safety flagging protect against degraded AI performance and unexpected behavior.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Predictive Intelligence Tab ─────────────────────────────────────
function PredictiveIntelligenceTab() {
  const [loading, setLoading] = useState(true);
  const [simHistory, setSimHistory] = useState<any[]>([]);
  const [scenarioHistory, setScenarioHistory] = useState<any[]>([]);
  const [accuracyMap, setAccuracyMap] = useState<Record<string, any>>({});
  const [scenarioStats, setScenarioStats] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [simResult, setSimResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hist, scenarios, acc, sStats] = await Promise.allSettled([
        api.getSimulationHistory(20),
        api.getScenarioHistory(10),
        api.getPredictionAccuracy(),
        api.getScenarioStats(),
      ]);
      if (hist.status === "fulfilled") setSimHistory(hist.value.simulations);
      if (scenarios.status === "fulfilled") setScenarioHistory(scenarios.value.scenarios);
      if (acc.status === "fulfilled") setAccuracyMap(acc.value);
      if (sStats.status === "fulfilled") setScenarioStats(sStats.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRunSimulation = async () => {
    if (!selectedCandidate) return;
    setRunning(true);
    try {
      const cid = parseInt(selectedCandidate);
      const result = await api.simulateAll({ candidateId: cid, employerId: undefined });
      setSimResult(result);
      await fetchAll();
    } catch (err: any) {
      console.error("Simulation failed:", err);
    } finally {
      setRunning(false);
    }
  };

  const allAccuracyEntries = Object.entries(accuracyMap);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-80 bg-white/5 rounded-xl" />
        <div className="grid lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Predictive Intelligence</h1>
          <p className="text-white/40 mt-2 font-medium flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-purple-500" />
            Probabilistic hiring simulations, risk analysis, and what-if scenario modeling
          </p>
        </div>
        <Button onClick={fetchAll} variant="outline" className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-bold gap-2 px-6">
          <RotateCcw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <BrainCircuit className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-sm font-black text-white">{simHistory.length}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Simulations Run</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-black text-white">{allAccuracyEntries.length}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Model Types</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Compass className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-black text-white">{scenarioHistory.length}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Scenarios Modeled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-black text-white">
                  {scenarioStats ? `${(scenarioStats.averageImprovement * 100).toFixed(1)}%` : "—"}
                </div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Avg Scenario Impact</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Run Simulation */}
      <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
          <BrainCircuit className="h-5 w-5 text-purple-500" />
          <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Quick Simulation</h3>
        </div>
        <CardContent className="p-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Candidate ID</label>
              <input
                type="number" placeholder="Enter candidate ID..." value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold
                  placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>
            <Button onClick={handleRunSimulation} disabled={running || !selectedCandidate}
              className="h-12 px-6 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
              {running ? "Running..." : "Run Full Simulation"}
            </Button>
          </div>

          {simResult && (
            <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(simResult).map(([key, val]: [string, any]) => (
                <div key={key} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">{key.replace(/_/g, " ")}</div>
                  <div className="text-2xl font-black text-white mb-1">
                    {Math.round(val.probability * 100)}%
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40">
                    <span>CI: {Math.round(val.confidenceIntervalLower * 100)}–{Math.round(val.confidenceIntervalUpper * 100)}%</span>
                    <span className="text-white/20">|</span>
                    <span>Conf: {Math.round(val.confidence * 100)}%</span>
                  </div>
                  {val.riskFactors?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {val.riskFactors.map((r: string, i: number) => (
                        <Badge key={i} className="bg-red-500/10 text-red-400 border-none text-[8px] font-bold">{r}</Badge>
                      ))}
                    </div>
                  )}
                  {val.positiveFactors?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {val.positiveFactors.map((p: string, i: number) => (
                        <Badge key={i} className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] font-bold">{p}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accuracy Dashboard */}
      {allAccuracyEntries.length > 0 && (
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Prediction Accuracy</h3>
          </div>
          <CardContent className="p-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allAccuracyEntries.map(([type, stats]: [string, any]) => (
                <div key={type} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">{type.replace(/_/g, " ")}</div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-black text-white">{Math.round(stats.accuracyRate * 100)}%</span>
                    <span className="text-[10px] text-white/40">({stats.accuratePredictions}/{stats.totalPredictions})</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 mb-3 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${stats.accuracyRate * 100}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[9px]">
                    <div><span className="font-bold text-white/60">MAE:</span> <span className="text-white/40">{stats.mae.toFixed(3)}</span></div>
                    <div><span className="font-bold text-white/60">RMSE:</span> <span className="text-white/40">{stats.rmse.toFixed(3)}</span></div>
                    <div><span className="font-bold text-white/60">Bias:</span> <span className="text-white/40">{stats.bias?.toFixed(3) || "—"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenario History */}
      {scenarioHistory.length > 0 && (
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Compass className="h-5 w-5 text-emerald-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Recent Scenarios</h3>
          </div>
          <CardContent className="p-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {scenarioHistory.map((s: any) => (
                <div key={s.id} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{s.name}</span>
                    <Badge className="bg-white/5 text-white/40 border-none text-[8px] font-black uppercase">{s.scenario_type?.replace(/_/g, " ")}</Badge>
                  </div>
                  {s.description && <div className="text-[10px] text-white/40 mb-2">{s.description}</div>}
                  {s.parameter_changes && (
                    <div className="text-[9px] text-white/30">
                      Params: {JSON.stringify(s.parameter_changes).slice(0, 120)}
                    </div>
                  )}
                  <div className="text-[9px] text-white/20 mt-1">{new Date(s.executed_at || s.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Simulations */}
      {simHistory.length > 0 && (
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Activity className="h-5 w-5 text-purple-500" />
            <h3 className="font-black text-sm uppercase tracking-widest text-white/60">Recent Simulations</h3>
          </div>
          <CardContent className="p-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-2">
              {simHistory.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                      Number(s.probability) >= 0.7 ? "bg-emerald-500" :
                      Number(s.probability) >= 0.4 ? "bg-amber-500" : "bg-red-500"
                    }`} />
                    <div>
                      <div className="text-[11px] font-bold text-white">{s.simulation_type?.replace(/_/g, " ")}</div>
                      <div className="text-[9px] text-white/30">Candidate #{s.candidate_id || "—"} &middot; {new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white">{Math.round(Number(s.probability) * 100)}%</div>
                    <div className="text-[9px] text-white/30">CI: {Math.round(Number(s.confidence_interval_lower) * 100)}–{Math.round(Number(s.confidence_interval_upper) * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentation */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-white/5 rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <BrainCircuit className="h-6 w-6 text-purple-400" />
            <h3 className="font-black text-lg text-white">Probabilistic Hiring Simulation Engine</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-2xl font-black text-purple-500 mb-2">1</div>
              <h4 className="font-bold text-white mb-2">Monte Carlo Inference</h4>
              <p className="text-xs text-white/40 leading-relaxed">1,000-iteration Monte Carlo simulation with Gaussian noise produces probability distributions with 95% confidence intervals — not point scores.</p>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-500 mb-2">2</div>
              <h4 className="font-bold text-white mb-2">Graph-Powered Factors</h4>
              <p className="text-xs text-white/40 leading-relaxed">Each simulation consumes weighted factors from the Neo4j knowledge graph: skill adjacency, migration stability, recruiter preferences, industry demand, and intent signals.</p>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-500 mb-2">3</div>
              <h4 className="font-bold text-white mb-2">Self-Calibrating</h4>
              <p className="text-xs text-white/40 leading-relaxed">Outcome learner tracks actual vs predicted, computes MAE/RMSE/bias, and surfaces calibration drift over time for continuous improvement.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Labor Intelligence Tab ─────────────────────────────────────
function LaborIntelligenceTab() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [skillSummary, setSkillSummary] = useState<any>(null);
  const [ecosystem, setEcosystem] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, sk, ec] = await Promise.allSettled([
        api.getLaborSummary(90),
        api.getSkillEconomySummary(),
        api.getEcosystemHealth(),
      ]);
      if (s.status === "fulfilled") setSummary(s.value);
      if (sk.status === "fulfilled") setSkillSummary(sk.value);
      if (ec.status === "fulfilled") setEcosystem(ec.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const s = await api.refreshLaborIntelligence(90);
      setSummary(s);
      const ec = await api.getEcosystemHealth();
      setEcosystem(ec);
      const sk = await api.getSkillEconomySummary();
      setSkillSummary(sk);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionProfile = async () => {
    if (!selectedRegion) return;
    try {
      const profile = await api.getRegionalProfile(selectedRegion);
      alert(JSON.stringify(profile, null, 2));
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-80 bg-white/5 rounded-xl" />
        <div className="grid lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  const health = ecosystem;
  const demandCount = summary?.demandIntelligence?.length || 0;
  const supplyCount = summary?.supplyIntelligence?.length || 0;
  const skillCount = summary?.skillEconomy?.length || 0;
  const regionCount = summary?.regionalProfiles?.length || 0;

  const migrationFlows = summary?.workforceFlows?.migration || [];
  const industryFlows = summary?.workforceFlows?.industry_transitions || [];
  const skillFlows = summary?.workforceFlows?.skill_transitions || [];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Labor Intelligence</h1>
          <p className="text-white/40 mt-2 font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            Macro workforce analytics — demand, supply, migration, and ecosystem health
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="rounded-xl h-12 bg-white/5 border-white/10 text-white font-bold gap-2 px-6">
          <RotateCcw className="h-4 w-4" /> Refresh Intelligence
        </Button>
      </div>

      {/* Ecosystem Health Cards */}
      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                (health?.overallHealth || 0) >= 0.6 ? "bg-emerald-500/20" :
                (health?.overallHealth || 0) >= 0.3 ? "bg-amber-500/20" : "bg-red-500/20"
              }`}>
                <Globe className={`h-4 w-4 ${(health?.overallHealth || 0) >= 0.6 ? "text-emerald-500" : (health?.overallHealth || 0) >= 0.3 ? "text-amber-500" : "text-red-500"}`} />
              </div>
              <div>
                <div className="text-lg font-black text-white">{Math.round((health?.overallHealth || 0) * 100)}%</div>
                <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Ecosystem Health</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{Math.round((health?.marketEfficiency || 0) * 100)}%</div>
                <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Market Efficiency</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{Math.round((health?.laborMobility || 0) * 100)}%</div>
                <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Labor Mobility</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Compass className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{Math.round((health?.skillAdaptability || 0) * 100)}%</div>
                <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Skill Adaptability</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Activity className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{Math.round((health?.migrationActivity || 0) * 100)}%</div>
                <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Migration Activity</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demand + Supply Overview */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <h3 className="font-black text-xs uppercase tracking-widest text-white/60">Demand Intelligence</h3>
            <Badge className="ml-auto bg-blue-500/10 text-blue-400 border-none text-[9px]">{demandCount} roles</Badge>
          </div>
          <CardContent className="p-4 max-h-[350px] overflow-y-auto">
            {summary?.demandIntelligence?.slice(0, 10).map((d: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">{d.role}</div>
                  <div className="text-[8px] text-white/30">{d.region} &middot; {d.industry}</div>
                </div>
                <div className="text-right ml-3">
                  <div className="text-sm font-black text-white">{d.demandCount}</div>
                  <div className={`text-[8px] font-bold ${d.growthRate > 0 ? "text-emerald-400" : d.growthRate < 0 ? "text-red-400" : "text-white/30"}`}>
                    {d.growthRate > 0 ? "+" : ""}{d.growthRate}%
                  </div>
                </div>
              </div>
            ))}
            {demandCount === 0 && <div className="text-center py-8 text-white/20 text-sm font-bold">No demand data yet</div>}
          </CardContent>
        </Card>

        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Users className="h-4 w-4 text-purple-500" />
            <h3 className="font-black text-xs uppercase tracking-widest text-white/60">Supply Intelligence</h3>
            <Badge className="ml-auto bg-purple-500/10 text-purple-400 border-none text-[9px]">{supplyCount} entries</Badge>
          </div>
          <CardContent className="p-4 max-h-[350px] overflow-y-auto">
            {summary?.supplyIntelligence?.slice(0, 10).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">{s.skill}</div>
                  <div className="text-[8px] text-white/30">{s.region}</div>
                </div>
                <div className="text-right ml-3">
                  <div className="text-sm font-black text-white">{s.candidateCount}</div>
                  <div className="text-[8px] text-white/30">{Math.round(s.relocationReadiness * 100)}% ready</div>
                </div>
              </div>
            ))}
            {supplyCount === 0 && <div className="text-center py-8 text-white/20 text-sm font-bold">No supply data yet</div>}
          </CardContent>
        </Card>
      </div>

      {/* Workforce Flows */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Globe className="h-4 w-4 text-amber-500" />
            <h3 className="font-black text-xs uppercase tracking-widest text-white/60">Migration Flows</h3>
            <Badge className="ml-auto bg-amber-500/10 text-amber-400 border-none text-[9px]">{migrationFlows.length}</Badge>
          </div>
          <CardContent className="p-4 max-h-[280px] overflow-y-auto">
            {migrationFlows.slice(0, 8).map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 mb-1.5">
                <div className="text-[9px] font-bold text-white/80 truncate">{f.sourceRegion} → {f.destinationRegion}</div>
                <Badge className="bg-white/5 text-white/40 border-none text-[8px]">{f.flowVolume}</Badge>
              </div>
            ))}
            {migrationFlows.length === 0 && <div className="text-center py-6 text-white/20 text-[11px] font-bold">No migration flows</div>}
          </CardContent>
        </Card>

        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Network className="h-4 w-4 text-blue-500" />
            <h3 className="font-black text-xs uppercase tracking-widest text-white/60">Industry Transitions</h3>
            <Badge className="ml-auto bg-blue-500/10 text-blue-400 border-none text-[9px]">{industryFlows.length}</Badge>
          </div>
          <CardContent className="p-4 max-h-[280px] overflow-y-auto">
            {industryFlows.slice(0, 8).map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 mb-1.5">
                <div className="text-[9px] font-bold text-white/80 truncate">{f.sourceIndustry} → {f.destinationIndustry}</div>
                <Badge className="bg-white/5 text-white/40 border-none text-[8px]">{f.flowVolume}</Badge>
              </div>
            ))}
            {industryFlows.length === 0 && <div className="text-center py-6 text-white/20 text-[11px] font-bold">No industry transitions</div>}
          </CardContent>
        </Card>

        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <GitBranch className="h-4 w-4 text-emerald-500" />
            <h3 className="font-black text-xs uppercase tracking-widest text-white/60">Skill Transitions</h3>
            <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-none text-[9px]">{skillFlows.length}</Badge>
          </div>
          <CardContent className="p-4 max-h-[280px] overflow-y-auto">
            {skillFlows.slice(0, 8).map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 mb-1.5">
                <div className="text-[9px] font-bold text-white/80 truncate">{f.sourceSkill} → {f.destinationSkill}</div>
                <Badge className="bg-white/5 text-white/40 border-none text-[8px]">{f.flowVolume}</Badge>
              </div>
            ))}
            {skillFlows.length === 0 && <div className="text-center py-6 text-white/20 text-[11px] font-bold">No skill transitions</div>}
          </CardContent>
        </Card>
      </div>

      {/* Skill Economy + Regional Explorer */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h3 className="font-black text-xs uppercase tracking-widest text-white/60">Skill Economy</h3>
            <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-none text-[9px]">{skillCount} skills</Badge>
          </div>
          <CardContent className="p-4">
            {skillSummary && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-xl font-black text-emerald-500">{skillSummary.rising}</div>
                  <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Rising</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-xl font-black text-red-500">{skillSummary.declining}</div>
                  <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Declining</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-xl font-black text-purple-500">{skillSummary.emerging}</div>
                  <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Emerging</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-xl font-black text-white">{skillSummary.total}</div>
                  <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Total Tracked</div>
                </div>
              </div>
            )}
            {skillSummary?.topRising?.length > 0 && (
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Top Rising Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {skillSummary.topRising.map((s: string, i: number) => (
                    <Badge key={i} className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] font-bold">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {skillSummary?.topDeclining?.length > 0 && (
              <div className="mt-3">
                <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Declining Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {skillSummary.topDeclining.map((s: string, i: number) => (
                    <Badge key={i} className="bg-red-500/10 text-red-400 border-none text-[8px] font-bold">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#0f1115] border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
            <Database className="h-4 w-4 text-blue-500" />
            <h3 className="font-black text-xs uppercase tracking-widest text-white/60">Regional Explorer</h3>
          </div>
          <CardContent className="p-5">
            <div className="flex items-end gap-3 mb-4">
              <div className="flex-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-white/40 block mb-2">Region Name</label>
                <input
                  type="text" placeholder="e.g. Doha, Dubai, Nairobi..." value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold
                    placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <Button onClick={handleRegionProfile} disabled={!selectedRegion}
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] gap-1.5">
                <Search className="h-3 w-3" /> Profile
              </Button>
            </div>
            {summary?.regionalProfiles && summary.regionalProfiles.length > 0 && (
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Recent Snapshots</div>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {summary.regionalProfiles.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <div>
                        <div className="text-[10px] font-bold text-white">{r.region}</div>
                        <div className="text-[8px] text-white/30">Demand: {Math.round(r.demandIndex * 100)}% &middot; Supply: {Math.round(r.supplyIndex * 100)}%</div>
                      </div>
                      <div className={`text-[10px] font-black ${r.talentScarcityScore > 0.6 ? "text-red-400" : "text-emerald-400"}`}>
                        {Math.round(r.talentScarcityScore * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documentation */}
      <Card className="bg-gradient-to-br from-emerald-900/30 to-blue-900/30 border-white/5 rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-6 w-6 text-emerald-400" />
            <h3 className="font-black text-lg text-white">Labor Market Intelligence Platform</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-2xl font-black text-emerald-500 mb-2">1</div>
              <h4 className="font-bold text-white mb-2">Demand + Supply Analytics</h4>
              <p className="text-xs text-white/40 leading-relaxed">Real-time hiring demand by role, region, and industry with growth rates, sponsorship demand, and urgency scoring.</p>
            </div>
            <div>
              <div className="text-2xl font-black text-blue-500 mb-2">2</div>
              <h4 className="font-bold text-white mb-2">Workforce Flow Intelligence</h4>
              <p className="text-xs text-white/40 leading-relaxed">Migration corridors, industry transitions, and skill adjacency pathways graph-derived from Neo4j workforce relationships.</p>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-500 mb-2">3</div>
              <h4 className="font-bold text-white mb-2">Ecosystem Health Monitoring</h4>
              <p className="text-xs text-white/40 leading-relaxed">Six-dimension ecosystem health metric tracks market efficiency, labor mobility, skill adaptability, employer confidence, and migration activity.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Phase 9B: Migration Intelligence Tab ──────────────────────

function MigrationIntelligenceTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [topCorridors, setTopCorridors] = useState<any[]>([]);
  const [corridorHealths, setCorridorHealths] = useState<any[]>([]);
  const [activeRisks, setActiveRisks] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedDest, setSelectedDest] = useState("");
  const [corridorResult, setCorridorResult] = useState<any>(null);
  const [healthResult, setHealthResult] = useState<any>(null);
  const [riskResult, setRiskResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, corridorsData, healthsData, risksData] = await Promise.allSettled([
        api.getMigrationStats(),
        api.getTopCorridors(10),
        api.getAllCorridorHealths(),
        api.getActiveMigrationRisks(10),
      ]);
      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (corridorsData.status === "fulfilled") setTopCorridors(corridorsData.value.corridors);
      if (healthsData.status === "fulfilled") setCorridorHealths(healthsData.value.corridors);
      if (risksData.status === "fulfilled") setActiveRisks(risksData.value.risks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAnalyzeCorridor = async () => {
    if (!selectedSource || !selectedDest) return;
    setAnalyzing(true);
    try {
      const [intel, health] = await Promise.all([
        api.analyzeCorridor(selectedSource, selectedDest),
        api.assessCorridorHealth(selectedSource, selectedDest),
      ]);
      setCorridorResult(intel);
      setHealthResult(health);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAssessRisk = async (type: string) => {
    if (!selectedSource || !selectedDest) return;
    setAnalyzing(true);
    try {
      let result;
      if (type === "instability") {
        result = await api.assessCorridorInstability(selectedSource, selectedDest);
      } else if (type === "churn") {
        result = await api.assessHighChurnCorridor(selectedSource, selectedDest);
      }
      setRiskResult(result);
      fetchAll();
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-white/60">Loading migration intelligence...</span>
      </div>
    );
  }

  const scoreColor = (s: number) =>
    s >= 0.7 ? "text-emerald-400" : s >= 0.5 ? "text-amber-400" : "text-red-400";

  const riskBadge = (level: string) => {
    const colors: Record<string, string> = {
      low: "bg-emerald-500/20 text-emerald-400",
      medium: "bg-amber-500/20 text-amber-400",
      high: "bg-red-500/20 text-red-400",
      critical: "bg-rose-500/20 text-rose-400",
    };
    return colors[level] || "bg-gray-500/20 text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Migration Intelligence</h2>
          <p className="text-sm text-white/40 mt-1">
            Corridor intelligence, sponsorship analytics, stability assessment, and risk detection
          </p>
        </div>
        <Button onClick={fetchAll} variant="outline" size="sm" className="border-white/10 text-white/60">
          <RotateCcw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="text-xs text-white/40 mb-1">Total Events</div>
              <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="text-xs text-white/40 mb-1">Active Corridors</div>
              <div className="text-2xl font-bold text-white">{stats.totalCorridors}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="text-xs text-white/40 mb-1">Avg Health Score</div>
              <div className={`text-2xl font-bold ${scoreColor(stats.averageHealthScore)}`}>
                {Math.round(stats.averageHealthScore * 100)}%
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="text-xs text-white/40 mb-1">Top Source</div>
              <div className="text-lg font-bold text-white truncate">{stats.topSource}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="text-xs text-white/40 mb-1">Top Destination</div>
              <div className="text-lg font-bold text-white truncate">{stats.topDestination}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Corridor Analyzer */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-5">
          <h3 className="text-lg font-bold text-white mb-4">Corridor Analyzer</h3>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Source country (e.g. uganda)"
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-white/20"
            />
            <input
              type="text"
              placeholder="Destination country (e.g. qatar)"
              value={selectedDest}
              onChange={e => setSelectedDest(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-white/20"
            />
            <Button onClick={handleAnalyzeCorridor} disabled={analyzing || !selectedSource || !selectedDest} size="sm">
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Compass className="w-4 h-4 mr-1" />}
              Analyze
            </Button>
          </div>

          {corridorResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Demand", value: corridorResult.demandScore },
                { label: "Supply", value: corridorResult.supplyScore },
                { label: "Sponsorship", value: corridorResult.sponsorshipEase },
                { label: "Stability", value: corridorResult.migrationStability },
                { label: "Retention", value: corridorResult.retentionQuality },
                { label: "Salary Uplift", value: corridorResult.salaryUplift },
                { label: "Employer Conf.", value: corridorResult.employerConfidence },
                { label: "Health", value: corridorResult.healthScore },
              ].map(m => (
                <div key={m.label} className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/40">{m.label}</div>
                  <div className={`text-lg font-bold ${scoreColor(m.value)}`}>
                    {typeof m.value === "number" ? `${Math.round(m.value * 100)}%` : m.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {corridorResult && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/40 mb-1">Migrated: <span className="text-white">{corridorResult.totalMigrated}</span></div>
                <div className="text-white/40 mb-1">Pipeline: <span className="text-white">{corridorResult.activeInPipeline}</span></div>
              </div>
              <div>
                {corridorResult.topSkillsExported?.length > 0 && (
                  <div className="mb-2">
                    <span className="text-white/40">Top Skills: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {corridorResult.topSkillsExported.slice(0, 5).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs border-white/10 text-white/60">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {corridorResult.topRolesDemanded?.length > 0 && (
                  <div>
                    <span className="text-white/40">Top Roles: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {corridorResult.topRolesDemanded.slice(0, 5).map((r: string) => (
                        <Badge key={r} variant="outline" className="text-xs border-white/10 text-white/60">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk Assessment Buttons */}
          {corridorResult && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
              <Button size="sm" variant="outline" className="border-white/10 text-white/60"
                onClick={() => handleAssessRisk("instability")} disabled={analyzing}>
                <Shield className="w-4 h-4 mr-1" /> Assess Instability
              </Button>
              <Button size="sm" variant="outline" className="border-white/10 text-white/60"
                onClick={() => handleAssessRisk("churn")} disabled={analyzing}>
                <Activity className="w-4 h-4 mr-1" /> Assess Churn
              </Button>
            </div>
          )}

          {riskResult && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-bold text-white">{riskResult.riskType}</span>
                <Badge className={riskBadge(riskResult.riskLevel)}>{riskResult.riskLevel}</Badge>
                <span className="text-sm text-white/60">Score: {Math.round(riskResult.riskScore * 100)}%</span>
              </div>
              {riskResult.contributingFactors?.length > 0 && (
                <ul className="text-xs text-white/40 list-disc pl-4 mb-2">
                  {riskResult.contributingFactors.map((f: string) => <li key={f}>{f}</li>)}
                </ul>
              )}
              {riskResult.mitigationSuggestions?.length > 0 && (
                <div className="text-xs text-emerald-400/80">
                  Suggestions: {riskResult.mitigationSuggestions.join("; ")}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Corridor Health Detail */}
      {healthResult && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <h3 className="text-lg font-bold text-white mb-3">
              Corridor Health — {healthResult.sourceCountry} → {healthResult.destinationCountry}
              <Badge className={`ml-2 ${riskBadge(healthResult.riskLevel)}`}>{healthResult.riskLevel}</Badge>
              <span className="ml-2 text-sm text-white/40 font-normal">{healthResult.summary}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(healthResult.dimensions).map(([key, val]: any) => (
                <div key={key} className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/40 capitalize">{key.replace(/([A-Z])/g, " $1")}</div>
                  <div className="text-lg font-bold text-white">{Math.round(val.score * 100)}%</div>
                  <div className="text-xs text-white/30">{val.trend}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
              <div><span className="text-white/40">Approval Rate:</span> <span className="text-white">{Math.round(healthResult.approvalRate * 100)}%</span></div>
              <div><span className="text-white/40">Migrated:</span> <span className="text-white">{healthResult.totalMigrated}</span></div>
              <div><span className="text-white/40">Pipeline:</span> <span className="text-white">{healthResult.activePipeline}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Corridors */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-5">
          <h3 className="text-lg font-bold text-white mb-3">Top Corridors</h3>
          <div className="space-y-2">
            {topCorridors.map((c, i) => (
              <div key={`${c.sourceCountry}-${c.destinationCountry}`}
                className="flex items-center justify-between bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition"
                onClick={() => { setSelectedSource(c.sourceCountry); setSelectedDest(c.destinationCountry); }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/20 w-5">{i + 1}.</span>
                  <div>
                    <span className="text-sm font-bold text-white">{c.sourceCountry}</span>
                    <ArrowRight className="w-3 h-3 inline mx-2 text-white/20" />
                    <span className="text-sm font-bold text-white">{c.destinationCountry}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className={`font-bold ${scoreColor(c.healthScore)}`}>{Math.round(c.healthScore * 100)}%</span>
                  <span className="text-white/40 text-xs">{c.totalMigrated} migrated</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Risks */}
      {activeRisks.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <h3 className="text-lg font-bold text-white mb-3">Active Risks</h3>
            <div className="space-y-2">
              {activeRisks.map((r: any) => (
                <div key={r.id} className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-bold text-white">{r.riskType.replace(/_/g, " ")}</span>
                      <Badge className={riskBadge(r.riskLevel)}>{r.riskLevel}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">Score: {Math.round(r.riskScore * 100)}%</span>
                      <Button size="sm" variant="ghost" className="h-6 text-xs text-white/40"
                        onClick={async () => { await api.resolveMigrationRisk(r.id); fetchAll(); }}>
                        Resolve
                      </Button>
                    </div>
                  </div>
                  {r.contributingFactors?.length > 0 && (
                    <div className="text-xs text-white/40 ml-6">
                      Factors: {r.contributingFactors.slice(0, 2).join("; ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Corridor Health List */}
      {corridorHealths.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <h3 className="text-lg font-bold text-white mb-3">All Corridor Health Scores</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs border-b border-white/10">
                    <th className="text-left py-2 pr-4">Corridor</th>
                    <th className="text-left py-2 pr-4">Health</th>
                    <th className="text-left py-2 pr-4">Risk</th>
                    <th className="text-left py-2 pr-4">Migrated</th>
                    <th className="text-left py-2 pr-4">Pipeline</th>
                    <th className="text-left py-2 pr-4">Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {corridorHealths.map((h: any) => (
                    <tr key={`${h.sourceCountry}-${h.destinationCountry}`}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                      onClick={() => { setSelectedSource(h.sourceCountry); setSelectedDest(h.destinationCountry); }}>
                      <td className="py-2 pr-4 text-white">
                        {h.sourceCountry} <ArrowRight className="w-3 h-3 inline mx-1 text-white/20" /> {h.destinationCountry}
                      </td>
                      <td className={`py-2 pr-4 font-bold ${scoreColor(h.healthScore)}`}>{Math.round(h.healthScore * 100)}%</td>
                      <td className="py-2 pr-4"><Badge className={riskBadge(h.riskLevel)}>{h.riskLevel}</Badge></td>
                      <td className="py-2 pr-4 text-white/60">{h.totalMigrated}</td>
                      <td className="py-2 pr-4 text-white/60">{h.activePipeline}</td>
                      <td className="py-2 pr-4 text-white/60">{Math.round(h.approvalRate * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
