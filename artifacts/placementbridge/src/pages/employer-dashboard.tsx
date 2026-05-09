import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Briefcase, Users, MessageSquare, BarChart3,
  Settings, Bell, Search, Menu, X, ChevronDown, Plus,
  Clock, Star, FileText, Eye, CheckCircle2, Plane,
  Calendar, Download, Filter, MoreVertical, TrendingUp,
  UserPlus, Sparkles, ShieldCheck, Globe, DollarSign,
  BrainCircuit, Building2, LogOut, Moon, Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabId = "overview" | "jobs" | "candidates" | "messages" | "analytics" | "team";

const navItems: { id: TabId; label: string; icon: React.ElementType; count?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs", icon: Briefcase, count: "12" },
  { id: "candidates", label: "Candidates", icon: Users, count: "48" },
  { id: "messages", label: "Messages", icon: MessageSquare, count: "5" },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "team", label: "Team", icon: Building2 },
];

const recentApplicants = [
  { name: "Joseph Okello", role: "Construction Foreman", matchScore: 96, status: "Shortlisted", avatar: "JO", time: "2h ago" },
  { name: "Sarah Kemigisha", role: "Security Guard", matchScore: 92, status: "Reviewed", avatar: "SK", time: "4h ago" },
  { name: "Ahmed Hassan", role: "Electrician", matchScore: 88, status: "Applied", avatar: "AH", time: "6h ago" },
  { name: "Grace Nantongo", role: "Domestic Worker", matchScore: 85, status: "Interviewed", avatar: "GN", time: "1d ago" },
  { name: "David Okello", role: "Driver", matchScore: 82, status: "Hired", avatar: "DO", time: "2d ago" },
];

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen bg-gray-50 ${darkMode ? "dark" : ""}`}>
      {/* Mobile Sidebar Overlay */}
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

      {/* Sidebar */}
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
                AK
              </div>
              <div>
                <div className="text-sm font-medium text-white">Ahmed Co.</div>
                <div className="text-xs text-white/50">Enterprise Plan</div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Bar */}
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

        {/* Page Content */}
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

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-black text-gray-800">Employer Dashboard</h1>
        <p className="text-gray-500 mt-1">Here's your hiring overview for today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Jobs", value: "12", change: "+2", icon: Briefcase, color: "text-blue-600", bgColor: "bg-blue-50" },
          { label: "Total Applicants", value: "48", change: "+12", icon: Users, color: "text-indigo-600", bgColor: "bg-indigo-50" },
          { label: "Interviews This Week", value: "8", change: "+3", icon: Calendar, color: "text-amber-600", bgColor: "bg-amber-50" },
          { label: "AI Matches Today", value: "24", change: "+8", icon: Sparkles, color: "text-emerald-600", bgColor: "bg-emerald-50" },
        ].map((stat) => (
          <Card key={stat.label} className="border-gray-100 card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-black text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Recommendations */}
      <Card className="border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="h-5 w-5 text-blue-200" />
                <span className="text-white font-bold">AI Hiring Recommendations</span>
              </div>
              <p className="text-blue-100 text-sm mb-4 max-w-xl">
                Based on your recent hiring patterns, we found 12 highly-matched candidates for your
                Construction Foreman position. All candidates are visa-ready and available within 2 weeks.
              </p>
              <Button className="bg-white text-blue-700 hover:bg-blue-50 rounded-full px-6 h-10 font-semibold shadow-lg">
                <Sparkles className="h-4 w-4 mr-2" />
                View AI Matches
              </Button>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-black text-white">96%</div>
                <div className="text-xs text-blue-200">Match Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-white">48h</div>
                <div className="text-xs text-blue-200">Avg. Hire Time</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Applicants */}
      <Card className="border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">Recent Applicants</h2>
            <Button variant="outline" className="rounded-full text-sm h-9 gap-1">
              <Eye className="h-4 w-4" />
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {recentApplicants.map((applicant) => (
              <div key={applicant.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 group hover:bg-gray-50 rounded-xl px-3 -mx-3 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {applicant.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{applicant.name}</div>
                    <div className="text-sm text-gray-500">{applicant.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-sm font-bold text-emerald-600">{applicant.matchScore}%</span>
                  </div>
                  <Badge className={
                    applicant.status === "Shortlisted" ? "bg-amber-100 text-amber-700 border-amber-200" :
                    applicant.status === "Reviewed" ? "bg-blue-100 text-blue-700 border-blue-200" :
                    applicant.status === "Applied" ? "bg-gray-100 text-gray-600 border-gray-200" :
                    applicant.status === "Interviewed" ? "bg-purple-100 text-purple-700 border-purple-200" :
                    "bg-emerald-100 text-emerald-700 border-emerald-200"
                  }>
                    {applicant.status}
                  </Badge>
                  <span className="text-xs text-gray-400 hidden lg:block">{applicant.time}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Preview */}
      <Card className="border-gray-100">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Hiring Pipeline</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {["Applied", "Reviewed", "Shortlisted", "Interviewed", "Hired", "Deployed"].map((stage, i) => (
              <div key={stage} className="text-center bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className={`text-2xl font-black mb-1 ${
                  i <= 1 ? "text-blue-600" : i <= 3 ? "text-amber-600" : "text-emerald-600"
                }`}>
                  {[48, 32, 18, 12, 8, 5][i]}
                </div>
                <div className="text-xs text-gray-500 font-medium">{stage}</div>
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

function JobsTab() {
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

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Job Title", "Status", "Applicants", "AI Matches", "Posted", "Actions"].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { title: "Construction Foreman", status: "Active", applicants: 18, matches: 12, posted: "2 days ago" },
                { title: "Security Guard", status: "Active", applicants: 24, matches: 8, posted: "5 days ago" },
                { title: "Electrician", status: "Active", applicants: 9, matches: 6, posted: "1 week ago" },
                { title: "Domestic Worker", status: "Paused", applicants: 15, matches: 10, posted: "2 weeks ago" },
                { title: "Software Engineer", status: "Draft", applicants: 0, matches: 0, posted: "-" },
              ].map((job) => (
                <tr key={job.title} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">{job.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={
                      job.status === "Active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      job.status === "Paused" ? "bg-amber-100 text-amber-700 border-amber-200" :
                      "bg-gray-100 text-gray-600 border-gray-200"
                    }>
                      {job.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{job.applicants}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-sm text-gray-600">{job.matches}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{job.posted}</td>
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
    </div>
  );
}

function CandidatesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-black text-gray-800">Candidate Pool</h1>
          <p className="text-gray-500 mt-1">Browse and manage verified candidates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full h-10 gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 shadow-lg shadow-blue-600/20 gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Candidates
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentApplicants.map((c) => (
          <Card key={c.name} className="border-gray-100 card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {c.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{c.name}</div>
                    <div className="text-sm text-gray-500">{c.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-bold text-emerald-600">{c.matchScore}%</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {["Passport ✓", "Medical ✓", "Visa Ready"].map((badge) => (
                  <Badge key={badge} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs rounded-full">
                    {badge}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  {c.time}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0">
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 px-4 text-xs">
                    View Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MessagesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-black text-gray-800">Messages</h1>
        <p className="text-gray-500 mt-1">Communicate with candidates and recruiters</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid md:grid-cols-3 h-[600px]">
          <div className="border-r border-gray-100 overflow-y-auto">
            {[
              { name: "Joseph Okello", msg: "Thank you for the opportunity!", time: "2m ago", unread: true },
              { name: "Sarah Kemigisha", msg: "I'm available for an interview anytime.", time: "1h ago", unread: true },
              { name: "Ahmed Hassan", msg: "When can I start?", time: "3h ago", unread: false },
              { name: "Grace Nantongo", msg: "I have all my documents ready.", time: "1d ago", unread: false },
              { name: "David Okello", msg: "Looking forward to joining the team.", time: "2d ago", unread: false },
            ].map((chat) => (
              <div key={chat.name} className={`flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 border-b border-gray-50 ${chat.unread ? "bg-blue-50/50" : ""}`}>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {chat.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${chat.unread ? "font-bold text-gray-800" : "font-medium text-gray-600"}`}>{chat.name}</span>
                    <span className="text-xs text-gray-400">{chat.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{chat.msg}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="col-span-2 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Select a conversation</p>
              <p className="text-sm text-gray-400">Choose a candidate to start messaging</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-black text-gray-800">Recruitment Analytics</h1>
        <p className="text-gray-500 mt-1">Track your hiring performance and metrics</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Hiring Funnel
            </h3>
            <div className="space-y-4">
              {[
                { stage: "Applications", count: 48, pct: 100 },
                { stage: "Screened", count: 32, pct: 67 },
                { stage: "Shortlisted", count: 18, pct: 38 },
                { stage: "Interviewed", count: 12, pct: 25 },
                { stage: "Offers Sent", count: 8, pct: 17 },
                { stage: "Hired", count: 5, pct: 10 },
              ].map((item) => (
                <div key={item.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.stage}</span>
                    <span className="font-semibold text-gray-800">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Source Breakdown
            </h3>
            <div className="space-y-4">
              {[
                { source: "AI Matching", count: 22, pct: 46, color: "bg-blue-500" },
                { source: "Direct Apply", count: 14, pct: 29, color: "bg-indigo-500" },
                { source: "Referral", count: 7, pct: 15, color: "bg-emerald-500" },
                { source: "Agency", count: 5, pct: 10, color: "bg-amber-500" },
              ].map((item) => (
                <div key={item.source}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.source}</span>
                    <span className="font-semibold text-gray-800">{item.count} ({item.pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Time to Hire", value: "12 days" },
                  { label: "Cost per Hire", value: "$450" },
                  { label: "Acceptance Rate", value: "92%" },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="text-xl font-black text-gray-800">{m.value}</div>
                    <div className="text-xs text-gray-500">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeamTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-black text-gray-800">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage recruiters and team members</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 shadow-lg shadow-blue-600/20 gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card className="border-gray-100">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Name", "Role", "Status", "Jobs Assigned", "Hires This Month", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Ahmed Khalid", role: "Admin", status: "Active", jobs: 12, hires: 8 },
                  { name: "Fatima Ali", role: "Recruiter", status: "Active", jobs: 6, hires: 4 },
                  { name: "Omar Hassan", role: "Recruiter", status: "Away", jobs: 4, hires: 2 },
                  { name: "Layla Ibrahim", role: "Coordinator", status: "Active", jobs: 3, hires: 1 },
                ].map((member) => (
                  <tr key={member.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-semibold text-gray-800">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.role}</td>
                    <td className="px-6 py-4">
                      <Badge className={
                        member.status === "Active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                        "bg-amber-100 text-amber-700 border-amber-200"
                      }>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.jobs}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">{member.hires}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" className="rounded-full h-8">
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
