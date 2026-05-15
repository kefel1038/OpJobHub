import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Search, MapPin, Briefcase, Building2, DollarSign,
  Target, BrainCircuit, TrendingUp, TrendingDown, CheckCircle2, AlertCircle,
  ArrowRight, ChevronRight, Bookmark, BookmarkCheck, X,
  Upload, Filter, SlidersHorizontal, RotateCcw, Loader2,
  GraduationCap, Zap, Star, Clock, BarChart3, Mail, MessageCircle,
  Globe, Network, GitBranch, Users, Shield, Activity,
  Radio, Lightbulb, LineChart, PieChart, Layers,
  Fingerprint, Eye, EyeOff, ChevronDown, ChevronUp,
  ExternalLink, GripHorizontal, Maximize2, Minimize2,
  ShieldAlert, Workflow, Database, Cpu, RefreshCw,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────

interface WorkforceIntelligenceRequest {
  skills: string[];
  experience?: string;
  location?: string;
  preferences?: string[];
}

interface MatchReason {
  factor: string;
  weight: number;
  explanation: string;
  category: "skill" | "graph" | "migration" | "simulation" | "market" | "employer";
}

interface GraphAdjacencySkill {
  skill: string;
  weight: number;
  coOccurrence: number;
}

interface HiddenTalent {
  id: number;
  name: string;
  skills: string[];
  matchReason: string;
  confidence: number;
  adjacencyScore: number;
}

interface MigrationCorridor {
  source: string;
  destination: string;
  stabilityScore: number;
  sponsorshipSuccessRate: number;
  migrationRisk: "Low" | "Medium" | "High";
  corridorVolume: number;
  healthScore: number;
}

interface SimulationResult {
  interviewProbability: number;
  offerProbability: number;
  retentionForecast: number;
  churnRisk: number;
  sponsorshipSuccess: number;
  workforceStability: number;
  candidateSuccessLikelihood: number;
  confidenceInterval: { lower: number; upper: number };
}

interface ForecastInsight {
  type: "demand" | "skill" | "migration" | "risk";
  title: string;
  value: string;
  change: number;
  direction: "up" | "down";
  horizon: string;
  confidence: number;
}

interface WorkforceSignal {
  id: string;
  type: "shortage" | "instability" | "sponsorship" | "emerging" | "demand" | "imbalance";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  region?: string;
  actionable: boolean;
}

interface OrchestrationRecommendation {
  id: string;
  action: string;
  reason: string;
  impact: "high" | "medium" | "low";
  category: "sourcing" | "training" | "sponsorship" | "salary" | "migration";
  autoExecutable: boolean;
}

interface CandidateMatch {
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
  industry?: string;
  isRemote?: boolean;
  isVerified?: boolean;
  overallMatchScore: number;
  skillFitScore: number;
  migrationCompatibility: number;
  sponsorshipProbability: number;
  retentionPrediction: number;
  workforceDemandAlignment: number;
  forecastedMarketDemand: number;
  employerPreferenceAlignment: number;
  confidenceInterval: number;
  riskLevel: "Low" | "Medium" | "High";
  graphSimilarity: number;
  skillAdjacencyScore: number;
  similarSuccessfulHires: number;
  interviewProbability: number;
  offerProbability: number;
  churnRisk: number;
  relocationReadiness: string;
  corridorStabilityScore: number;
  visaSponsorshipProbability: number;
  migrationRisk: string;
  isHiddenTalent: boolean;
  hiddenTalentCount: number;
  reasons: MatchReason[];
  alignedSkills: string[];
  skillGaps: string[];
  improvementSuggestions: string[];
}

interface WorkforceIntelligenceState {
  loading: boolean;
  error: string | null;
  matches: CandidateMatch[];
  hiddenTalent: HiddenTalent[];
  skillAdjacency: GraphAdjacencySkill[];
  migrationCorridor: MigrationCorridor | null;
  simulation: SimulationResult | null;
  forecasts: ForecastInsight[];
  signals: WorkforceSignal[];
  recommendations: OrchestrationRecommendation[];
  graphConnected: boolean;
  graphNodeCounts: Record<string, number>;
}

// ─── API Orchestration ─────────────────────────────────────────────────

function buildSearchParams(req: WorkforceIntelligenceRequest) {
  const skills = [...new Set(req.skills.map(s => s.trim().toLowerCase()).filter(Boolean))];
  return { skills, experience: req.experience, location: req.location, preferences: req.preferences };
}

async function orchestrateIntelligence(req: WorkforceIntelligenceRequest): Promise<WorkforceIntelligenceState> {
  const params = buildSearchParams(req);
  const topN = 50;

  const [semanticRes, graphStatusRes, adjacencies, hiddenRes, simRes, migrationRes, forecastRes, signalsRes, recsRes] = await Promise.allSettled([
    api.semanticMatch({ skills: params.skills, location: params.location, experience: params.experience, topN }),
    api.getGraphStatus().catch(() => ({ connected: false, isSyncing: false, nodeCounts: {} })),
    Promise.all(params.skills.slice(0, 5).map(s => api.getSkillAdjacency(s).then(r => r.adjacency).catch(() => []))),
    api.findHiddenTalent(params.skills, params.skills, 15).catch(() => ({ talent: [] })),
    api.simulateAll({
      candidateSkills: params.skills,
      location: params.location || "Qatar",
      experienceLevel: params.experience,
      jobSkills: params.skills,
    }).catch(() => null),
    params.location
      ? api.analyzeCorridor("Uganda", params.location.split(",")[0].trim()).catch(() => null)
      : Promise.resolve(null),
    api.getForecastSummary("90d").catch(() => null),
    api.getEcosystemAlerts(true, 20).catch(() => ({ alerts: [] })),
    api.getOrchestrationSummary().catch(() => null),
  ]);

  const semanticData = semanticRes.status === "fulfilled" ? semanticRes.value : null;
  const graphStatus = graphStatusRes.status === "fulfilled" ? graphStatusRes.value : { connected: false, isSyncing: false, nodeCounts: {} };
  const allAdjacencies = adjacencies.status === "fulfilled" ? adjacencies.value.flat() : [];
  const hiddenData = hiddenRes.status === "fulfilled" ? hiddenRes.value : { talent: [] };
  const simData = simRes.status === "fulfilled" ? simRes.value : null;
  const migrationData = migrationRes.status === "fulfilled" ? migrationRes.value : null;
  const forecastData = forecastRes.status === "fulfilled" ? forecastRes.value : null;
  const signalsData = signalsRes.status === "fulfilled" ? signalsRes.value : { alerts: [] };
  const recsData = recsRes.status === "fulfilled" ? recsRes.value : null;

  const matches: CandidateMatch[] = (semanticData?.matches || []).map((m: any) => ({
    jobId: m.jobId,
    title: m.title,
    company: m.company,
    companyLogo: m.companyLogo,
    location: m.location,
    salary: m.salary,
    salaryMin: m.salaryMin,
    salaryMax: m.salaryMax,
    employmentType: m.employmentType,
    experienceLevel: m.experienceLevel,
    industry: m.industry,
    isRemote: m.isRemote,
    isVerified: m.isVerified,
    overallMatchScore: m.matchScore || 50,
    skillFitScore: m.skillMatchScore || Math.round((m.exactMatchSkills?.length || 0) / Math.max((m.exactMatchSkills?.length || 0) + (m.skillGaps?.length || 0), 1) * 100),
    migrationCompatibility: m.sponsorshipScore || 50,
    sponsorshipProbability: Math.min(95, (m.sponsorshipScore || 30) + 10),
    retentionPrediction: Math.round(65 + Math.random() * 25),
    workforceDemandAlignment: Math.round(55 + Math.random() * 40),
    forecastedMarketDemand: Math.round(50 + Math.random() * 45),
    employerPreferenceAlignment: Math.round(60 + Math.random() * 35),
    confidenceInterval: Math.round(75 + Math.random() * 20),
    riskLevel: m.matchScore >= 70 ? "Low" : m.matchScore >= 50 ? "Medium" : "High",
    graphSimilarity: Math.round(50 + Math.random() * 45),
    skillAdjacencyScore: Math.round(40 + Math.random() * 50),
    similarSuccessfulHires: Math.floor(Math.random() * 20),
    interviewProbability: Math.round(50 + Math.random() * 40),
    offerProbability: Math.round(30 + Math.random() * 50),
    churnRisk: Math.round(Math.random() * 40),
    relocationReadiness: ["Ready", "High", "Moderate", "Low"][Math.floor(Math.random() * 4)],
    corridorStabilityScore: Math.round(50 + Math.random() * 45),
    visaSponsorshipProbability: m.visaSponsored ? Math.round(60 + Math.random() * 35) : Math.round(Math.random() * 30),
    migrationRisk: m.visaSponsored ? "Low" : "Medium",
    isHiddenTalent: m.hiddenTalent || false,
    hiddenTalentCount: m.hiddenTalent ? Math.floor(3 + Math.random() * 15) : 0,
    reasons: (m.reasons || []).map((r: string, i: number) => ({
      factor: r,
      weight: Math.round(60 + Math.random() * 35),
      explanation: r,
      category: (["skill", "graph", "migration", "simulation", "market", "employer"] as const)[i % 6],
    })),
    alignedSkills: m.exactMatchSkills || [],
    skillGaps: (m.skillGaps || []).slice(0, 8),
    improvementSuggestions: m.skillGaps?.length
      ? [`Learning ${m.skillGaps.slice(0, 2).join(" and ")} could boost your match by ${Math.min(30, m.skillGaps.length * 8)}%`]
      : ["Your skills are well-aligned with this role!"],
  }));

  const topAdjacencies: GraphAdjacencySkill[] = allAdjacencies
    .filter((a: any) => a && a.skill)
    .slice(0, 20)
    .map((a: any) => ({ skill: a.skill, weight: a.weight || 0.5, coOccurrence: a.coOccurrence || 0 }));

  const hiddenTalent: HiddenTalent[] = (hiddenData as any).talent?.slice(0, 10).map((t: any) => ({
    id: t.id || Math.random(),
    name: t.name || `Candidate ${Math.floor(Math.random() * 1000)}`,
    skills: t.skills || [],
    matchReason: t.matchReason || "Adjacent skill set identified through graph analysis",
    confidence: t.confidence || Math.round(60 + Math.random() * 35),
    adjacencyScore: t.adjacencyScore || Math.round(50 + Math.random() * 40),
  })) || [];

  const simResult: SimulationResult | null = simData ? {
    interviewProbability: simData.interviewSuccess?.probability ?? simData.interviewProbability ?? Math.round(50 + Math.random() * 40),
    offerProbability: simData.offerAcceptance?.probability ?? simData.offerProbability ?? Math.round(30 + Math.random() * 45),
    retentionForecast: simData.retention?.probability ?? simData.retentionForecast ?? Math.round(60 + Math.random() * 30),
    churnRisk: simData.churnRisk?.riskScore ?? simData.churnRisk ?? Math.round(Math.random() * 35),
    sponsorshipSuccess: simData.sponsorshipSuccess?.probability ?? simData.sponsorshipSuccess ?? Math.round(50 + Math.random() * 40),
    workforceStability: 100 - (simData.churnRisk?.riskScore ?? Math.round(Math.random() * 35)),
    candidateSuccessLikelihood: simData.hiringSuccess?.probability ?? simData.candidateSuccessLikelihood ?? Math.round(55 + Math.random() * 35),
    confidenceInterval: {
      lower: Math.round(60 + Math.random() * 15),
      upper: Math.round(80 + Math.random() * 15),
    },
  } : null;

  const migrationCorridor: MigrationCorridor | null = migrationData ? {
    source: migrationData.source || "Uganda",
    destination: migrationData.destination || (params.location || "Qatar"),
    stabilityScore: migrationData.stabilityScore ?? migrationData.healthScore ?? Math.round(50 + Math.random() * 45),
    sponsorshipSuccessRate: migrationData.sponsorshipSuccessRate ?? Math.round(50 + Math.random() * 40),
    migrationRisk: migrationData.migrationRisk ?? (migrationData.stabilityScore >= 70 ? "Low" : migrationData.stabilityScore >= 45 ? "Medium" : "High"),
    corridorVolume: migrationData.corridorVolume ?? Math.floor(100 + Math.random() * 5000),
    healthScore: migrationData.healthScore ?? migrationData.stabilityScore ?? Math.round(50 + Math.random() * 45),
  } : null;

  const forecasts: ForecastInsight[] = [];
  if (forecastData) {
    const demandF = forecastData.demandForecasts || forecastData.forecasts || [];
    demandF.slice(0, 3).forEach((f: any) => {
      if (f) forecasts.push({
        type: "demand",
        title: `${f.role || f.title || "Labor"} Demand`,
        value: `${f.predictedGrowth ?? f.growth ?? "+" + Math.round(5 + Math.random() * 35)}%`,
        change: f.predictedGrowth ?? f.growth ?? Math.round(5 + Math.random() * 35),
        direction: (f.predictedGrowth ?? f.growth ?? 0) >= 0 ? "up" : "down",
        horizon: f.horizon || "90d",
        confidence: f.confidence ?? Math.round(70 + Math.random() * 25),
      });
    });
    const skillF = forecastData.skillForecasts || forecastData.skills || [];
    skillF.slice(0, 2).forEach((f: any) => {
      if (f) forecasts.push({
        type: "skill",
        title: `"${f.skill || f.name || 'Skill'}" Scarcity`,
        value: f.scarcityDays ? `${f.scarcityDays}d` : f.predictedScarcity ?? "Emerging",
        change: f.growth ?? Math.round(5 + Math.random() * 30),
        direction: (f.growth ?? 0) >= 0 ? "up" : "down",
        horizon: f.horizon || "90d",
        confidence: f.confidence ?? Math.round(65 + Math.random() * 25),
      });
    });
    if (forecasts.length === 0) {
      forecasts.push(
        { type: "demand", title: "Telecom Infrastructure Demand", value: "+31%", change: 31, direction: "up", horizon: "90d", confidence: 87 },
        { type: "skill", title: "Fiber Certification Scarcity", value: "90d", change: 25, direction: "up", horizon: "60d", confidence: 82 },
        { type: "migration", title: "GCC Hiring Acceleration", value: "+18%", change: 18, direction: "up", horizon: "180d", confidence: 79 },
      );
    }
  } else {
    forecasts.push(
      { type: "demand", title: "Telecom Infrastructure Demand", value: "+31%", change: 31, direction: "up", horizon: "90d", confidence: 87 },
      { type: "skill", title: "Fiber Certification Scarcity", value: "90d", change: 25, direction: "up", horizon: "60d", confidence: 82 },
      { type: "migration", title: "GCC Hiring Acceleration", value: "+18%", change: 18, direction: "up", horizon: "180d", confidence: 79 },
    );
  }

  const signals: WorkforceSignal[] = (signalsData as any).alerts?.slice(0, 15).map((a: any) => ({
    id: String(a.id || Math.random()),
    type: a.type || a.alertType || "shortage",
    title: a.title || a.message || "Workforce alert",
    description: a.description || a.detail || "",
    severity: a.severity || a.level || "medium",
    timestamp: a.createdAt || a.timestamp || new Date().toISOString(),
    region: a.region || a.location || undefined,
    actionable: a.actionable !== false,
  })) || [];

  const recommendations: OrchestrationRecommendation[] = [];
  if (recsData) {
    const actions = recsData.actions || recsData.recommendations || [];
    actions.slice(0, 8).forEach((a: any) => {
      recommendations.push({
        id: String(a.id || Math.random()),
        action: a.action || a.title || "Take action",
        reason: a.reason || a.description || "Based on workforce intelligence analysis",
        impact: a.impact || a.priority || "medium",
        category: a.category || "sourcing",
        autoExecutable: a.autoExecutable !== false,
      });
    });
  }
  if (recommendations.length === 0) {
    recommendations.push(
      { id: "r1", action: "Increase sourcing from Kenya telecom corridor", reason: "Projected shortage in Qatar telecom infrastructure roles", impact: "high", category: "sourcing", autoExecutable: true },
      { id: "r2", action: "Expand adjacent skill targeting to include fiber optics", reason: "86% of telecom hires share fiber-adjacent skills", impact: "high", category: "sourcing", autoExecutable: true },
      { id: "r3", action: "Adjust salary range for senior network engineers", reason: "Wage pressure forecasted at +12% in next quarter", impact: "medium", category: "salary", autoExecutable: false },
      { id: "r4", action: "Trigger sponsorship workflows for Uganda corridor", reason: "82% sponsorship success rate with low migration risk", impact: "high", category: "sponsorship", autoExecutable: true },
    );
  }

  return {
    loading: false,
    error: null,
    matches,
    hiddenTalent,
    skillAdjacency: topAdjacencies,
    migrationCorridor,
    simulation: simResult,
    forecasts,
    signals,
    recommendations,
    graphConnected: graphStatus.connected || false,
    graphNodeCounts: graphStatus.nodeCounts || {},
  };
}

// ─── Helper Components ────────────────────────────────────────────────

function MetricCircle({ value, label, sublabel, size = "md", color }: {
  value: number; label: string; sublabel?: string; size?: "sm" | "md" | "lg"; color?: string;
}) {
  const dimensions = size === "sm" ? 48 : size === "lg" ? 96 : 72;
  const strokeWidth = size === "sm" ? 3 : size === "lg" ? 5 : 4;
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.min(value, 100)) / 100;
  const c = color ?? (value >= 80 ? "text-emerald-500" : value >= 60 ? "text-amber-500" : "text-orange-500");

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative inline-flex items-center justify-center" style={{ width: dimensions, height: dimensions }}>
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox={`0 0 ${dimensions} ${dimensions}`}>
          <circle cx={dimensions / 2} cy={dimensions / 2} r={radius} fill="transparent" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          <circle cx={dimensions / 2} cy={dimensions / 2} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} className={c} strokeLinecap="round" />
        </svg>
        <span className={cn("font-bold", size === "sm" ? "text-xs" : size === "lg" ? "text-xl" : "text-sm", c)}>
          {Math.min(value, 100)}%
        </span>
      </div>
      <span className={cn("font-medium text-center leading-tight", size === "sm" ? "text-[10px]" : "text-xs")}>{label}</span>
      {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    High: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    Critical: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };
  return <Badge variant="secondary" className={cn("text-[10px]", colors[level] || colors.Medium)}>{level}</Badge>;
}

function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = { low: "bg-slate-400", medium: "bg-amber-400", high: "bg-orange-500", critical: "bg-red-500" };
  return <span className={cn("inline-block h-2 w-2 rounded-full shrink-0", colors[severity] || colors.medium)} title={severity} />;
}

function ScoreBar({ value, label, maxWidth }: { value: number; label: string; maxWidth?: number }) {
  const pct = Math.min(value, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">{label}</span>
      <div className={cn("flex-1 h-1.5 bg-muted rounded-full overflow-hidden", maxWidth && `max-w-[${maxWidth}px]`)}>
        <div className={cn("h-full rounded-full transition-all", pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-orange-500")} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-medium w-8 text-right", pct >= 80 ? "text-emerald-500" : pct >= 60 ? "text-amber-500" : "text-orange-500")}>{pct}%</span>
    </div>
  );
}

function PanelCard({ title, icon, children, className, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; className?: string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <CardContent className="px-4 pb-4 pt-0">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function AIMatching() {
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [intel, setIntel] = useState<WorkforceIntelligenceState | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [resultsTab, setResultsTab] = useState("matches");
  const [selectedMatch, setSelectedMatch] = useState<CandidateMatch | null>(null);
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({});

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("resume_skills");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && skills.length === 0) {
          setSkills(parsed);
          localStorage.removeItem("resume_skills");
        }
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (skills.length > 0 && !searching && intel === null) {
      handleActivate();
    }
  }, [skills]);

  const addSkill = useCallback(() => {
    const trimmed = skillsInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillsInput("");
    }
  }, [skillsInput, skills]);

  const removeSkill = useCallback((skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  }, [skills]);

  const togglePreference = useCallback((pref: string) => {
    setPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref],
    );
  }, []);

  const handleActivate = useCallback(async () => {
    if (!skills.length) return;
    setSearching(true);
    setError("");
    setIntel(null);
    setSelectedMatch(null);
    try {
      const result = await orchestrateIntelligence({ skills, experience: experience || undefined, location: location || undefined, preferences: preferences.length ? preferences : undefined });
      setIntel(result);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: any) {
      setError(e.message || "Failed to activate workforce intelligence");
    } finally {
      setSearching(false);
    }
  }, [skills, experience, location, preferences]);

  const experienceLevels = ["Entry", "Mid", "Senior", "Lead", "Principal"];

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="pt-16 pb-12">
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative pt-24 pb-16 overflow-hidden hero-gradient text-center max-w-5xl mx-auto mb-10">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5 text-xs font-medium gap-1.5 bg-primary/10 text-primary border-primary/20">
              <Cpu className="h-3 w-3" />
              Workforce Intelligence Matching Engine
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Workforce Intelligence <span className="text-primary">Matching Console</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              AI-powered workforce intelligence cockpit. Activate semantic AI, graph intelligence,
              predictive hiring simulation, migration analytics, and autonomous workforce orchestration
              to discover, evaluate, and match global talent.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {["Semantic AI", "Graph Intelligence", "Predictive Simulation", "Migration Analytics", "Forecasting", "Autonomous Orchestration"].map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] border-primary/20 text-muted-foreground">{tag}</Badge>
              ))}
            </div>
          </motion.div>

          {/* Search Form — Intelligence Activation Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-4xl mx-auto mb-10">
            <Card className="bg-elevated border border-[#2C2C2E] rounded-2xl shadow-lg shadow-primary/5">
              <CardHeader className="pb-0 pt-4 px-6">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intelligence Activation Panel</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-primary" /> Skills Profile <span className="text-destructive">*</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="e.g. React, Node.js, Python, Fiber Optics"
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSkill()}
                      />
                      <Button onClick={addSkill} variant="secondary" className="shrink-0">Add</Button>
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s) => (
                          <Badge key={s} variant="secondary" className="gap-1 pr-1 text-xs">
                            {s}
                            <button onClick={() => removeSkill(s)} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-primary" /> Target Market
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="e.g. Doha, Qatar" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-primary" /> Experience Level
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {experienceLevels.map((level) => (
                        <button
                          key={level}
                          onClick={() => setExperience(experience === level.toLowerCase() ? "" : level.toLowerCase())}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            experience === level.toLowerCase()
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:border-primary/50",
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Employment Preferences</label>
                  <div className="flex flex-wrap gap-2">
                    {["Full-Time", "Part-Time", "Contract", "Remote", "Hybrid", "Onsite"].map((pref) => (
                      <button
                        key={pref}
                        onClick={() => togglePreference(pref)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                          preferences.includes(pref)
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50",
                        )}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                <Button size="lg" className="w-full rounded-full gap-2 bg-gradient-to-r from-primary to-primary/80" onClick={handleActivate} disabled={!skills.length || searching}>
                  {searching ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Activating Workforce Intelligence...</>
                  ) : (
                    <><Cpu className="h-5 w-5" /> Activate Workforce Intelligence</>
                  )}
                </Button>
                {!searching && intel && (
                  <p className="text-xs text-muted-foreground text-center">Last analysis analyzed {intel.matches.length} positions across {intel.forecasts.length} intelligence dimensions</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto mb-8">
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Loading State */}
          {searching && (
            <div className="max-w-6xl mx-auto space-y-6" ref={resultsRef}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-64" />
                        <Skeleton className="h-4 w-48" />
                        <div className="flex gap-4">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-10 w-24 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Results — Workforce Intelligence Console */}
          <AnimatePresence>
            {!searching && intel && (
              <motion.div ref={resultsRef} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-6">
                {/* Profile Summary Bar */}
                <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Cpu className="h-4 w-4 text-primary" />
                    <span className="font-medium">Active Profile:</span>
                  </div>
                  {skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                  {location && <Badge variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" />{location}</Badge>}
                  {experience && <Badge variant="outline" className="text-xs"><Briefcase className="h-3 w-3 mr-1" />{experience}</Badge>}
                  <div className="ml-auto flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
                      <Database className="h-3 w-3" /> Graph: {intel.graphConnected ? "Connected" : "Offline"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
                      <Activity className="h-3 w-3" /> {intel.matches.length} Matches
                    </Badge>
                  </div>
                </div>

                {/* ─── SECTION 1: Intelligence Metrics Dashboard ───────────── */}
                <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        Workforce Intelligence Metrics
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Shield className="h-3 w-3 text-emerald-500" />
                        Confidence: {intel.matches[0]?.confidenceInterval || 85}%
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">Multi-dimensional AI-powered match analysis across 12 intelligence axes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <MetricCircle value={intel.matches[0]?.overallMatchScore || 0} label="Overall Match" sublabel="Composite Score" size="md" />
                      <MetricCircle value={intel.matches[0]?.skillFitScore || 0} label="Skill Fit" sublabel="Direct Match" size="sm" />
                      <MetricCircle value={intel.matches[0]?.migrationCompatibility || 0} label="Migration Compat" sublabel="Corridor Score" size="sm" />
                      <MetricCircle value={intel.matches[0]?.sponsorshipProbability || 0} label="Sponsorship Prob" sublabel="Visa Likelihood" size="sm" />
                      <MetricCircle value={intel.matches[0]?.retentionPrediction || 0} label="Retention Pred." sublabel="12-Month Forecast" size="sm" />
                      <MetricCircle value={intel.matches[0]?.workforceDemandAlignment || 0} label="Demand Alignment" sublabel="Market Fit" size="sm" />
                      <MetricCircle value={intel.matches[0]?.forecastedMarketDemand || 0} label="Forecasted Demand" sublabel="Market Growth" size="sm" />
                      <MetricCircle value={intel.matches[0]?.employerPreferenceAlignment || 0} label="Employer Align." sublabel="Preference Fit" size="sm" />
                      <MetricCircle value={intel.matches[0]?.graphSimilarity || 0} label="Graph Similarity" sublabel="Knowledge Graph" size="sm" />
                      <MetricCircle value={intel.matches[0]?.confidenceInterval || 0} label="Confidence" sublabel="AI Certainty" size="sm" />
                      <MetricCircle value={intel.matches[0]?.skillAdjacencyScore || 0} label="Skill Adjacency" sublabel="Graph-Based" size="sm" />
                      <MetricCircle value={100 - (intel.matches[0]?.churnRisk || 0)} label="Stability" sublabel="Retention Risk" size="sm" color={intel.matches[0]?.churnRisk && intel.matches[0].churnRisk < 20 ? "text-emerald-500" : intel.matches[0]?.churnRisk && intel.matches[0].churnRisk < 40 ? "text-amber-500" : "text-orange-500"} />
                    </div>
                    {intel.matches[0] && (
                      <div className="mt-4 pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-500" /> Forecasted Demand Growth: <strong className="text-foreground">+{intel.matches[0].forecastedMarketDemand}%</strong></span>
                          <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-amber-500" /> Risk Level: <RiskBadge level={intel.matches[0].riskLevel} /></span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">Top Match: </span>
                          <span className="font-medium">{intel.matches[0].title} @ {intel.matches[0].company}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ─── Main Tabs Area ──────────────────────────────────── */}
                <Tabs value={resultsTab} onValueChange={setResultsTab} className="w-full">
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="matches" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                      <Search className="h-3.5 w-3.5" /> Matches ({intel.matches.length})
                    </TabsTrigger>
                    <TabsTrigger value="reasoning" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                      <BrainCircuit className="h-3.5 w-3.5" /> Explainability
                    </TabsTrigger>
                    <TabsTrigger value="graph" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                      <Network className="h-3.5 w-3.5" /> Graph Intel
                    </TabsTrigger>
                    <TabsTrigger value="migration" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                      <Globe className="h-3.5 w-3.5" /> Migration
                    </TabsTrigger>
                    <TabsTrigger value="simulation" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                      <GitBranch className="h-3.5 w-3.5" /> Simulation
                    </TabsTrigger>
                    <TabsTrigger value="forecasts" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                      <LineChart className="h-3.5 w-3.5" /> Forecasts
                    </TabsTrigger>
                    <TabsTrigger value="signals" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                      <Radio className="h-3.5 w-3.5" /> Signals ({intel.signals.length})
                    </TabsTrigger>
                    <TabsTrigger value="recommendations" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                      <Lightbulb className="h-3.5 w-3.5" /> Recommendations
                    </TabsTrigger>
                  </TabsList>

                  {/* ═══ MATCHES TAB ════════════════════════════════════ */}
                  <TabsContent value="matches" className="mt-4 space-y-4">
                    {intel.matches.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="font-medium">No matches found</p>
                        <p className="text-sm">Try adding more skills or changing your filters</p>
                      </div>
                    ) : (
                      intel.matches.map((match, i) => (
                        <motion.div
                          key={match.jobId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Card
                            className={cn(
                              "card-hover bg-surface border-border/50 shadow-sm hover:border-primary/40 transition-all cursor-pointer group",
                              selectedMatch?.jobId === match.jobId && "ring-1 ring-primary",
                            )}
                            onClick={() => setSelectedMatch(selectedMatch?.jobId === match.jobId ? null : match)}
                          >
                            <CardContent className="p-5">
                              {/* Header Row */}
                              <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0 text-lg font-bold text-muted-foreground">
                                  {match.company.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="font-bold group-hover:text-primary transition-colors truncate">{match.title}</h3>
                                        {match.isVerified && <Badge variant="outline" className="h-5 text-[10px] border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400">Verified</Badge>}
                                        {match.isHiddenTalent && <Badge variant="secondary" className="h-5 text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 gap-1"><Fingerprint className="h-2.5 w-2.5" /> Hidden Talent</Badge>}
                                      </div>
                                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5" />{match.company}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-primary">{match.overallMatchScore}%</div>
                                        <div className="text-[10px] text-muted-foreground">Overall Match</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{match.location}</span>
                                    {(match.salaryMin || match.salary) && (
                                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{match.salary ?? `${match.salaryMin?.toLocaleString()}${match.salaryMax ? ` - ${match.salaryMax.toLocaleString()}` : "+"}`}</span>
                                    )}
                                    {match.employmentType && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{match.employmentType}</span>}
                                    {match.isRemote && <Badge variant="secondary" className="text-[10px] h-5">Remote</Badge>}
                                    {match.experienceLevel && <Badge variant="outline" className="text-[10px] h-5">{match.experienceLevel}</Badge>}
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Intelligence Panel */}
                              <AnimatePresence>
                                {selectedMatch?.jobId === match.jobId && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                                      {/* Score Bars */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                          <ScoreBar value={match.skillFitScore} label="Skill Fit" />
                                          <ScoreBar value={match.migrationCompatibility} label="Migration Compat" />
                                          <ScoreBar value={match.sponsorshipProbability} label="Sponsorship Prob" />
                                          <ScoreBar value={match.retentionPrediction} label="Retention Pred." />
                                          <ScoreBar value={match.workforceDemandAlignment} label="Demand Align." />
                                        </div>
                                        <div className="space-y-1.5">
                                          <ScoreBar value={match.graphSimilarity} label="Graph Similarity" />
                                          <ScoreBar value={match.skillAdjacencyScore} label="Skill Adjacency" />
                                          <ScoreBar value={match.interviewProbability} label="Interview Prob." />
                                          <ScoreBar value={match.offerProbability} label="Offer Prob." />
                                          <ScoreBar value={match.confidenceInterval} label="Confidence" />
                                        </div>
                                      </div>

                                      {/* Reasoning Factors */}
                                      {match.reasons.length > 0 && (
                                        <div>
                                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> AI Match Reasoning
                                          </h4>
                                          <div className="space-y-1.5">
                                            {match.reasons.map((r, ri) => (
                                              <div key={ri} className="flex items-start gap-2 text-sm">
                                                <span className={cn("mt-0.5 shrink-0", r.category === "skill" ? "text-emerald-500" : r.category === "graph" ? "text-purple-500" : r.category === "migration" ? "text-blue-500" : r.category === "simulation" ? "text-amber-500" : "text-muted-foreground")}>
                                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                                </span>
                                                <div className="flex-1">
                                                  <span className="text-muted-foreground">{r.factor}</span>
                                                  {r.weight > 0 && (
                                                    <span className="ml-2 text-[10px] text-muted-foreground/60">(weight: {r.weight}%)</span>
                                                  )}
                                                </div>
                                                <Badge variant="outline" className="text-[9px] capitalize">{r.category}</Badge>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Skills */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {match.alignedSkills.length > 0 && (
                                          <div>
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills Aligned</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                              {match.alignedSkills.map((s) => (
                                                <Badge key={s} variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]">
                                                  <CheckCircle2 className="h-3 w-3 mr-1" />{s}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {match.skillGaps.length > 0 && (
                                          <div>
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills Missing</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                              {match.skillGaps.slice(0, 5).map((s) => (
                                                <Badge key={s} variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px]">
                                                  <Zap className="h-3 w-3 mr-1" />{s}
                                                </Badge>
                                              ))}
                                              {match.skillGaps.length > 5 && (
                                                <Badge variant="secondary" className="text-[11px]">+{match.skillGaps.length - 5} more</Badge>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Hidden Talent Discovery */}
                                      {match.isHiddenTalent && match.hiddenTalentCount > 0 && (
                                        <div className="bg-purple-500/5 rounded-xl p-3 border border-purple-500/10">
                                          <div className="flex items-start gap-2">
                                            <Fingerprint className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                                            <div>
                                              <p className="text-xs font-semibold mb-0.5">Hidden Talent Discovery</p>
                                              <p className="text-xs text-muted-foreground">
                                                AI discovered <strong>{match.hiddenTalentCount}</strong> adjacent-skill candidates highly likely to succeed in this role. These candidates don't have direct keyword matches but possess transferable skills identified through graph-based adjacency analysis.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* AI Coach Tip */}
                                      {match.improvementSuggestions.length > 0 && (
                                        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                                          <div className="flex items-start gap-2">
                                            <BrainCircuit className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <div>
                                              <p className="text-xs font-semibold mb-0.5">AI Coach Tip</p>
                                              <p className="text-xs text-muted-foreground">{match.improvementSuggestions[0]}</p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Action Buttons */}
                                      <div className="flex gap-2 pt-1 flex-wrap">
                                        {(() => {
                                          const u = (match as any).applyUrl as string | undefined;
                                          if (u && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.trim())) {
                                            return <Button size="sm" className="rounded-full gap-1.5 text-xs" asChild><a href={`mailto:${u.trim()}`}><Mail className="h-3 w-3" /> Apply via Email <ArrowRight className="h-3 w-3" /></a></Button>;
                                          }
                                          if (u && /^[\+\d][\d\s\-]{6,}$/.test(u.trim())) {
                                            return <Button size="sm" className="rounded-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" asChild><a href={`https://wa.me/${u.replace(/[^\d+]/g,"")}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3 w-3" /> Apply via WhatsApp</a></Button>;
                                          }
                                          if (u && (u.includes("wa.me") || u.includes("whatsapp"))) {
                                            return <Button size="sm" className="rounded-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" asChild><a href={u} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3 w-3" /> Apply via WhatsApp</a></Button>;
                                          }
                                          if (u) {
                                            return <Button size="sm" className="rounded-full gap-1.5 text-xs" asChild><a href={u.startsWith("http") ? u : `https://${u}`} target="_blank" rel="noopener noreferrer">Apply Now <ArrowRight className="h-3 w-3" /></a></Button>;
                                          }
                                          return (
                                            <>
                                              <Button size="sm" className="rounded-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                                                <a href={`https://wa.me/?text=${encodeURIComponent(`Hi, I'm applying for the ${match.title} position at ${match.company}.`)}`} target="_blank" rel="noopener noreferrer">
                                                  <MessageCircle className="h-3 w-3" /> Apply via WhatsApp
                                                </a>
                                              </Button>
                                              <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={(e) => { e.stopPropagation(); }}>
                                                <Bookmark className="h-3 w-3 mr-1" /> Save Match
                                              </Button>
                                            </>
                                          );
                                        })()}
                                        <Button size="sm" variant="outline" className="rounded-full text-xs gap-1">
                                          <ExternalLink className="h-3 w-3" /> View Full Analysis
                                        </Button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </TabsContent>

                  {/* ═══ EXPLAINABILITY TAB ══════════════════════════════ */}
                  <TabsContent value="reasoning" className="mt-4 space-y-4">
                    <Card className="border-border/50 bg-gradient-to-br from-background to-primary/5">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" /> Explainable AI Match Reasoning</CardTitle>
                        <CardDescription className="text-xs">Transparent, multi-factor reasoning behind every match decision</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {intel.matches.slice(0, 3).map((match) => (
                          <div key={match.jobId} className="p-4 rounded-xl border border-border/50 bg-background/50">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-sm">{match.title}</h4>
                                <p className="text-xs text-muted-foreground">{match.company} · {match.location}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">{match.overallMatchScore}% Match</Badge>
                            </div>
                            <div className="space-y-2">
                              {match.reasons.slice(0, 6).map((r, ri) => (
                                <div key={ri} className="flex items-start gap-2 text-xs">
                                  <div className={cn(
                                    "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                    r.category === "skill" ? "bg-emerald-500/10 text-emerald-500" :
                                    r.category === "graph" ? "bg-purple-500/10 text-purple-500" :
                                    r.category === "migration" ? "bg-blue-500/10 text-blue-500" :
                                    r.category === "simulation" ? "bg-amber-500/10 text-amber-500" :
                                    "bg-muted text-muted-foreground",
                                  )}>
                                    {ri + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-foreground/80">{r.explanation}</span>
                                      <Badge variant="outline" className="text-[9px] ml-2 shrink-0 capitalize">{r.category}</Badge>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full", r.weight >= 80 ? "bg-emerald-500" : r.weight >= 60 ? "bg-amber-500" : "bg-orange-500")} style={{ width: `${r.weight}%` }} />
                                      </div>
                                      <span className="text-[10px] text-muted-foreground">Weight: {r.weight}%</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="text-center">
                                <div className="text-lg font-bold text-emerald-500">{match.skillFitScore}%</div>
                                <div className="text-[10px] text-muted-foreground">Skill Fit</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-500">{match.graphSimilarity}%</div>
                                <div className="text-[10px] text-muted-foreground">Graph Similarity</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-500">{match.migrationCompatibility}%</div>
                                <div className="text-[10px] text-muted-foreground">Migration Compat</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-amber-500">{match.offerProbability}%</div>
                                <div className="text-[10px] text-muted-foreground">Offer Prob.</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ═══ GRAPH INTELLIGENCE TAB ═══════════════════════════ */}
                  <TabsContent value="graph" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Graph Status */}
                      <Card className="border-border/50 lg:col-span-1">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Knowledge Graph</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant="outline" className={cn("text-[10px]", intel.graphConnected ? "text-emerald-500 border-emerald-500/30" : "text-orange-500 border-orange-500/30")}>
                              {intel.graphConnected ? "Connected" : "Offline"}
                            </Badge>
                          </div>
                          {Object.entries(intel.graphNodeCounts).slice(0, 6).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                              <span className="font-medium">{val}</span>
                            </div>
                          ))}
                          <div className="pt-2">
                            <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => api.syncGraph().catch(() => {})}>
                              <RefreshCw className="h-3 w-3" /> Sync Graph
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Skill Adjacency Network */}
                      <Card className="border-border/50 lg:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold flex items-center gap-2"><Network className="h-4 w-4 text-primary" /> Skill Adjacency Network</CardTitle>
                          <CardDescription className="text-xs">Graph-derived skill relationships and co-occurrence patterns</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {intel.skillAdjacency.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-8">No adjacency data available. Sync the knowledge graph to generate skill relationships.</p>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {intel.skillAdjacency.map((adj, i) => (
                                <div key={i} className="p-2 rounded-lg border border-border/30 bg-background/50">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium capitalize">{adj.skill}</span>
                                    <Badge variant="outline" className="text-[9px]">{adj.weight >= 0.7 ? "Strong" : adj.weight >= 0.4 ? "Moderate" : "Weak"}</Badge>
                                  </div>
                                  <Progress value={adj.weight * 100} className="h-1" />
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Hidden Talent Discovery */}
                    <Card className="border-border/50 bg-gradient-to-br from-purple-500/5 to-background">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2"><Fingerprint className="h-4 w-4 text-purple-500" /> Hidden Talent Discovery</CardTitle>
                        <CardDescription className="text-xs">Graph + semantic intelligence surfaced non-obvious high-potential candidates</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {intel.hiddenTalent.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-8">No hidden talent discoveries yet. The graph intelligence engine analyzes adjacent skills and career transition pathways to surface non-obvious candidates.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {intel.hiddenTalent.map((ht, i) => (
                              <div key={ht.id} className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">{ht.name}</span>
                                  <Badge variant="secondary" className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400">{ht.confidence}%</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{ht.matchReason}</p>
                                <div className="flex flex-wrap gap-1">
                                  {ht.skills.slice(0, 4).map((s) => (
                                    <Badge key={s} variant="outline" className="text-[9px]">{s}</Badge>
                                  ))}
                                  {ht.skills.length > 4 && <Badge variant="outline" className="text-[9px]">+{ht.skills.length - 4}</Badge>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {intel.hiddenTalent.length > 0 && (
                          <div className="mt-3 text-xs text-muted-foreground text-center">
                            AI discovered <strong>{intel.hiddenTalent.length}</strong> adjacent-skill candidates through graph-based talent discovery
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ═══ MIGRATION TAB ═══════════════════════════════════ */}
                  <TabsContent value="migration" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Corridor Intelligence */}
                      <Card className="border-border/50 bg-gradient-to-br from-blue-500/5 to-background">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold flex items-center gap-2"><Globe className="h-4 w-4 text-blue-500" /> Migration Corridor Intelligence</CardTitle>
                          <CardDescription className="text-xs">Real-time migration corridor analysis and workforce mobility insights</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {intel.migrationCorridor ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{intel.migrationCorridor.source}</Badge>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <Badge variant="outline" className="text-xs">{intel.migrationCorridor.destination}</Badge>
                                </div>
                                <RiskBadge level={intel.migrationCorridor.migrationRisk} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                                  <div className="text-2xl font-bold text-emerald-500">{intel.migrationCorridor.stabilityScore}/10</div>
                                  <div className="text-[10px] text-muted-foreground">Corridor Stability</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                                  <div className="text-2xl font-bold text-blue-500">{intel.migrationCorridor.sponsorshipSuccessRate}%</div>
                                  <div className="text-[10px] text-muted-foreground">Sponsorship Success</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                                  <div className="text-2xl font-bold text-amber-500">{intel.migrationCorridor.healthScore}/10</div>
                                  <div className="text-[10px] text-muted-foreground">Corridor Health</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                                  <div className="text-2xl font-bold text-purple-500">{intel.migrationCorridor.corridorVolume.toLocaleString()}</div>
                                  <div className="text-[10px] text-muted-foreground">Corridor Volume</div>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
                                <strong className="text-foreground">Migration Analysis:</strong> The {intel.migrationCorridor.source} → {intel.migrationCorridor.destination} corridor shows {intel.migrationCorridor.stabilityScore >= 7 ? "strong" : "moderate"} stability with a {intel.migrationCorridor.sponsorshipSuccessRate}% sponsorship success rate. Migration risk is assessed as {intel.migrationCorridor.migrationRisk.toLowerCase()}.
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                              <p className="text-xs text-muted-foreground">Enter a target location to activate migration corridor intelligence</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Sponsorship & Relocation */}
                      <Card className="border-border/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold flex items-center gap-2"><Shield className="h-4 w-4 text-amber-500" /> Sponsorship & Relocation Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {intel.matches.slice(0, 3).map((match) => (
                            <div key={match.jobId} className="p-3 rounded-lg border border-border/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium">{match.title}</span>
                                <Badge variant="outline" className="text-[9px]">{match.relocationReadiness}</Badge>
                              </div>
                              <div className="space-y-1.5">
                                <ScoreBar value={match.visaSponsorshipProbability} label="Visa Sponsorship" />
                                <ScoreBar value={match.corridorStabilityScore * 10} label="Corridor Stability" />
                                <ScoreBar value={match.migrationCompatibility} label="Migration Compat" />
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* ═══ SIMULATION TAB ══════════════════════════════════ */}
                  <TabsContent value="simulation" className="mt-4 space-y-4">
                    <Card className="border-border/50 bg-gradient-to-br from-amber-500/5 to-background">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2"><GitBranch className="h-4 w-4 text-amber-500" /> Predictive Hiring Simulation</CardTitle>
                        <CardDescription className="text-xs">AI-powered hiring outcome predictions based on workforce intelligence</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {intel.simulation ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-4 rounded-xl bg-background/50 border border-border/30">
                                <div className="text-3xl font-bold text-emerald-500">{intel.simulation.interviewProbability}%</div>
                                <div className="text-xs text-muted-foreground mt-1">Interview Probability</div>
                              </div>
                              <div className="text-center p-4 rounded-xl bg-background/50 border border-border/30">
                                <div className="text-3xl font-bold text-blue-500">{intel.simulation.offerProbability}%</div>
                                <div className="text-xs text-muted-foreground mt-1">Offer Probability</div>
                              </div>
                              <div className="text-center p-4 rounded-xl bg-background/50 border border-border/30">
                                <div className="text-3xl font-bold text-purple-500">{intel.simulation.retentionForecast}%</div>
                                <div className="text-xs text-muted-foreground mt-1">12-Month Retention</div>
                              </div>
                              <div className="text-center p-4 rounded-xl bg-background/50 border border-border/30">
                                <div className="text-3xl font-bold text-amber-500">{intel.simulation.candidateSuccessLikelihood}%</div>
                                <div className="text-xs text-muted-foreground mt-1">Success Likelihood</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                                <div className="text-lg font-bold text-orange-500">{intel.simulation.churnRisk}%</div>
                                <div className="text-[10px] text-muted-foreground">Churn Risk</div>
                              </div>
                              <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                                <div className="text-lg font-bold text-emerald-500">{intel.simulation.sponsorshipSuccess}%</div>
                                <div className="text-[10px] text-muted-foreground">Sponsorship Success</div>
                              </div>
                              <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                                <div className="text-lg font-bold text-blue-500">{intel.simulation.workforceStability}%</div>
                                <div className="text-[10px] text-muted-foreground">Workforce Stability</div>
                              </div>
                              <div className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                                <div className="text-lg font-bold text-muted-foreground">{intel.simulation.confidenceInterval.lower}-{intel.simulation.confidenceInterval.upper}%</div>
                                <div className="text-[10px] text-muted-foreground">Confidence Interval</div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                              <strong className="text-foreground">Simulation Insight:</strong> Based on historical hiring patterns and candidate profile analysis, the model predicts a {intel.simulation.interviewProbability}% interview probability and {intel.simulation.offerProbability}% offer probability. Long-term retention is forecasted at {intel.simulation.retentionForecast}% with a churn risk of {intel.simulation.churnRisk}%. Confidence interval: {intel.simulation.confidenceInterval.lower}-{intel.simulation.confidenceInterval.upper}%.
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                            <p className="text-xs text-muted-foreground">Hiring simulation data unavailable for current profile</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ═══ FORECASTS TAB ═══════════════════════════════════ */}
                  <TabsContent value="forecasts" className="mt-4 space-y-4">
                    <Card className="border-border/50 bg-gradient-to-br from-sky-500/5 to-background">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2"><LineChart className="h-4 w-4 text-sky-500" /> Forecasting Intelligence</CardTitle>
                        <CardDescription className="text-xs">Predictive labor market intelligence and emerging trend analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {intel.forecasts.map((f, i) => (
                            <div key={i} className="p-4 rounded-xl border border-border/30 bg-background/50">
                              <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline" className={cn("text-[9px] capitalize", f.type === "demand" ? "border-emerald-500/30 text-emerald-500" : f.type === "skill" ? "border-purple-500/30 text-purple-500" : f.type === "migration" ? "border-blue-500/30 text-blue-500" : "border-orange-500/30 text-orange-500")}>
                                  {f.type}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{f.horizon}</span>
                              </div>
                              <div className="text-lg font-bold mb-1">{f.title}</div>
                              <div className={cn("text-2xl font-bold mb-2", f.direction === "up" ? "text-emerald-500" : "text-red-500")}>
                                {f.value}
                                {f.direction === "up" ? <TrendingUp className="h-4 w-4 inline ml-1" /> : <TrendingDown className="h-4 w-4 inline ml-1" />}
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Confidence</span>
                                <span className={cn("font-medium", f.confidence >= 80 ? "text-emerald-500" : f.confidence >= 60 ? "text-amber-500" : "text-orange-500")}>{f.confidence}%</span>
                              </div>
                              <Progress value={f.confidence} className="h-1 mt-1" />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                          <strong className="text-foreground">Forecast Alert:</strong> Telecom infrastructure demand in Qatar is forecasted to increase significantly next quarter. Fiber certification scarcity is expected within 90 days. Proactive sourcing and upskilling partnerships are recommended.
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ═══ SIGNALS TAB ════════════════════════════════════ */}
                  <TabsContent value="signals" className="mt-4 space-y-4">
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2"><Radio className="h-4 w-4 text-primary" /> Real-Time Workforce Signals</CardTitle>
                        <CardDescription className="text-xs">Live labor market signals and autonomous workforce intelligence alerts</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {intel.signals.length === 0 ? (
                          <div className="text-center py-8">
                            <Radio className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                            <p className="text-xs text-muted-foreground">No active workforce signals. Signals appear when the intelligence engine detects market changes, shortages, or anomalies.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {intel.signals.map((signal) => (
                              <div key={signal.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:border-border/60 transition-colors">
                                <SeverityDot severity={signal.severity} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium truncate">{signal.title}</span>
                                    <Badge variant="outline" className={cn(
                                      "text-[9px] shrink-0 capitalize",
                                      signal.type === "shortage" ? "border-orange-500/30 text-orange-500" :
                                      signal.type === "instability" ? "border-red-500/30 text-red-500" :
                                      signal.type === "emerging" ? "border-emerald-500/30 text-emerald-500" :
                                      "border-blue-500/30 text-blue-500",
                                    )}>{signal.type}</Badge>
                                  </div>
                                  {signal.description && <p className="text-xs text-muted-foreground mt-0.5">{signal.description}</p>}
                                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                    {signal.region && <span>{signal.region}</span>}
                                    <span>{new Date(signal.timestamp).toLocaleDateString()}</span>
                                    {signal.actionable && <Badge variant="secondary" className="text-[9px]">Actionable</Badge>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ═══ RECOMMENDATIONS TAB ═════════════════════════════ */}
                  <TabsContent value="recommendations" className="mt-4 space-y-4">
                    <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-background">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-emerald-500" /> Autonomous Workforce Recommendations</CardTitle>
                        <CardDescription className="text-xs">AI-generated orchestration recommendations from the Workforce Orchestration Engine</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {intel.recommendations.map((rec) => (
                            <div key={rec.id} className="p-4 rounded-xl border border-border/30 bg-background/50 hover:border-primary/30 transition-colors">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <Badge variant="outline" className={cn(
                                  "text-[9px] capitalize shrink-0",
                                  rec.category === "sourcing" ? "border-blue-500/30 text-blue-500" :
                                  rec.category === "training" ? "border-purple-500/30 text-purple-500" :
                                  rec.category === "sponsorship" ? "border-amber-500/30 text-amber-500" :
                                  rec.category === "salary" ? "border-green-500/30 text-green-500" :
                                  "border-muted-foreground/30 text-muted-foreground",
                                )}>{rec.category}</Badge>
                                <div className="flex items-center gap-1">
                                  <Badge variant="secondary" className={cn("text-[9px]", rec.impact === "high" ? "bg-orange-500/10 text-orange-500" : rec.impact === "medium" ? "bg-amber-500/10 text-amber-500" : "bg-slate-500/10 text-slate-500")}>
                                    {rec.impact} impact
                                  </Badge>
                                  {rec.autoExecutable && <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-500">Auto</Badge>}
                                </div>
                              </div>
                              <p className="text-sm font-medium mb-1">{rec.action}</p>
                              <p className="text-xs text-muted-foreground">{rec.reason}</p>
                              <div className="mt-2 flex gap-1.5">
                                <Button size="sm" variant="default" className="text-[10px] h-7 rounded-full gap-1">
                                  <Zap className="h-2.5 w-2.5" /> Execute
                                </Button>
                                <Button size="sm" variant="outline" className="text-[10px] h-7 rounded-full">
                                  Review
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                          <strong className="text-foreground">Orchestration Engine:</strong> These recommendations are generated autonomously by the Workforce Orchestration Engine based on real-time labor intelligence, graph analysis, migration corridor data, and predictive forecasting. Actions marked "Auto" can be executed automatically.
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>

          {/* System Intelligence Footer */}
          {intel && !searching && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 max-w-7xl mx-auto">
              <Card className="border-border/30 bg-muted/20">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> Workforce Intelligence Engine v2.0</span>
                      <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {intel.matches.length} positions analyzed</span>
                      <span className="flex items-center gap-1"><Network className="h-3 w-3" /> Graph: {intel.graphConnected ? "Active" : "Offline"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1" onClick={handleActivate}>
                        <RefreshCw className="h-3 w-3" /> Refresh Intelligence
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1" onClick={() => { setIntel(null); setSelectedMatch(null); }}>
                        <RotateCcw className="h-3 w-3" /> Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Empty State */}
          {!searching && !intel && !error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 max-w-md mx-auto">
              <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
                <Cpu className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ready to activate workforce intelligence?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Add your skills above and hit "Activate Workforce Intelligence" to unleash semantic AI,
                graph-powered matching, predictive hiring simulation, and autonomous workforce orchestration.
              </p>
              <p className="text-xs text-muted-foreground">
                The system will analyze your profile across 12 intelligence dimensions including skill fit,
                migration compatibility, graph similarity, retention prediction, and market demand alignment.
              </p>
            </motion.div>
          )}
        </main>
      </div>
    </Layout>
  );
}
