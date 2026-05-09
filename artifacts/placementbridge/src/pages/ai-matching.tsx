import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Search, MapPin, Briefcase, Building2, DollarSign,
  Target, BrainCircuit, TrendingUp, CheckCircle2, AlertCircle,
  ArrowRight, ChevronRight, Bookmark, BookmarkCheck, X,
  Upload, Filter, SlidersHorizontal, RotateCcw, Loader2,
  GraduationCap, Zap, Star, Clock, BarChart3,
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
import { api, getToken } from "@/lib/api";

interface MatchResult {
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
}

interface GapResult {
  marketSkills: Array<{ skill: string; demand: number; avgSalary: number }>;
  missingSkills: Array<{ skill: string; demand: number; avgSalary: number }>;
  aiAdvice: string;
  totalJobsAnalyzed: number;
}

function MatchScoreCircle({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "sm" ? 40 : size === "lg" ? 72 : 56;
  const strokeWidth = size === "sm" ? 3 : 4;
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.min(score, 100)) / 100;
  const color = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-orange-500";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: dimensions, height: dimensions }}>
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox={`0 0 ${dimensions} ${dimensions}`}>
        <circle cx={dimensions / 2} cy={dimensions / 2} r={radius} fill="transparent" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle cx={dimensions / 2} cy={dimensions / 2} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} className={color} strokeLinecap="round" />
      </svg>
      <span className={cn("font-bold", size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-sm", color)}>
        {Math.min(score, 100)}%
      </span>
    </div>
  );
}

export default function AIMatching() {
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<GapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [resultsTab, setResultsTab] = useState("matches");
  const [selectedJob, setSelectedJob] = useState<MatchResult | null>(null);

  const isAuthenticated = !!getToken();

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

  const handleSearch = useCallback(async () => {
    if (!skills.length) return;
    setSearching(true);
    setError("");
    setMatches([]);
    setGapAnalysis(null);
    setSelectedJob(null);
    try {
      const [matchRes, gapRes] = await Promise.all([
        api.matchByProfile({ skills, experience: experience || undefined, location: location || undefined, preferences: preferences.length ? preferences : undefined }),
        api.careerGaps({ skills, targetRole: undefined }),
      ]);
      setMatches(matchRes.matches);
      setGapAnalysis(gapRes);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }, [skills, experience, location, preferences]);

  const toggleSaved = useCallback((jobId: number) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  const experienceLevels = ["Entry", "Mid", "Senior", "Lead", "Principal"];

  return (
    <Layout>
      <div className="pt-16 pb-12">
        <main className="container mx-auto px-4 py-8">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto mb-10">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1.5 text-xs font-medium gap-1.5 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3" />
              AI Job Matching Engine
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Find Jobs That Match <span className="text-primary">Your Skills</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter your skills and preferences. Our AI analyzes thousands of jobs to find the perfect match, explains why, and helps you close skill gaps.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-3xl mx-auto mb-10">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Skills <span className="text-destructive">*</span></label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="e.g. React, Node.js, Python"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    />
                    <Button onClick={addSkill} variant="secondary" className="shrink-0">Add</Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <Badge key={s} variant="secondary" className="gap-1 pr-1">
                          {s}
                          <button onClick={() => removeSkill(s)} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="e.g. Doha, Qatar" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Experience Level</label>
                    <div className="flex gap-2">
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
                  <label className="text-sm font-medium mb-1.5 block">Preferences</label>
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

                <Button size="lg" className="w-full rounded-full gap-2" onClick={handleSearch} disabled={!skills.length || searching}>
                  {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  {searching ? "Analyzing..." : "Find Matches"}
                </Button>
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
            <div className="max-w-6xl mx-auto space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-64" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-full max-w-md" />
                      </div>
                      <Skeleton className="h-10 w-24 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {!searching && matches.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
                {/* Profile Summary */}
                <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-muted/30 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-medium">Your Profile:</span>
                  </div>
                  {skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                  {location && <Badge variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" />{location}</Badge>}
                  {experience && <Badge variant="outline" className="text-xs"><Briefcase className="h-3 w-3 mr-1" />{experience}</Badge>}
                  <Button variant="ghost" size="sm" className="ml-auto text-xs gap-1" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="h-3 w-3" />
                    {showFilters ? "Hide Filters" : "Filters"}
                  </Button>
                </div>

                <div className="flex gap-6">
                  {/* Filters Sidebar */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.aside
                        initial={{ opacity: 0, x: -20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 240 }}
                        exit={{ opacity: 0, x: -20, width: 0 }}
                        className="shrink-0 hidden md:block"
                      >
                        <Card className="border-border/50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4" />
                                Filters
                              </CardTitle>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFilters(false)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Job Type</h4>
                              {["Full-Time", "Part-Time", "Contract"].map((t) => (
                                <label key={t} className="flex items-center gap-2 py-1.5 cursor-pointer">
                                  <input type="checkbox" checked={preferences.includes(t)} onChange={() => togglePreference(t)} className="h-3.5 w-3.5 rounded accent-primary" />
                                  <span className="text-sm">{t}</span>
                                </label>
                              ))}
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Work Mode</h4>
                              {["Remote", "Hybrid", "Onsite"].map((t) => (
                                <label key={t} className="flex items-center gap-2 py-1.5 cursor-pointer">
                                  <input type="checkbox" checked={preferences.includes(t)} onChange={() => togglePreference(t)} className="h-3.5 w-3.5 rounded accent-primary" />
                                  <span className="text-sm">{t}</span>
                                </label>
                              ))}
                            </div>
                            <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={() => setPreferences([])}>
                              <RotateCcw className="h-3 w-3" /> Reset
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.aside>
                    )}
                  </AnimatePresence>

                  {/* Main Results */}
                  <div className="flex-1 min-w-0">
                    <Tabs value={resultsTab} onValueChange={setResultsTab} className="w-full">
                      <div className="flex items-center justify-between mb-6">
                        <TabsList>
                          <TabsTrigger value="matches" className="gap-2">
                            <Search className="h-4 w-4" /> Matches ({matches.length})
                          </TabsTrigger>
                          <TabsTrigger value="saved" className="gap-2">
                            <Bookmark className="h-4 w-4" /> Saved ({savedJobIds.size})
                          </TabsTrigger>
                          <TabsTrigger value="gaps" className="gap-2">
                            <TrendingUp className="h-4 w-4" /> Skill Gaps
                          </TabsTrigger>
                        </TabsList>
                        <p className="text-xs text-muted-foreground hidden sm:block">Analyzed {gapAnalysis?.totalJobsAnalyzed ?? 0} jobs</p>
                      </div>

                      <TabsContent value="matches" className="mt-0 space-y-4">
                        {matches.filter((m) => !savedJobIds.has(m.jobId) || resultsTab === "matches").map((match, i) => (
                          <motion.div
                            key={match.jobId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Card
                              className={cn(
                                "border-border/50 shadow-sm hover:border-primary/40 transition-all cursor-pointer group",
                                selectedJob?.jobId === match.jobId && "ring-1 ring-primary",
                              )}
                              onClick={() => setSelectedJob(selectedJob?.jobId === match.jobId ? null : match)}
                            >
                              <CardContent className="p-5">
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
                                        </div>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                          <Building2 className="h-3.5 w-3.5" />{match.company}
                                        </p>
                                      </div>
                                      <MatchScoreCircle score={match.matchScore} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{match.location}</span>
                                      {(match.salaryMin || match.salary) && (
                                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{match.salary ?? `${match.salaryMin?.toLocaleString()}${match.salaryMax ? ` - ${match.salaryMax.toLocaleString()}` : "+"}`}</span>
                                      )}
                                      {match.employmentType && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{match.employmentType}</span>}
                                      {match.isRemote && <Badge variant="secondary" className="text-[10px] h-5">Remote</Badge>}
                                      {match.experienceLevel && <Badge variant="outline" className="text-[10px] h-5">{match.experienceLevel}</Badge>}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1.5 shrink-0">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={(e) => { e.stopPropagation(); toggleSaved(match.jobId); }}
                                    >
                                      {savedJobIds.has(match.jobId) ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>

                                {/* Expanded AI Explanation */}
                                <AnimatePresence>
                                  {selectedJob?.jobId === match.jobId && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                                        {/* Why This Matches */}
                                        {match.reasons.length > 0 && (
                                          <div>
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Why this matches you
                                            </h4>
                                            <div className="space-y-1.5">
                                              {match.reasons.map((r, ri) => (
                                                <div key={ri} className="flex items-start gap-2 text-sm">
                                                  <span className="text-emerald-500 mt-0.5 shrink-0"><CheckCircle2 className="h-3.5 w-3.5" /></span>
                                                  <span className="text-muted-foreground">{r}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* Skills Aligned */}
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

                                          {/* Skill Gaps */}
                                          {match.skillGaps.length > 0 && (
                                            <div>
                                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills Missing</h4>
                                              <div className="flex flex-wrap gap-1.5">
                                                {match.skillGaps.slice(0, 4).map((s) => (
                                                  <Badge key={s} variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px]">
                                                    <Zap className="h-3 w-3 mr-1" />{s}
                                                  </Badge>
                                                ))}
                                                {match.skillGaps.length > 4 && (
                                                  <Badge variant="secondary" className="text-[11px]">+{match.skillGaps.length - 4} more</Badge>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Improvement Suggestions */}
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

                                        <div className="flex gap-2 pt-1">
                                          <Button size="sm" className="rounded-full gap-1.5 text-xs">
                                            Apply Now <ArrowRight className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={(e) => { e.stopPropagation(); toggleSaved(match.jobId); }}>
                                            {savedJobIds.has(match.jobId) ? "Saved" : "Save Job"}
                                          </Button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}

                        {matches.length === 0 && (
                          <div className="text-center py-16 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="font-medium">No matches found</p>
                            <p className="text-sm">Try adding more skills or changing your filters</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="saved" className="mt-0 space-y-4">
                        {savedJobIds.size === 0 ? (
                          <div className="text-center py-16 text-muted-foreground">
                            <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="font-medium">No saved matches</p>
                            <p className="text-sm">Click the bookmark icon on a job to save it here</p>
                          </div>
                        ) : (
                          matches.filter((m) => savedJobIds.has(m.jobId)).map((match) => (
                            <Card key={match.jobId} className="border-border/50">
                              <CardContent className="p-5 flex items-start gap-4">
                                <MatchScoreCircle score={match.matchScore} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-sm">{match.title}</h3>
                                  <p className="text-xs text-muted-foreground">{match.company} · {match.location}</p>
                                </div>
                                <Button size="sm" variant="ghost" className="shrink-0 h-8" onClick={() => toggleSaved(match.jobId)}>
                                  <BookmarkCheck className="h-4 w-4 text-primary mr-1" /> Saved
                                </Button>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </TabsContent>

                      <TabsContent value="gaps" className="mt-0">
                        {gapAnalysis && (
                          <div className="space-y-6">
                            {/* AI Advice */}
                            {gapAnalysis.aiAdvice && (
                              <Card className="bg-primary/5 border-primary/10">
                                <CardContent className="p-5 flex items-start gap-3">
                                  <BrainCircuit className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                  <div>
                                    <h4 className="text-sm font-bold mb-1">AI Career Insight</h4>
                                    <p className="text-sm text-muted-foreground">{gapAnalysis.aiAdvice}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Missing Skills */}
                              <Card className="border-border/50">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    Skills to Learn
                                  </CardTitle>
                                  <CardDescription className="text-xs">High-demand skills you're missing</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {gapAnalysis.missingSkills.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No gaps found — your skills are well-aligned!</p>
                                  )}
                                  {gapAnalysis.missingSkills.slice(0, 6).map((s) => (
                                    <div key={s.skill} className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-sm font-medium capitalize">{s.skill}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{s.demand} jobs</span>
                                        <Badge variant="secondary" className="text-[10px]">
                                          {s.avgSalary > 0 ? `QAR ${s.avgSalary.toLocaleString()}` : ""}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>

                              {/* Market Trends */}
                              <Card className="border-border/50">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    Market Skill Demand
                                  </CardTitle>
                                  <CardDescription className="text-xs">Most requested skills in the Gulf job market</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {gapAnalysis.marketSkills.map((s) => {
                                    const maxDemand = Math.max(...gapAnalysis.marketSkills.map((x) => x.demand));
                                    return (
                                      <div key={s.skill}>
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm font-medium capitalize">{s.skill}</span>
                                          <span className="text-xs text-muted-foreground">{s.demand} openings</span>
                                        </div>
                                        <Progress value={(s.demand / maxDemand) * 100} className="h-1.5" />
                                      </div>
                                    );
                                  })}
                                </CardContent>
                                <CardFooter className="pt-0 text-xs text-muted-foreground">
                                  Based on {gapAnalysis.totalJobsAnalyzed} active job postings
                                </CardFooter>
                              </Card>
                            </div>

                            {/* Improve Score CTA */}
                            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                  <GraduationCap className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                  <h4 className="font-bold text-sm">Improve Your Match Score</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {gapAnalysis.missingSkills.length > 0
                                      ? `Learning ${gapAnalysis.missingSkills.slice(0, 2).map((s) => s.skill).join(" and ")} could unlock ${Math.min(30, gapAnalysis.missingSkills.length * 8)}% more job matches.`
                                      : "Your skills are in demand! Keep building your profile."}
                                  </p>
                                </div>
                                <Button className="rounded-full shrink-0 gap-1.5 text-xs">
                                  View Learning Roadmap <ArrowRight className="h-3 w-3" />
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State (no search yet) */}
          {!searching && matches.length === 0 && !error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 max-w-md mx-auto">
              <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ready to find your next role?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Add your skills above and hit "Find Matches" to get AI-powered job recommendations tailored to you.
              </p>
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground">
                  <a href="/login" className="text-primary hover:underline">Sign in</a> to upload your resume for deeper ATS analysis and personalized career insights.
                </p>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </Layout>
  );
}