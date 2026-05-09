import { useState, useEffect, useRef } from "react"
import { Link } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, BookOpen, FileText, Video, Award, Code, Globe, Shield,
  TrendingUp, Star, ChevronRight, Download, Users, Sparkles,
  Brain, FileCheck, FileSpreadsheet, Calculator, MapPin, GraduationCap,
  Briefcase, Lock, Heart, AlertTriangle, ChevronDown, ExternalLink,
  Calendar, Clock, Bookmark, ThumbsUp, MessageCircle, Share2, Play,
  ArrowRight, CheckCircle, BookmarkPlus, Zap, Target, Compass,
  BarChart3, ScrollText, Scale, Building2, Plane, Eye,
  X, ChevronLeft, SlidersHorizontal, Filter, Clock4, ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"

const categories = [
  { icon: FileText, label: "Resume Writing", color: "from-blue-500 to-blue-600", count: 24 },
  { icon: MessageCircle, label: "Interview Preparation", color: "from-purple-500 to-purple-600", count: 31 },
  { icon: TrendingUp, label: "Career Growth", color: "from-green-500 to-green-600", count: 18 },
  { icon: Globe, label: "Remote Jobs", color: "from-cyan-500 to-cyan-600", count: 15 },
  { icon: GraduationCap, label: "Scholarships", color: "from-pink-500 to-pink-600", count: 12 },
  { icon: Award, label: "Certifications", color: "from-amber-500 to-amber-600", count: 28 },
  { icon: Code, label: "Coding Skills", color: "from-indigo-500 to-indigo-600", count: 22 },
  { icon: Briefcase, label: "Engineering", color: "from-orange-500 to-orange-600", count: 19 },
  { icon: Building2, label: "Telecom Careers", color: "from-teal-500 to-teal-600", count: 11 },
  { icon: BarChart3, label: "Business & Entrepreneurship", color: "from-red-500 to-red-600", count: 16 },
  { icon: Plane, label: "Visa & Relocation", color: "from-violet-500 to-violet-600", count: 27 },
  { icon: Users, label: "Freelancing", color: "from-lime-500 to-lime-600", count: 14 },
  { icon: Scale, label: "Gulf Labor Laws", color: "from-yellow-500 to-yellow-600", count: 43 },
  { icon: Shield, label: "Worker Rights", color: "from-rose-500 to-rose-600", count: 36 },
  { icon: AlertTriangle, label: "Scam Awareness", color: "from-orange-600 to-red-600", count: 9 },
  { icon: Zap, label: "AI & Automation", color: "from-sky-500 to-sky-600", count: 21 },
]

const trendingResources = [
  { title: "Qatar Labor Law Explained for Foreign Workers", category: "Labor Law", views: "12.4K", tag: "Hot" },
  { title: "ATS-Friendly Resume Template 2026", category: "Resume Writing", views: "9.8K", tag: "Popular" },
  { title: "UAE End of Service Gratuity Calculator", category: "Career Tools", views: "8.2K", tag: "Trending" },
  { title: "Top 20 Interview Questions for Gulf Jobs", category: "Interview Prep", views: "7.6K", tag: "New" },
  { title: "How to Get a Work Visa in Qatar", category: "Visa Guides", views: "6.9K", tag: "Hot" },
]

const aiTools = [
  { icon: FileCheck, name: "AI Resume Analyzer", desc: "Get instant feedback on your CV with AI-powered analysis", color: "from-blue-500 to-cyan-500", popular: true },
  { icon: FileSpreadsheet, name: "ATS Score Checker", desc: "Check if your resume passes Applicant Tracking Systems", color: "from-purple-500 to-pink-500" },
  { icon: FileText, name: "Cover Letter Generator", desc: "Generate tailored cover letters in seconds", color: "from-green-500 to-teal-500" },
  { icon: MessageCircle, name: "Interview Question Generator", desc: "Get personalized interview questions for your role", color: "from-orange-500 to-red-500" },
  { icon: Calculator, name: "Salary Estimator", desc: "Estimate your market worth for Gulf region roles", color: "from-amber-500 to-yellow-500" },
  { icon: BarChart3, name: "Skill Gap Analyzer", desc: "Identify skills you need for your dream role", color: "from-indigo-500 to-purple-500" },
  { icon: Brain, name: "Career Recommendation Engine", desc: "AI suggests careers matching your profile", color: "from-pink-500 to-rose-500" },
  { icon: ScrollText, name: "Contract Risk Analyzer", desc: "AI reviews your employment contract for risks", color: "from-red-500 to-orange-500" },
  { icon: Globe, name: "Gulf Contract Interpreter", desc: "Understand GCC employment contract terms", color: "from-cyan-500 to-blue-500", popular: true },
  { icon: Target, name: "Job Match Scoring AI", desc: "See how well you match specific job listings", color: "from-violet-500 to-indigo-500" },
]

const gulfCountries = [
  { name: "Qatar", flag: "🇶🇦", articles: 14, color: "from-red-700 to-white" },
  { name: "UAE", flag: "🇦🇪", articles: 11, color: "from-green-600 to-white" },
  { name: "Saudi Arabia", flag: "🇸🇦", articles: 9, color: "from-green-700 to-white" },
  { name: "Kuwait", flag: "🇰🇼", articles: 7, color: "from-red-600 to-white" },
  { name: "Bahrain", flag: "🇧🇭", articles: 6, color: "from-red-600 to-white" },
  { name: "Oman", flag: "🇴🇲", articles: 6, color: "from-red-600 to-white" },
]

const qatarArticles = [
  { title: "Qatar Labor Law Explained for Foreign Workers", reads: "2.4K", difficulty: "Beginner" },
  { title: "Minimum Wage Rules in Qatar", reads: "1.8K", difficulty: "Beginner" },
  { title: "Working Hours and Overtime in Qatar", reads: "1.6K", difficulty: "Intermediate" },
  { title: "Annual Leave Rights in Qatar", reads: "1.4K", difficulty: "Beginner" },
  { title: "End of Service Benefits Explained", reads: "2.1K", difficulty: "Intermediate" },
  { title: "Can Employers Hold Your Passport?", reads: "3.2K", difficulty: "Beginner" },
  { title: "How To File a Labor Complaint in Qatar", reads: "1.9K", difficulty: "Advanced" },
  { title: "Understanding Qatar Employment Contracts", reads: "1.5K", difficulty: "Intermediate" },
  { title: "Sponsorship Transfer Rules", reads: "2.7K", difficulty: "Intermediate" },
  { title: "Domestic Worker Rights in Qatar", reads: "1.1K", difficulty: "Beginner" },
  { title: "How To Avoid Job Scams in Qatar", reads: "4.2K", difficulty: "Beginner" },
  { title: "Qatar Visa & Work Permit Guide", reads: "3.8K", difficulty: "Intermediate" },
]

const learningPaths = [
  { title: "Frontend Developer", steps: 6, jobs: 3400, salary: "QAR 15-25K", color: "from-blue-500 to-cyan-400", icon: Code },
  { title: "Electrical Engineering", steps: 5, jobs: 2100, salary: "QAR 12-20K", color: "from-orange-500 to-yellow-400", icon: Zap },
  { title: "Telecom Technician", steps: 4, jobs: 1800, salary: "QAR 8-15K", color: "from-purple-500 to-pink-400", icon: Building2 },
  { title: "Cybersecurity", steps: 7, jobs: 1500, salary: "QAR 20-35K", color: "from-red-500 to-rose-400", icon: Shield },
  { title: "AI / Machine Learning", steps: 8, jobs: 1200, salary: "QAR 25-45K", color: "from-indigo-500 to-violet-400", icon: Brain },
  { title: "Gulf Construction", steps: 4, jobs: 5600, salary: "QAR 6-18K", color: "from-amber-500 to-orange-400", icon: Briefcase },
]

const downloads = [
  { name: "ATS-Optimized CV Template", format: "DOCX", size: "245 KB", downloads: "12.4K" },
  { name: "Professional Cover Letter Template", format: "DOCX", size: "180 KB", downloads: "9.8K" },
  { name: "Interview Preparation Cheat Sheet", format: "PDF", size: "1.2 MB", downloads: "8.1K" },
  { name: "Career Planning Worksheet", format: "PDF", size: "890 KB", downloads: "6.5K" },
  { name: "Job Application Tracker", format: "XLSX", size: "320 KB", downloads: "5.2K" },
  { name: "Salary Negotiation Guide", format: "PDF", size: "2.1 MB", downloads: "4.8K" },
  { name: "Gulf Labor Law Quick Reference", format: "PDF", size: "1.8 MB", downloads: "7.3K" },
  { name: "Skills Assessment Workbook", format: "PDF", size: "640 KB", downloads: "3.9K" },
]

const videos = [
  { title: "How to Ace Your Gulf Job Interview", duration: "18:24", views: "45K", thumbnail: null },
  { title: "Understanding Your Qatar Employment Contract", duration: "14:12", views: "32K", thumbnail: null },
  { title: "Top 10 Skills for Gulf Jobs in 2026", duration: "12:45", views: "28K", thumbnail: null },
  { title: "Day in the Life: Software Engineer in Dubai", duration: "22:30", views: "67K", thumbnail: null },
  { title: "Worker Rights in the UAE: What You Must Know", duration: "16:50", views: "24K", thumbnail: null },
  { title: "How to Write an ATS-Friendly Resume", duration: "20:15", views: "53K", thumbnail: null },
]

const successStories = [
  { name: "Ahmed M.", from: "Nigeria", role: "Software Engineer in Qatar", story: "Used the AI resume analyzer and landed my dream job at a top Doha tech firm within 3 weeks." },
  { name: "Fatima K.", from: "Kenya", role: "Nurse in UAE", story: "The Gulf labor law guides helped me understand my contract rights. I negotiated 30% better pay." },
  { name: "Emeka O.", from: "Ghana", role: "Electrical Engineer in Saudi", story: "The career path roadmap showed me exactly what certifications I needed. Got hired in 2 months." },
  { name: "Aisha B.", from: "Ethiopia", role: "Marketing Manager in Dubai", story: "The interview prep tools were a game-changer. I felt confident and prepared for every question." },
]

const workerRights = [
  { icon: Lock, text: "Employers cannot confiscate your passport", law: "Qatar Law No. 21/2015" },
  { icon: Clock, text: "Overtime compensation at 125% of normal wage", law: "UAE Labor Law Art. 19" },
  { icon: Calendar, text: "Minimum 30 days annual leave per year", law: "Qatar Labor Law Art. 80" },
  { icon: Heart, text: "Free healthcare for all workers", law: "Qatar Health Law" },
  { icon: AlertTriangle, text: "You can file complaints without employer consent", law: "MOHRE Policy" },
  { icon: Scale, text: "End of service gratuity after 1 year", law: "GCC Labor Laws" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

function SearchBar({ placeholder = "Search resources, guides, tools..." }: { placeholder?: string }) {
  const [query, setQuery] = useState("")
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder:text-white/40 text-lg focus:outline-none focus:ring-2 focus:ring-[#FFBF00]/50 focus:border-transparent transition-all"
      />
      <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#FFBF00] text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#FFBF00]/90 transition-all">
        Search
      </button>
    </div>
  )
}

function SectionHeader({ title, subtitle, action }: { title: React.ReactNode; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
      <div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h2>
        {subtitle && <p className="text-muted-foreground font-medium mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/30 dark:border-zinc-700/30 rounded-2xl shadow-lg ${className}`}>
      {children}
    </div>
  )
}

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [activeCountry, setActiveCountry] = useState("Qatar")
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />

      {/* Sticky category nav */}
      <div className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b shadow-sm" : ""}`}>
        <div className="container mx-auto px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {["All", "Career Guides", "Resume & CV", "Interview Prep", "Labor Laws", "Visa Guides", "AI Tools", "Videos", "Downloads"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-[#FFBF00] text-black"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute top-20 -left-20 w-96 h-96 bg-[#FFBF00]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 pt-24 pb-32 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="text-center max-w-4xl mx-auto">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4 text-[#FFBF00]" />
              AI-Powered Career Growth Platform
              <span className="text-[#FFBF00] font-bold">•</span>
              <span className="text-[#FFBF00]">Gulf Worker Rights Hub</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-6">
              Learn Skills.
              <br />
              <span className="text-[#FFBF00]">Know Your Rights.</span>
              <br />
              Build Your Career.
              <br />
              Get Hired.
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 font-medium">
              Your complete career acceleration ecosystem for Gulf region jobs — from AI-powered CV analysis to worker rights protection and recruitment intelligence.
            </motion.p>

            <motion.div variants={itemVariants}>
              <SearchBar />
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2 mt-8">
              {["Qatar Labor Law", "Resume Templates", "Interview Tips", "Visa Guide", "Salary Guide", "Scam Alert"].map((tag) => (
                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white/60 hover:text-white hover:border-white/30 transition-all cursor-pointer font-medium">
                  {tag}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Trending bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-16 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-white/40 text-sm font-medium mb-3">
              <TrendingUp className="h-4 w-4" /> TRENDING NOW
            </div>
            <div className="flex flex-wrap gap-3">
              {trendingResources.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 cursor-pointer transition-all group">
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded ${r.tag === "Hot" ? "bg-red-500 text-white" : r.tag === "Popular" ? "bg-blue-500 text-white" : r.tag === "Trending" ? "bg-green-500 text-white" : "bg-[#FFBF00] text-black"}`}>
                    {r.tag}
                  </span>
                  <span className="text-sm text-white/70 group-hover:text-white transition-colors font-medium">{r.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/30 group-hover:text-[#FFBF00] transition-colors" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* RESOURCE CATEGORIES */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Explore Resources"
            subtitle="16 categories covering everything from resume writing to Gulf labor laws"
            action={
              <div className="flex gap-2">
                <button className="p-2 rounded-full border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><ChevronLeft className="h-5 w-5" /></button>
                <button className="p-2 rounded-full border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><ChevronRight className="h-5 w-5" /></button>
              </div>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="group cursor-pointer"
              >
                <GlassCard className="p-5 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                    <cat.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-bold leading-tight mb-1">{cat.label}</h3>
                  <p className="text-xs text-muted-foreground">{cat.count} resources</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI CAREER TOOLS */}
      <section className="py-24 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <SectionHeader
            title={
              <span className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-[#FFBF00]" />
                AI Career Tools
              </span>
            }
            subtitle="10 AI-powered tools to accelerate your Gulf career journey"
            action={<Button className="rounded-full bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 font-bold">View All Tools <ChevronRight className="h-4 w-4 ml-1" /></Button>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {aiTools.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group cursor-pointer"
              >
                <GlassCard className={`p-6 h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative ${tool.popular ? "ring-2 ring-[#FFBF00]" : ""}`}>
                  {tool.popular && (
                    <span className="absolute -top-2.5 -right-2.5 bg-[#FFBF00] text-black text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" /> POPULAR
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground">{tool.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-[#FFBF00] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Try Now <ArrowRight className="h-4 w-4" />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GULF LABOR LAW & WORKER RIGHTS HUB */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={
              <span className="flex items-center gap-3">
                <Scale className="h-8 w-8 text-[#FFBF00]" />
                Gulf Labor Law & Worker Rights Hub
              </span>
            }
            subtitle="Know your rights. Protect your career. Expert guides for every GCC country."
          />

          {/* Country tabs */}
          <div className="flex flex-wrap gap-3 mb-10">
            {gulfCountries.map((c) => (
              <button
                key={c.name}
                onClick={() => setActiveCountry(c.name)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeCountry === c.name
                    ? "bg-[#FFBF00] text-black shadow-lg"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span className="text-lg">{c.flag}</span>
                {c.name}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCountry === c.name ? "bg-black/10" : "bg-zinc-200 dark:bg-zinc-700"}`}>{c.articles}</span>
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {qatarArticles.map((article, i) => (
              <motion.div
                key={article.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <GlassCard className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className={`text-[10px] font-bold ${
                      article.difficulty === "Beginner" ? "border-green-300 text-green-600" :
                      article.difficulty === "Intermediate" ? "border-amber-300 text-amber-600" :
                      "border-red-300 text-red-600"
                    }`}>
                      {article.difficulty}
                    </Badge>
                    <BookmarkPlus className="h-4 w-4 text-muted-foreground hover:text-[#FFBF00] transition-colors" />
                  </div>
                  <h4 className="font-bold text-sm leading-snug mb-3 group-hover:text-[#FFBF00] transition-colors">{article.title}</h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {article.reads} reads</span>
                    <span className="flex items-center gap-1 text-[#FFBF00] font-bold">Read <ArrowUpRight className="h-3 w-3" /></span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Worker Rights Cards */}
          <SectionHeader
            title={
              <span className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-[#FFBF00]" />
                Know Your Rights
              </span>
            }
            subtitle="Critical worker protections every Gulf employee must know"
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {workerRights.map((right, i) => (
              <motion.div
                key={right.text}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-5 flex items-start gap-4 hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-[#FFBF00]">
                  <div className="w-10 h-10 rounded-lg bg-[#FFBF00]/10 flex items-center justify-center flex-shrink-0">
                    <right.icon className="h-5 w-5 text-[#FFBF00]" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-snug mb-1">{right.text}</p>
                    <p className="text-xs text-muted-foreground">{right.law}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Interactive Tools */}
          <SectionHeader
            title={
              <span className="flex items-center gap-3">
                <Calculator className="h-8 w-8 text-[#FFBF00]" />
                Interactive Legal Tools
              </span>
            }
          />
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Calculator, name: "End of Service Calculator", desc: "Calculate your gratuity based on salary, years served, and GCC country", color: "from-amber-500 to-yellow-500" },
              { icon: ScrollText, name: "Contract Risk Analyzer", desc: "Upload your employment contract for AI-powered risk analysis", color: "from-red-500 to-orange-500" },
              { icon: Shield, name: "Salary Rights Checker", desc: "Check legal work hours, overtime rules, and leave rights by country", color: "from-green-500 to-teal-500" },
              { icon: Heart, name: "Labor Complaint Assistant", desc: "Step-by-step guidance for filing complaints with labor ministries", color: "from-blue-500 to-cyan-500" },
            ].map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6 flex items-start gap-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}>
                    <tool.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-[#FFBF00] transition-colors">{tool.name}</h3>
                    <p className="text-muted-foreground text-sm">{tool.desc}</p>
                    <div className="mt-3 flex items-center gap-1 text-[#FFBF00] text-sm font-bold">
                      Launch Tool <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LEARNING PATHS */}
      <section className="py-24 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={
              <span className="flex items-center gap-3">
                <Compass className="h-8 w-8 text-[#FFBF00]" />
                Career Learning Paths
              </span>
            }
            subtitle="Structured roadmaps from beginner to hired — with certifications, resources, and salary benchmarks"
            action={<Button variant="outline" className="rounded-full font-bold">View All Paths <ArrowRight className="h-4 w-4 ml-1" /></Button>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPaths.map((path, i) => (
              <motion.div
                key={path.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden relative">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${path.color} opacity-5 rounded-bl-full`} />
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${path.color} flex items-center justify-center`}>
                      <path.icon className="h-7 w-7 text-white" />
                    </div>
                    <Badge className="bg-[#FFBF00] text-black font-bold">{path.salary}</Badge>
                  </div>
                  <h3 className="font-bold text-xl mb-1">{path.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {path.steps} steps</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {path.jobs.toLocaleString()} jobs</span>
                  </div>
                  <div className="flex gap-1.5 mb-4">
                    {Array.from({ length: path.steps }).map((_, s) => (
                      <div key={s} className={`h-2 flex-1 rounded-full ${s < path.steps - 1 ? "bg-[#FFBF00]" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-[#FFBF00] group-hover:gap-3 transition-all">
                    Start Path <ArrowRight className="h-4 w-4" />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOADABLE ASSETS */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={
              <span className="flex items-center gap-3">
                <Download className="h-8 w-8 text-[#FFBF00]" />
                Free Downloads
              </span>
            }
            subtitle="Professional templates, cheat sheets, and planning tools"
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {downloads.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <GlassCard className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#FFBF00]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-[#FFBF00]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm leading-snug mb-1 group-hover:text-[#FFBF00] transition-colors">{item.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono">{item.format}</span>
                      <span>{item.size}</span>
                      <span className="ml-auto">{item.downloads} downloads</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO LEARNING */}
      <section className="py-24 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={
              <span className="flex items-center gap-3">
                <Video className="h-8 w-8 text-[#FFBF00]" />
                Video Learning
              </span>
            }
            subtitle="Expert-led tutorials and career guidance videos"
            action={<Button variant="outline" className="rounded-full font-bold">View All Videos <ArrowRight className="h-4 w-4 ml-1" /></Button>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, i) => (
              <motion.div
                key={video.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group cursor-pointer"
              >
                <GlassCard className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#FFBF00]/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-8 w-8 text-black ml-0.5" />
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">{video.duration}</span>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-sm leading-snug mb-2 group-hover:text-[#FFBF00] transition-colors">{video.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {video.views} views</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#FFBF00]/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <SectionHeader
            title={
              <span className="flex items-center gap-3">
                <Star className="h-8 w-8 text-[#FFBF00]" />
                Success Stories
              </span>
            }
            subtitle="Real people. Real Gulf careers. Real transformations."
          />
          <div className="grid md:grid-cols-2 gap-6">
            {successStories.map((story, i) => (
              <motion.div
                key={story.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFBF00] to-amber-500 flex items-center justify-center text-black font-black text-lg">
                      {story.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold">{story.name}</h4>
                      <p className="text-sm text-muted-foreground">{story.from} → {story.role}</p>
                    </div>
                    <div className="ml-auto flex text-[#FFBF00]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">&ldquo;{story.story}&rdquo;</p>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 hover:text-[#FFBF00] cursor-pointer transition-colors"><ThumbsUp className="h-3.5 w-3.5" /> Helpful</span>
                    <span className="flex items-center gap-1 hover:text-[#FFBF00] cursor-pointer transition-colors"><MessageCircle className="h-3.5 w-3.5" /> Reply</span>
                    <span className="flex items-center gap-1 hover:text-[#FFBF00] cursor-pointer transition-colors"><Share2 className="h-3.5 w-3.5" /> Share</span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="py-24 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
        <div className="container mx-auto px-4">
          <GlassCard className="p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFBF00]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#FFBF00] flex items-center justify-center">
                <Users className="h-8 w-8 text-black" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Join the Community</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Connect with thousands of job seekers, mentors, and career experts. Share experiences, ask questions, and grow together.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="rounded-full bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 font-bold px-8 py-6 text-base">
                  Join Free <Users className="h-5 w-5 ml-2" />
                </Button>
                <Button variant="outline" className="rounded-full font-bold px-8 py-6 text-base">
                  Browse Discussions <MessageCircle className="h-5 w-5 ml-2" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-8 mt-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> 12,400+ members</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> 3,800+ discussions</span>
                <span className="flex items-center gap-1"><Star className="h-4 w-4" /> 96% satisfaction</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* EMBASSY & GOVERNMENT SUPPORT */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={
              <span className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-[#FFBF00]" />
                Official Support Resources
              </span>
            }
            subtitle="Government ministries, embassies, and legal aid organizations"
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Qatar Ministry of Labour", url: "#", type: "Government" },
              { name: "UAE MOHRE", url: "#", type: "Government" },
              { name: "Saudi Labor Ministry", url: "#", type: "Government" },
              { name: "Migrant Worker Support Center", url: "#", type: "NGO" },
            ].map((org, i) => (
              <motion.div
                key={org.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm group-hover:text-[#FFBF00] transition-colors">{org.name}</h4>
                    <p className="text-xs text-muted-foreground">{org.type}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-[#FFBF00] transition-colors" />
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER already handled by Layout wrapper — but this page uses Navbar directly, so let's show a CTA */}
      <section className="py-16 bg-black text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-black mb-4">Ready to Transform Your Gulf Career?</h2>
          <p className="text-white/60 max-w-xl mx-auto mb-8">
            Join thousands of professionals who've used OP Job Hub to find their dream jobs in Qatar, UAE, Saudi Arabia, and across the Gulf.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="rounded-full bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 font-bold px-8 py-6 text-base">
              Browse Jobs <Briefcase className="h-5 w-5 ml-2" />
            </Button>
            <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 font-bold px-8 py-6 text-base">
              Upload Your CV <ArrowUpRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
