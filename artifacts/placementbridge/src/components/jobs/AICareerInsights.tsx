import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit, TrendingUp, BarChart3, Target, Sparkles,
  Users, Briefcase, DollarSign, Clock, ArrowUpRight, ChevronDown,
  ChevronRight, Globe, Zap, BookOpen, MapPin, Star, Shield,
  Rocket, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw,
  X, Plus, Brain, Cpu, Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Role skill requirements for match calculation ---
const ROLE_REQUIREMENTS: Record<string, { required: string[]; bonus: string[]; label: string; color: string }> = {
  devops: {
    label: "DevOps Roles", color: "bg-emerald-500",
    required: ["docker", "kubernetes", "linux", "ci/cd", "terraform", "ansible", "aws", "git"],
    bonus: ["python", "prometheus", "grafana", "jenkins", "helm", "azure"],
  },
  cloud: {
    label: "Cloud Engineer", color: "bg-blue-500",
    required: ["aws", "azure", "gcp", "terraform", "networking", "iam", "s3", "ec2"],
    bonus: ["docker", "kubernetes", "python", "cloudformation", "linux"],
  },
  ai: {
    label: "AI Engineer", color: "bg-purple-500",
    required: ["python", "tensorflow", "pytorch", "machine learning", "nlp", "langchain", "sql"],
    bonus: ["aws", "docker", "mlops", "hugging face", "openai", "fastapi"],
  },
};

const EXP_MULTIPLIERS: Record<string, number> = {
  "0–1 yr": 0.7, "1–3 yrs": 0.85, "3–5 yrs": 1.0, "5–8 yrs": 1.1, "8+ yrs": 1.15
};

function calcMatch(roleKey: string, skills: string[], exp: string): number {
  const r = ROLE_REQUIREMENTS[roleKey];
  const s = skills.map(x => x.toLowerCase());
  const reqHit = r.required.filter(x => s.includes(x)).length;
  const bonusHit = r.bonus.filter(x => s.includes(x)).length;
  const base = Math.round((reqHit / r.required.length) * 75 + (bonusHit / Math.max(r.bonus.length, 1)) * 25);
  return Math.min(99, Math.round(base * (EXP_MULTIPLIERS[exp] ?? 1.0)));
}

// --- Improve My Match Modal ---
const SUGGESTED_SKILLS = [
  "Python", "Docker", "Kubernetes", "AWS", "Azure", "Terraform", "Linux",
  "React", "Node.js", "SQL", "Git", "CI/CD", "Ansible", "GCP", "TensorFlow",
  "Figma", "TypeScript", "Java", "PostgreSQL", "Machine Learning"
];

const EXP_OPTIONS = ["0–1 yr", "1–3 yrs", "3–5 yrs", "5–8 yrs", "8+ yrs"];

function MatchModal({ onClose }: { onClose: () => void }) {
  const [skills, setSkills] = useState<string[]>(["Docker", "Linux", "AWS"]);
  const [inputVal, setInputVal] = useState("");
  const [exp, setExp] = useState("3–5 yrs");
  const [step, setStep] = useState<"input" | "results">("input");

  const matches = useMemo(() => [
    { key: "devops", ...ROLE_REQUIREMENTS.devops, pct: calcMatch("devops", skills, exp) },
    { key: "cloud", ...ROLE_REQUIREMENTS.cloud, pct: calcMatch("cloud", skills, exp) },
    { key: "ai", ...ROLE_REQUIREMENTS.ai, pct: calcMatch("ai", skills, exp) },
  ].sort((a, b) => b.pct - a.pct), [skills, exp]);

  const addSkill = (s: string) => {
    const clean = s.trim();
    if (clean && !skills.map(x => x.toLowerCase()).includes(clean.toLowerCase())) {
      setSkills(prev => [...prev, clean]);
    }
    setInputVal("");
  };

  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s));

  const topMissing = useMemo(() => {
    const best = matches[0];
    const r = ROLE_REQUIREMENTS[best.key];
    const s = skills.map(x => x.toLowerCase());
    return [...r.required, ...r.bonus].filter(x => !s.includes(x)).slice(0, 3);
  }, [matches, skills]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.35 }}
        className="relative z-10 w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/40 bg-primary/5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">Improve My Match</p>
              <p className="text-[10px] text-muted-foreground">AI career fit analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Experience */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Experience Level</p>
            <div className="flex flex-wrap gap-2">
              {EXP_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setExp(e)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    exp === e
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 text-muted-foreground border-border/40 hover:border-primary/40"
                  )}
                >{e}</button>
              ))}
            </div>
          </div>

          {/* Skills Input */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Skills</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(inputVal); } }}
                placeholder="Type a skill and press Enter..."
                className="flex-1 h-9 px-3 rounded-xl bg-muted/40 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
              />
              <Button size="sm" className="h-9 px-3 rounded-xl shrink-0" onClick={() => addSkill(inputVal)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {/* Current skills */}
            <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
              {skills.map(s => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-red-400 transition-colors">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {skills.length === 0 && <span className="text-xs text-muted-foreground italic">No skills added yet</span>}
            </div>
            {/* Suggestions */}
            <p className="text-[10px] text-muted-foreground mb-1.5">Quick add:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_SKILLS.filter(s => !skills.map(x => x.toLowerCase()).includes(s.toLowerCase())).slice(0, 10).map(s => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 text-[10px] font-medium border border-border/40 hover:border-primary/30 transition-all"
                >
                  <Plus className="h-2.5 w-2.5" /> {s}
                </button>
              ))}
            </div>
          </div>

          {/* Live Match Scores */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Live Match Scores</p>
            <div className="space-y-3">
              {matches.map((m, i) => (
                <div key={m.key}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {i === 0 && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                      <span className="font-medium">{m.label}</span>
                    </div>
                    <span className={cn(
                      "font-bold text-sm",
                      m.pct >= 80 ? "text-emerald-500" : m.pct >= 60 ? "text-blue-400" : "text-amber-400"
                    )}>{m.pct}% fit</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", m.color)}
                      animate={{ width: `${m.pct}%` }}
                      transition={{ duration: 0.5, type: "spring" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Skills Tip */}
          {topMissing.length > 0 && (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
              <p className="text-xs font-semibold text-amber-500 mb-2 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Add these to boost your top match:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topMissing.map(s => (
                  <button
                    key={s}
                    onClick={() => addSkill(s.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >
                    <Plus className="h-2.5 w-2.5" /> {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 rounded-xl h-10 text-sm gap-1.5" asChild>
              <a href="/jobs">
                <Briefcase className="h-4 w-4" /> Find Matching Jobs
              </a>
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl h-10 text-sm" asChild>
              <a href="/ai-matching">
                Full AI Analysis
              </a>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Data ---
const insights = [
  { label: "Market Demand", value: "High", trend: "+23%", color: "text-emerald-500", progress: 85, icon: TrendingUp },
  { label: "Avg. Salary", value: "$112K", trend: "+8%", color: "text-primary", progress: 72, icon: DollarSign },
  { label: "Competition", value: "Moderate", trend: "-5%", color: "text-amber-500", progress: 45, icon: Users },
  { label: "Skills Match", value: "87%", trend: "+12%", color: "text-blue-500", progress: 87, icon: Target },
];

const marketTrends = [
  {
    role: "AI Engineer", growth: "+45%", hot: true,
    salary: "$95K–$160K", skills: ["Python", "LangChain", "TensorFlow"],
    remote: 412, companies: ["QatarEnergy", "Ooredoo", "Google"],
    path: "ML Engineer → AI Lead → Head of AI"
  },
  {
    role: "DevOps Lead", growth: "+32%", hot: true,
    salary: "$80K–$130K", skills: ["Docker", "Kubernetes", "Terraform"],
    remote: 238, companies: ["AWS", "Microsoft", "Ashghal"],
    path: "SysAdmin → DevOps Eng → DevOps Lead"
  },
  {
    role: "Security Analyst", growth: "+28%", hot: true,
    salary: "$70K–$120K", skills: ["SIEM", "ISO 27001", "Pen Testing"],
    remote: 185, companies: ["Hamad Medical", "QNB", "Nakilat"],
    path: "IT Support → SOC Analyst → Security Lead"
  },
  {
    role: "Data Engineer", growth: "+35%", hot: true,
    salary: "$85K–$145K", skills: ["Spark", "dbt", "Snowflake"],
    remote: 290, companies: ["Qatar Foundation", "Vodafone", "Grab"],
    path: "SQL Dev → Data Analyst → Data Engineer"
  },
  {
    role: "Product Designer", growth: "+21%", hot: false,
    salary: "$60K–$100K", skills: ["Figma", "UX Research", "Prototyping"],
    remote: 154, companies: ["Snoonu", "Careem", "Talabat"],
    path: "UI Designer → Product Designer → Head of Design"
  },
];

const regions = [
  { id: "qatar", label: "🇶🇦 Qatar", avgSalary: "$95K", demand: "Very High", topIndustry: "Oil & Gas", visa: "Available", jobs: 4200 },
  { id: "uae", label: "🇦🇪 UAE", avgSalary: "$88K", demand: "High", topIndustry: "FinTech", visa: "Available", jobs: 8900 },
  { id: "kenya", label: "🇰🇪 Kenya", avgSalary: "$22K", demand: "Growing", topIndustry: "Tech", visa: "N/A", jobs: 1400 },
  { id: "uganda", label: "🇺🇬 Uganda", avgSalary: "$18K", demand: "Emerging", topIndustry: "Telecom", visa: "N/A", jobs: 620 },
  { id: "remote", label: "🌍 Remote Global", avgSalary: "$75K", demand: "High", topIndustry: "Software", visa: "N/A", jobs: 24000 },
];

const predictions = [
  { text: "Cybersecurity hiring expected to rise 22% next quarter", icon: Shield, color: "text-blue-400", type: "up" },
  { text: "Frontend market becoming increasingly competitive", icon: AlertTriangle, color: "text-amber-400", type: "warn" },
  { text: "AI + Healthcare emerging as fastest growing combo", icon: Rocket, color: "text-emerald-400", type: "up" },
  { text: "Cloud infrastructure roles: 3× demand spike expected", icon: Zap, color: "text-purple-400", type: "up" },
];

const learningRecs = [
  { skill: "Docker", impact: "+38%", link: "https://www.udemy.com/courses/search/?q=docker", platform: "Udemy" },
  { skill: "CI/CD Pipelines", impact: "+31%", link: "https://www.coursera.org/search?query=cicd", platform: "Coursera" },
  { skill: "Terraform", impact: "+27%", link: "https://developer.hashicorp.com/terraform/tutorials", platform: "HashiCorp" },
];

// --- Sparkline ---
function Sparkline({ data, color = "#f97316" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 80; const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// --- CountUp ---
function CountUp({ target, duration = 1200, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setVal(Math.round(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <span>{val.toLocaleString()}{suffix}</span>;
}

// --- Main Component ---
export function AICareerInsights() {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("qatar");
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [lastUpdated] = useState(() => {
    const mins = Math.floor(Math.random() * 20) + 5;
    return `${mins} mins ago`;
  });

  const region = regions.find(r => r.id === selectedRegion) || regions[0];

  return (
    <section className="py-16 bg-muted/30 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 rounded-full text-xs font-medium">
              <BrainCircuit className="h-3 w-3 mr-1" /> AI-Powered Career Intelligence
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-black">
              Career <span className="text-gradient">Intelligence</span> Dashboard
            </h2>
            <p className="text-muted-foreground mt-2 text-sm flex items-center gap-2">
              <RefreshCw className="h-3 w-3 text-emerald-500 animate-spin" style={{ animationDuration: "3s" }} />
              Updated {lastUpdated} from{" "}
              <span className="text-foreground font-semibold">
                <CountUp target={52480} duration={1500} /> job postings
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium ml-1">Confidence: 89%</span>
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full gap-2 shrink-0">
            <a href="/jobs">Find Matching Jobs <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {insights.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border/60 bg-card p-4 group hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <item.icon className={cn("h-4 w-4", item.color)} />
              </div>
              <p className="text-xl font-bold text-foreground">{item.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className={cn("h-3 w-3", item.color)} />
                <span className={cn("text-xs font-medium", item.color)}>{item.trend}</span>
                <span className="text-xs text-muted-foreground ml-1">vs last month</span>
              </div>
              <Progress value={item.progress} className="h-1 mt-3 bg-muted" />
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Hottest Roles + Predictions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hottest Roles */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Hottest Roles This Month
                </h3>
                <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 rounded-full">Click to expand</Badge>
              </div>
              <div className="space-y-2">
                {marketTrends.map((trend, i) => (
                  <div key={trend.role}>
                    <button
                      onClick={() => setExpandedRole(expandedRole === trend.role ? null : trend.role)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground w-4">{i + 1}.</span>
                        <span className="text-sm font-medium">{trend.role}</span>
                        {trend.hot && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium animate-pulse">HOT</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Sparkline data={[30, 38, 35, 50, 48, 62, 68, 72, 80, 85]} />
                        <span className="text-sm font-bold text-emerald-500">{trend.growth}</span>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedRole === trend.role && "rotate-180")} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedRole === trend.role && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mx-3 mb-2 p-4 rounded-xl bg-muted/20 border border-border/40 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <p className="text-muted-foreground mb-1">Salary Range</p>
                              <p className="font-semibold text-emerald-500">{trend.salary}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Remote Jobs</p>
                              <p className="font-semibold text-blue-400">{trend.remote} available</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Top Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {trend.skills.map(s => (
                                  <span key={s} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{s}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Career Path</p>
                              <p className="font-medium text-foreground">{trend.path}</p>
                            </div>
                          </div>
                          <div className="mx-3 mb-3 flex gap-2">
                            <Button size="sm" className="rounded-full text-xs h-8 gap-1" asChild>
                              <a href="/jobs">Apply Now <ArrowRight className="h-3 w-3" /></a>
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-full text-xs h-8">Learn Missing Skills</Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Intelligence */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Globe className="h-4 w-4 text-primary" /> Market By Region
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {regions.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRegion(r.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      selectedRegion === r.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/30 text-muted-foreground border-border/40 hover:border-primary/30"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <motion.div key={selectedRegion} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Avg. Salary", value: region.avgSalary },
                  { label: "Demand", value: region.demand },
                  { label: "Top Industry", value: region.topIndustry },
                  { label: "Visa Support", value: region.visa },
                  { label: "Open Jobs", value: region.jobs.toLocaleString() },
                ].map(item => (
                  <div key={item.label} className="rounded-xl bg-muted/30 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-sm font-bold text-foreground">{item.value}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Predictive Hiring Insights */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-primary" /> Predictive Hiring Insights
              </h3>
              <div className="space-y-3">
                {predictions.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/30"
                  >
                    <p.icon className={cn("h-4 w-4 mt-0.5 shrink-0", p.color)} />
                    <p className="text-sm text-foreground">{p.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Recommendations + Salary + Learning */}
          <div className="space-y-5">
            {/* Personalized Insights */}
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Your AI Snapshot
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "DevOps Roles", pct: 92, color: "bg-emerald-500" },
                  { label: "Cloud Engineer", pct: 78, color: "bg-blue-500" },
                  { label: "AI Engineer", pct: 61, color: "bg-purple-500" },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-semibold">{m.pct}% fit</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", m.color)}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${m.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                className="w-full mt-4 rounded-xl text-xs h-9 gap-1.5"
                onClick={() => setMatchModalOpen(true)}
              >
                Improve My Match <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            {/* Salary Graph */}
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h3 className="text-base font-bold mb-1">Salary Growth Trend</h3>
              <p className="text-xs text-muted-foreground mb-3">Tech roles, Qatar market</p>
              <div className="flex items-end gap-1 h-20">
                {[35, 50, 45, 62, 58, 72, 68, 85, 78, 92, 88, 95].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.03 }}
                      className={cn("w-full rounded-t-sm", i > 7 ? "bg-primary" : "bg-primary/25")}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-xs">
                <span className="text-muted-foreground">Avg. salary trend</span>
                <span className="font-bold text-emerald-500">+12.5% YoY</span>
              </div>
            </div>

            {/* Learning Recommendations */}
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <h3 className="text-base font-bold mb-1 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Top Skills to Learn
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Boost hiring chances by completing these</p>
              <div className="space-y-2.5">
                {learningRecs.map((rec, i) => (
                  <a
                    key={rec.skill}
                    href={rec.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-primary/5 border border-border/30 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">{i + 1}.</span>
                      <div>
                        <p className="text-sm font-medium">{rec.skill}</p>
                        <p className="text-[10px] text-muted-foreground">{rec.platform}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-500">{rec.impact}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
              <Button size="sm" variant="outline" className="w-full mt-3 rounded-xl text-xs h-9" asChild>
                <a href="https://roadmap.sh" target="_blank" rel="noopener noreferrer">View Full Learning Roadmap</a>
              </Button>
            </div>

            {/* Trust Indicator */}
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-center">
              <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Based on analysis of{" "}
                <span className="text-foreground font-semibold">52,000+ job postings</span> across 14 platforms.
                Updated every 30 minutes.
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Sources: LinkedIn, Indeed, Bayt, Qatar Careers, Gulf Talent</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {matchModalOpen && <MatchModal onClose={() => setMatchModalOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}
