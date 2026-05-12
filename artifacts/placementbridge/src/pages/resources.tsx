import { useState, useEffect } from "react"
import { Link } from "wouter"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
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
import { Navbar } from "@/components/navbar"
import { api, type Resource } from "@/lib/api"

const trendingResources = [
  { title: "Qatar Labour Law (Law No. 14 of 2004)", category: "Labor Law", views: "12.4K", tag: "Hot", url: "https://www.almeezan.qa/LawArticles.aspx?LawTreeSectionID=12648&lawId=3961&language=en" },
  { title: "ATS-Friendly Resume Templates", category: "Resume Writing", views: "9.8K", tag: "Popular", url: "https://www.canva.com/resumes/templates/" },
  { title: "UAE Labour Law - Know Your Rights Guide", category: "Career Tools", views: "8.2K", tag: "Trending", url: "https://mohre.gov.ae/assets/download/618ff6ec/Know%20Your%20Rights%20-%20English_638924921038367080.pdf.aspx" },
  { title: "Top Interview Questions for Gulf Jobs", category: "Interview Prep", views: "7.6K", tag: "New", url: "https://www.ihire.com/resourcecenter/jobseeker/pages/interview-cheat-sheet-101-common-interview-questions" },
  { title: "How to Get a Work Visa in Qatar", category: "Visa Guides", views: "6.9K", tag: "Hot", url: "https://www.indianembassyqatar.gov.in/working_abroad" },
]

const aiTools = [
  { icon: FileCheck, name: "AI Resume Analyzer", desc: "Upload your CV for AI ATS scoring, skill extraction, and tailored improvement tips", color: "from-blue-500 to-cyan-500", popular: true, url: "/ai-matching" },
  { icon: Target, name: "AI Job Match Scoring", desc: "AI matches your profile against live GCC jobs with match percentage and reasons", color: "from-violet-500 to-indigo-500", url: "/ai-matching" },
  { icon: BarChart3, name: "Skill Gap Analyzer", desc: "AI identifies high-demand GCC skills you're missing and suggests courses", color: "from-indigo-500 to-purple-500", url: "/ai-matching" },
  { icon: Calculator, name: "Salary & Market Intel", desc: "AI analyzes salary ranges, demand trends, and market rates for your role", color: "from-amber-500 to-yellow-500", url: "/ai-matching" },
  { icon: Brain, name: "Career Recommendation AI", desc: "AI suggests career paths and roles matching your experience and skills", color: "from-pink-500 to-rose-500", url: "/ai-matching" },
  { icon: ScrollText, name: "Contract Risk Analyzer", desc: "AI flags risky clauses and explains your rights under GCC labour law", color: "from-red-500 to-orange-500", url: "/ai-matching" },
  { icon: MessageCircle, name: "Interview Coach AI", desc: "Get AI-generated interview questions and tips for Gulf region roles", color: "from-orange-500 to-red-500", url: "/ai-matching" },
  { icon: Globe, name: "Gulf Labour Law Guide", desc: "AI explains your worker rights across all 6 GCC countries", color: "from-cyan-500 to-blue-500", popular: true, url: "/ai-matching" },
  { icon: FileSpreadsheet, name: "ATS Resume Optimizer", desc: "AI optimizes your CV keywords to pass Gulf employer ATS filters", color: "from-purple-500 to-pink-500", url: "/ai-matching" },
  { icon: TrendingUp, name: "Career Growth AI Coach", desc: "AI generates a personalized upskilling roadmap for Gulf career advancement", color: "from-green-500 to-teal-500", url: "/ai-matching" },
]

const gulfCountries = [
  { name: "Qatar", flag: "🇶🇦", color: "from-red-700 to-white" },
  { name: "UAE", flag: "🇦🇪", color: "from-green-600 to-white" },
  { name: "Saudi Arabia", flag: "🇸🇦", color: "from-green-700 to-white" },
  { name: "Kuwait", flag: "🇰🇼", color: "from-red-600 to-white" },
  { name: "Bahrain", flag: "🇧🇭", color: "from-red-600 to-white" },
  { name: "Oman", flag: "🇴🇲", color: "from-red-600 to-white" },
]

const articlesByCountry: Record<string, Array<{ title: string; reads: string; difficulty: string; url: string }>> = {
  Qatar: [
    { title: "Qatar Labour Law (Law No. 14 of 2004)", reads: "2.4K", difficulty: "Beginner", url: "https://www.almeezan.qa/LawArticles.aspx?LawTreeSectionID=12648&lawId=3961&language=en" },
    { title: "Qatar Ministry of Labour - E-Services", reads: "1.8K", difficulty: "Beginner", url: "https://www.mol.gov.qa/En/Services" },
    { title: "Employment Contract Guide - Qatar", reads: "1.6K", difficulty: "Intermediate", url: "https://www.iloveqatar.net/guide/work/employment-contract-qatar-important-points-you-need-to-know" },
    { title: "Know Your Rights - Qatar Labour Law", reads: "1.4K", difficulty: "Beginner", url: "https://www.mrrors.org/wp-content/uploads/2023/09/Know-Your-Rights_Kuwait_Labour-Law-as-of-Oct-9.pdf" },
    { title: "Qatar Labour Law - ILO English PDF", reads: "2.1K", difficulty: "Intermediate", url: "https://natlex.ilo.org/dyn/natlex2/natlex2/files/download/67387/QAT67387%20Eng.pdf" },
    { title: "Migrant Worker Rights - Qatar", reads: "3.2K", difficulty: "Beginner", url: "https://www.migrant-rights.org/category/country/qatar/" },
    { title: "Indian Embassy Qatar - Working Abroad", reads: "1.9K", difficulty: "Advanced", url: "https://www.indianembassyqatar.gov.in/working_abroad" },
    { title: "MWO Qatar - For Filipino Workers", reads: "1.5K", difficulty: "Intermediate", url: "https://www.mwoqatar.org/" },
    { title: "Labour Reforms in Qatar", reads: "2.7K", difficulty: "Intermediate", url: "https://www.mol.gov.qa/En/Pages/default.aspx" },
    { title: "MADAD - Indian Worker Grievance Portal", reads: "1.1K", difficulty: "Beginner", url: "https://www.madad.gov.in" },
    { title: "Migrant Rights Research - Qatar", reads: "4.2K", difficulty: "Beginner", url: "https://www.mrrors.org/category/qatar/" },
    { title: "Ashghal Safety Certification - Qatar", reads: "3.8K", difficulty: "Intermediate", url: "https://www.ashghal.gov.qa/en/QualityCertificates/Pages/SafetyCertificationProgram.aspx" },
  ],
  UAE: [
    { title: "UAE Labour Law - Federal Decree-Law No. 33 of 2021", reads: "3.1K", difficulty: "Intermediate", url: "https://mohre.gov.ae/assets/download/8c8d4e6/Cabinet%20Resolution_Executive%20Regulations%20Decree-Law%20No.%2033%20of%202021.pdf.aspx" },
    { title: "UAE Know Your Rights - MOHRE Guide", reads: "2.8K", difficulty: "Beginner", url: "https://mohre.gov.ae/assets/download/618ff6ec/Know%20Your%20Rights%20-%20English_638924921038367080.pdf.aspx" },
    { title: "UAE MOHRE Official Portal", reads: "2.2K", difficulty: "Beginner", url: "https://www.mohre.gov.ae/en/home" },
    { title: "UAE Labour Law Amendment 2023", reads: "1.9K", difficulty: "Advanced", url: "https://www.mohre.gov.ae/assets/download/6d30b6be/Federal%20Decree%20Law%20No.%2020%20of%202023%20Amending%20Certain%20Provisions%20of%20Federal%20Decree%20Law%20No.%2033%20of%202021%20Regarding%20the%20Regulation%20of%20Employment%20Relationships.pdf.aspx" },
    { title: "Salary Guide - UAE GulfTalent", reads: "2.5K", difficulty: "Beginner", url: "https://www.gulftalent.com/salaries" },
    { title: "UAE Labour Law YouTube Explainers", reads: "1.7K", difficulty: "Beginner", url: "https://www.youtube.com/watch?v=bPKPJW3GAOw" },
    { title: "Indian Workers Resource Centre UAE", reads: "1.3K", difficulty: "Intermediate", url: "http://iwrcuae.in/" },
    { title: "Jobscan - Optimize Your CV", reads: "2.0K", difficulty: "Intermediate", url: "https://www.jobscan.co/" },
    { title: "Gulf CV Writers - Dubai", reads: "1.4K", difficulty: "Beginner", url: "https://gulfcvwriters.ae/" },
    { title: "Migrant Rights - UAE", reads: "1.8K", difficulty: "Beginner", url: "https://www.migrant-rights.org/category/country/uae/" },
  ],
  "Saudi Arabia": [
    { title: "Saudi Arabia Labour Law (Official PDF)", reads: "2.6K", difficulty: "Intermediate", url: "https://www.hrsd.gov.sa/sites/default/files/2023-02/Labor.pdf" },
    { title: "Saudi HRSD Official Portal", reads: "2.1K", difficulty: "Beginner", url: "https://www.hrsd.gov.sa/en" },
    { title: "Saudi Labour Law English PDF 2005", reads: "1.8K", difficulty: "Advanced", url: "https://www.hrsd.gov.sa/sites/default/files/2017-05/LABOR%20LAW.pdf" },
    { title: "HRSD Decisions & Regulations", reads: "1.5K", difficulty: "Intermediate", url: "https://www.hrsd.gov.sa/en/knowledge-centre/decisions-and-regulations" },
    { title: "OSHA 30-Hour Certification Saudi", reads: "1.2K", difficulty: "Intermediate", url: "https://gulfacademysafety.com/osha-30-hours-in-saudi-arabia/" },
    { title: "NaukriGulf - Saudi Jobs", reads: "1.9K", difficulty: "Beginner", url: "https://www.naukrigulf.com/" },
    { title: "Gulf Career Hunt - Saudi Guides", reads: "1.1K", difficulty: "Beginner", url: "https://gulfcareerhunt.com/" },
  ],
  Kuwait: [
    { title: "Kuwait Public Authority for Manpower", reads: "1.8K", difficulty: "Beginner", url: "https://www.manpower.gov.kw/" },
    { title: "Kuwait Labour Law - ILO Portal", reads: "1.5K", difficulty: "Intermediate", url: "https://natlex.ilo.org/dyn/natlex2/r/natlex/fe/details?p3_isn=83616" },
    { title: "Know Your Rights - Kuwait Labour Law PDF", reads: "1.3K", difficulty: "Beginner", url: "https://www.mrrors.org/wp-content/uploads/2023/09/Know-Your-Rights_Kuwait_Labour-Law-as-of-Oct-9.pdf" },
    { title: "Migrant Rights - Kuwait", reads: "1.1K", difficulty: "Beginner", url: "https://www.migrant-rights.org/category/country/kuwait/" },
  ],
  Bahrain: [
    { title: "Bahrain LMRA Official Portal", reads: "1.6K", difficulty: "Beginner", url: "https://lmra.gov.bh/en/home" },
    { title: "Bahrain Labour Law (LMRA PDF)", reads: "1.4K", difficulty: "Intermediate", url: "https://www.lmra.gov.bh/files/cms/shared/file/labour%20law.pdf" },
    { title: "Bahrain Workers Portal", reads: "1.2K", difficulty: "Beginner", url: "https://workers.lmra.gov.bh/" },
    { title: "Migrant Rights - Bahrain", reads: "1.0K", difficulty: "Beginner", url: "https://www.migrant-rights.org/category/country/bahrain/" },
  ],
  Oman: [
    { title: "Oman Ministry of Labour Official Portal", reads: "1.5K", difficulty: "Beginner", url: "https://mol.gov.om/" },
    { title: "Oman Labour Law (Royal Decree 53/2023)", reads: "1.3K", difficulty: "Intermediate", url: "https://www.mol.gov.om/Laborlaw" },
    { title: "Oman Labour Law English PDF", reads: "1.1K", difficulty: "Intermediate", url: "https://amcham.om/wp-content/uploads/2025/02/OMAN-LABOUR-LAW-532023.pdf" },
    { title: "Migrant Rights - Oman", reads: "0.9K", difficulty: "Beginner", url: "https://www.migrant-rights.org/category/country/oman/" },
  ],
}

const learningPaths = [
  { title: "Frontend Developer", steps: 6, jobs: 3400, salary: "QAR 15-25K", color: "from-blue-500 to-cyan-400", icon: Code, url: "https://www.coursera.org/learn/introduction-to-front-end-development?specialization=meta-front-end-developer" },
  { title: "Electrical Engineering", steps: 5, jobs: 2100, salary: "QAR 12-20K", color: "from-orange-500 to-yellow-400", icon: Zap, url: "https://www.edx.org/learn/front-end-web-development" },
  { title: "Telecom Technician", steps: 4, jobs: 1800, salary: "QAR 8-15K", color: "from-purple-500 to-pink-400", icon: Building2, url: "https://www.smartqhse.com/safety-blog/best-hse-certifications-gcc-professionals" },
  { title: "Cybersecurity", steps: 7, jobs: 1500, salary: "QAR 20-35K", color: "from-red-500 to-rose-400", icon: Shield, url: "https://www.coursera.org/google-certificates/google-cybersecurity" },
  { title: "AI / Machine Learning", steps: 8, jobs: 1200, salary: "QAR 25-45K", color: "from-indigo-500 to-violet-400", icon: Brain, url: "https://www.coursera.org/professional-certificates/google-ai" },
  { title: "Gulf Construction", steps: 4, jobs: 5600, salary: "QAR 6-18K", color: "from-amber-500 to-orange-400", icon: Briefcase, url: "https://www.ashghal.gov.qa/en/QualityCertificates/Pages/SafetyCertificationProgram.aspx" },
]

const downloads = [
  { name: "ATS-Optimized CV Template", format: "Canva", size: "Online", downloads: "12.4K", url: "https://www.canva.com/resumes/templates/" },
  { name: "Professional Cover Letter Template", format: "Canva", size: "Online", downloads: "9.8K", url: "https://www.canva.com/resumes/templates/" },
  { name: "Interview Preparation Cheat Sheet", format: "Online", size: "101 Qs", downloads: "8.1K", url: "https://www.ihire.com/resourcecenter/jobseeker/pages/interview-cheat-sheet-101-common-interview-questions" },
  { name: "Microsoft Resume Templates", format: "DOCX", size: "Online", downloads: "6.5K", url: "https://create.microsoft.com/en-us/grow-a-business" },
  { name: "UAE Know Your Rights Guide", format: "PDF", size: "1.8 MB", downloads: "7.3K", url: "https://mohre.gov.ae/assets/download/618ff6ec/Know%20Your%20Rights%20-%20English_638924921038367080.pdf.aspx" },
  { name: "Qatar Labour Law (ILO PDF)", format: "PDF", size: "2.1 MB", downloads: "5.2K", url: "https://natlex.ilo.org/dyn/natlex2/natlex2/files/download/67387/QAT67387%20Eng.pdf" },
  { name: "Saudi Labour Law (Official PDF)", format: "PDF", size: "1.8 MB", downloads: "4.8K", url: "https://www.hrsd.gov.sa/sites/default/files/2023-02/Labor.pdf" },
  { name: "Oman Labour Law (English PDF)", format: "PDF", size: "640 KB", downloads: "3.9K", url: "https://amcham.om/wp-content/uploads/2025/02/OMAN-LABOUR-LAW-532023.pdf" },
]

const videos = [
  { title: "How to Ace Your Gulf Job Interview", duration: "Series", views: "45K", url: "https://www.youtube.com/@GulfCareerHunt" },
  { title: "UAE Labour Law - 10 Things Employers Must Know", duration: "16:50", views: "32K", url: "https://www.youtube.com/watch?v=bPKPJW3GAOw" },
  { title: "Migrant Worker Rights in Qatar - Documentary", duration: "22:30", views: "67K", url: "https://www.youtube.com/watch?v=0xGcoyfmZks" },
  { title: "ATS Resume Format Guide for Gulf Jobs", duration: "Guide", views: "28K", url: "https://resumeats.net/blog/uae-gulf-resume-ats-format-guide" },
  { title: "Filipino Workers in the Gulf - Rights & Resources", duration: "Guide", views: "24K", url: "https://www.mwoqatar.org/" },
  { title: "NEBOSH IGC Guide for Gulf Construction", duration: "Guide", views: "53K", url: "https://www.smartqhse.com/safety-blog/best-hse-certifications-gcc-professionals" },
]

const successStories = [
  { name: "Ahmed M.", from: "Nigeria", role: "Software Engineer in Qatar", story: "Used the AI resume analyzer and landed my dream job at a top Doha tech firm within 3 weeks." },
  { name: "Fatima K.", from: "Kenya", role: "Nurse in UAE", story: "The Gulf labor law guides helped me understand my contract rights. I negotiated 30% better pay." },
  { name: "Emeka O.", from: "Ghana", role: "Electrical Engineer in Saudi", story: "The career path roadmap showed me exactly what certifications I needed. Got hired in 2 months." },
  { name: "Aisha B.", from: "Ethiopia", role: "Marketing Manager in Dubai", story: "The interview prep tools were a game-changer. I felt confident and prepared for every question." },
]

const workerRights = [
  { icon: Lock, text: "Employers cannot confiscate your passport", law: "Qatar Law No. 21/2015", url: "https://www.migrant-rights.org/" },
  { icon: Clock, text: "Overtime compensation at 125% of normal wage", law: "UAE Labor Law Art. 19", url: "https://mohre.gov.ae/assets/download/8c8d4e6/Cabinet%20Resolution_Executive%20Regulations%20Decree-Law%20No.%2033%20of%202021.pdf.aspx" },
  { icon: Calendar, text: "Minimum 30 days annual leave per year", law: "Qatar Labor Law Art. 80", url: "https://www.almeezan.qa/LawArticles.aspx?LawTreeSectionID=12648&lawId=3961&language=en" },
  { icon: Heart, text: "Free healthcare for all workers", law: "Qatar Health Law", url: "https://www.mol.gov.qa/En/" },
  { icon: AlertTriangle, text: "You can file complaints without employer consent", law: "MOHRE Policy", url: "https://www.mohre.gov.ae/en/home" },
  { icon: Scale, text: "End of service gratuity after 1 year", law: "GCC Labor Laws", url: "https://www.gulftalent.com/salaries" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

function SearchBar({ value, onChange, onSearch, placeholder = "Search resources, guides, tools..." }: { value: string; onChange: (v: string) => void; onSearch: () => void; placeholder?: string }) {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSearch() }}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder:text-white/40 text-lg focus:outline-none focus:ring-2 focus:ring-[#FFBF00]/50 focus:border-transparent transition-all"
      />
      <button onClick={onSearch} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#FFBF00] text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#FFBF00]/90 transition-all">
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
  const [searchQuery, setSearchQuery] = useState("")
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const { data: resourcesData, isLoading, error } = useQuery({
    queryKey: ["resources", activeCategory, searchQuery],
    queryFn: () =>
      api.listResources({
        category: activeCategory === "All" ? undefined : activeCategory,
        search: searchQuery || undefined,
      }),
  })

  const resourcesList = resourcesData?.resources ?? []
  const paginationInfo = resourcesData?.pagination

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
              <SearchBar value={searchQuery} onChange={setSearchQuery} onSearch={() => {}} />
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
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 cursor-pointer transition-all group">
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded ${r.tag === "Hot" ? "bg-red-500 text-white" : r.tag === "Popular" ? "bg-blue-500 text-white" : r.tag === "Trending" ? "bg-green-500 text-white" : "bg-[#FFBF00] text-black"}`}>
                    {r.tag}
                  </span>
                  <span className="text-sm text-white/70 group-hover:text-white transition-colors font-medium">{r.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/30 group-hover:text-[#FFBF00] transition-colors" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* RESOURCE CARDS */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={searchQuery ? `Results for "${searchQuery}"` : "Explore Resources"}
            subtitle={isLoading ? "Loading..." : error ? "Failed to load resources" : `${paginationInfo?.total ?? 0} resource${paginationInfo?.total !== 1 ? "s" : ""} available`}
          />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/30 dark:border-zinc-700/30 rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-lg font-bold text-red-400 mb-2">Failed to load resources</p>
              <p className="text-muted-foreground">Please try again later.</p>
            </div>
          ) : resourcesList.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-bold mb-2">No resources found</p>
              <p className="text-muted-foreground">{searchQuery ? `No resources matching "${searchQuery}"` : "Check back later for new resources."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resourcesList.map((resource, i) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                >
                  <GlassCard className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      {resource.featured && (
                        <Badge className="bg-[#FFBF00] text-black font-bold text-xs">Featured</Badge>
                      )}
                      {resource.category && (
                        <Badge variant="outline" className="text-xs">{resource.category}</Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-lg leading-snug mb-2">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground mb-4 flex-1">{resource.description}</p>
                    )}
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#FFBF00] font-bold text-sm group"
                      >
                        Open Resource <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    )}
                </GlassCard>
              </motion.a>
            ))}
            </div>
          )}
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
            action={<Link href="/ai-matching"><Button className="rounded-full bg-[#FFBF00] text-black hover:bg-[#FFBF00]/90 font-bold">View All Tools <ChevronRight className="h-4 w-4 ml-1" /></Button></Link>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {aiTools.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={tool.url}>
                  <GlassCard className={`p-6 h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative ${tool.popular ? "ring-2 ring-[#FFBF00]" : ""}`}>
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
                    <div className="mt-4 flex items-center gap-1 text-[#FFBF00] text-sm font-bold">
                      Try Now <ArrowRight className="h-4 w-4" />
                    </div>
                  </GlassCard>
                </Link>
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
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCountry === c.name ? "bg-black/10" : "bg-zinc-200 dark:bg-zinc-700"}`}>{articlesByCountry[c.name]?.length ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {(articlesByCountry[activeCountry] ?? []).map((article, i) => (
              <motion.a
                key={article.title}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
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
              </motion.a>
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
              <motion.a
                key={right.text}
                href={right.url}
                target="_blank"
                rel="noopener noreferrer"
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
              </motion.a>
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
                { icon: Brain, name: "AI Job Match Scoring", desc: "AI analyzes your profile against live GCC jobs and returns a match score with skill gaps", color: "from-blue-500 to-cyan-500", url: "/ai-matching" },
                { icon: FileCheck, name: "AI Resume Analyzer", desc: "Upload your CV for AI-powered ATS scoring, skill extraction, and improvement tips", color: "from-purple-500 to-pink-500", url: "/ai-matching" },
                { icon: BarChart3, name: "AI Skill Gap Analyzer", desc: "Identify high-demand GCC market skills you're missing — with AI career advice", color: "from-indigo-500 to-violet-500", url: "/ai-matching" },
                { icon: Calculator, name: "AI Salary & Market Intel", desc: "AI analyzes market rates, salary ranges, and demand trends for your role", color: "from-amber-500 to-yellow-500", url: "/ai-matching" },
                { icon: ScrollText, name: "Contract & Rights Analyzer", desc: "AI reviews GCC employment contract risks and flags unfair clauses", color: "from-red-500 to-orange-500", url: "/ai-matching" },
                { icon: TrendingUp, name: "Career Growth AI Coach", desc: "Get personalized AI recommendations for upskilling and career advancement", color: "from-green-500 to-teal-500", url: "/ai-matching" },
              ].map((tool, i) => (
              <Link key={tool.name} href={tool.url}>
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
              </Link>
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
              <motion.a
                key={path.title}
                href={path.url}
                target="_blank"
                rel="noopener noreferrer"
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
              </motion.a>
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
              <motion.a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
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
              </motion.a>
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
              <motion.a
                key={video.title}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group block"
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
              { name: "Qatar Ministry of Labour", url: "https://www.mol.gov.qa/En/", type: "Government" },
              { name: "UAE MOHRE", url: "https://www.mohre.gov.ae/en/home", type: "Government" },
              { name: "Saudi HRSD", url: "https://www.hrsd.gov.sa/en", type: "Government" },
              { name: "Kuwait Public Authority for Manpower", url: "https://www.manpower.gov.kw/", type: "Government" },
              { name: "Bahrain LMRA", url: "https://lmra.gov.bh/en/home", type: "Government" },
              { name: "Oman Ministry of Labour", url: "https://mol.gov.om/", type: "Government" },
              { name: "Migrant Rights Organization", url: "https://www.migrant-rights.org/", type: "NGO" },
              { name: "Migrant Workers Office - Qatar", url: "https://www.mwoqatar.org/", type: "Embassy" },
            ].map((org, i) => (
              <motion.a
                key={org.name}
                href={org.url}
                target="_blank"
                rel="noopener noreferrer"
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
              </motion.a>
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
