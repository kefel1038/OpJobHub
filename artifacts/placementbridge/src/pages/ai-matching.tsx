import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  TrendingUp,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Briefcase,
  Search,
  Zap,
  ChevronRight,
  Cpu,
  BrainCircuit,
  MapPin,
  Building2,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const MOCK_RADAR_DATA = [
  { subject: "ATS Compatibility", A: 92, fullMark: 100 },
  { subject: "Keyword Strength", A: 80, fullMark: 100 },
  { subject: "Readability", A: 89, fullMark: 100 },
  { subject: "Skills Relevance", A: 76, fullMark: 100 },
  { subject: "Market Competitiveness", A: 71, fullMark: 100 },
];

const MOCK_DEMAND_DATA = [
  { name: "Mon", demand: 4000 },
  { name: "Tue", demand: 3000 },
  { name: "Wed", demand: 2000 },
  { name: "Thu", demand: 2780 },
  { name: "Fri", demand: 1890 },
  { name: "Sat", demand: 2390 },
  { name: "Sun", demand: 3490 },
];

const MOCK_MATCHES = [
  {
    id: 1,
    title: "Senior Cloud Architect",
    company: "Google Cloud",
    location: "Doha, Qatar",
    salary: "QAR 25,000 - 35,000",
    matchScore: 94,
    tags: ["High Demand", "Remote Friendly"],
  },
  {
    id: 2,
    title: "Full Stack Engineer",
    company: "Qatar Airways",
    location: "Doha, Qatar",
    salary: "QAR 18,000 - 24,000",
    matchScore: 89,
    tags: ["Gulf Focused"],
  },
  {
    id: 3,
    title: "Technical Support Specialist",
    company: "Ooredoo",
    location: "Doha, Qatar",
    salary: "QAR 12,000 - 15,000",
    matchScore: 82,
    tags: ["Entry Level"],
  },
];

export default function AIMatching() {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setIsAnalyzed(true);
        }, 500);
      }
    }, 200);
  };

  return (
    <Layout>
      <div className="pt-16 pb-12">

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium gap-1.5 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3" />
              Next-Gen Career Intelligence
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              Your Career, <span className="text-primary">AI-Powered</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              Upload your resume and let our advanced AI engine optimize it for ATS, 
              match you with top jobs in the Gulf, and provide real-time market insights.
            </p>
          </motion.div>

          {!isAnalyzed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div
                className={`group relative flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-3xl p-12 transition-all hover:border-primary/40 hover:bg-primary/[0.02] cursor-pointer ${
                  isUploading ? "pointer-events-none" : ""
                }`}
                onClick={() => !isUploading && handleUpload()}
              >
                {isUploading ? (
                  <div className="w-full max-w-sm space-y-4">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 animate-spin text-primary" />
                        AI Analysis in progress...
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center animate-pulse">
                      Extracting semantic data, generating embeddings, and scanning ATS patterns...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Drop your resume here</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      PDF, DOCX supported. Max file size 10MB.
                    </p>
                    <Button size="lg" className="rounded-full px-8">
                      Select File
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {isAnalyzed && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ATS Score Card */}
                <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        AI ATS Score Dashboard
                      </CardTitle>
                      <CardDescription>Comprehensive analysis of your resume performance</CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20 text-lg py-1.5 px-4 rounded-full">
                      87/100
                    </Badge>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-8 pt-6">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={MOCK_RADAR_DATA}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                          <Radar
                            name="Resume Score"
                            dataKey="A"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.4}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">ATS Compatibility</span>
                          <span className="text-sm font-bold text-emerald-500">92%</span>
                        </div>
                        <Progress value={92} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Keyword Strength</span>
                          <span className="text-sm font-bold text-amber-500">80%</span>
                        </div>
                        <Progress value={80} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Readability</span>
                          <span className="text-sm font-bold text-blue-500">89%</span>
                        </div>
                        <Progress value={89} className="h-1.5" />
                      </div>
                      <div className="pt-4 grid grid-cols-2 gap-3">
                        <Button variant="outline" className="rounded-full gap-2 text-xs h-9">
                          <Zap className="h-3 w-3" />
                          Optimize Resume
                        </Button>
                        <Button variant="outline" className="rounded-full gap-2 text-xs h-9">
                          <FileText className="h-3 w-3" />
                          Cover Letter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Market Insights Card */}
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Market Positioning
                    </CardTitle>
                    <CardDescription>How you rank in the Gulf market</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">ATS Rank</span>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">Top 25%</Badge>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">Market Demand</span>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">High</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Salary Potential</span>
                        <span className="font-bold">QAR 15k-22k</span>
                      </div>
                    </div>
                    <div className="h-[120px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_DEMAND_DATA}>
                          <Bar dataKey="demand" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Demand for your role in Qatar is up 12% this month.</p>
                  </CardContent>
                </Card>
              </div>

              {/* Suggestions and Matches */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* AI Suggestions */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    AI Optimization Tips
                  </h3>
                  <div className="space-y-3">
                    <SuggestionItem 
                      type="warning" 
                      title="Missing Keywords" 
                      desc="Add 'Cloud Governance' and 'Terraform' to your skills section to improve visibility." 
                    />
                    <SuggestionItem 
                      type="info" 
                      title="Weak Achievements" 
                      desc="Try to quantify your results. E.g., 'Improved server uptime by 15%'" 
                    />
                    <SuggestionItem 
                      type="success" 
                      title="Strong Headline" 
                      desc="Your headline effectively captures your seniority level and core expertise." 
                    />
                  </div>
                  
                  <Card className="bg-primary text-primary-foreground border-0 overflow-hidden relative">
                    <Sparkles className="absolute -top-4 -right-4 h-24 w-24 opacity-10 rotate-12" />
                    <CardHeader className="relative z-10">
                      <CardTitle className="text-lg">One-Click Optimization</CardTitle>
                      <CardDescription className="text-primary-foreground/70">
                        Let AI rewrite your experience bullets for maximum impact.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <Button variant="secondary" className="w-full rounded-full group">
                        Upgrade Experience
                        <Zap className="ml-2 h-4 w-4 fill-current group-hover:animate-pulse" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Smart Job Matches */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" />
                      Smart Semantic Matches
                    </h3>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-primary">
                      View All <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {MOCK_MATCHES.map((match) => (
                      <Card key={match.id} className="group hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 mb-1">
                                {match.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0 h-4">{tag}</Badge>
                                ))}
                              </div>
                              <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{match.title}</h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Building2 className="h-4 w-4" /> {match.company}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4" /> {match.location}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <DollarSign className="h-4 w-4" /> {match.salary}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full border-4 border-emerald-500/20 text-emerald-500 font-bold text-sm relative">
                                <svg className="absolute inset-0 h-full w-full -rotate-90">
                                  <circle
                                    cx="28"
                                    cy="28"
                                    r="24"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeDasharray={150.8}
                                    strokeDashoffset={150.8 - (150.8 * match.matchScore) / 100}
                                    className="text-emerald-500"
                                  />
                                </svg>
                                {match.matchScore}%
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1 font-medium">Match</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-end">
                            <Button size="sm" className="rounded-full gap-2 px-6">
                              Apply Now <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Career Gap Analysis */}
              <section className="pt-8 border-t border-border/50">
                <div className="bg-muted/30 rounded-3xl p-8 border border-border/50">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="md:w-1/3 space-y-4">
                      <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <AlertCircle className="h-7 w-7 text-amber-500" />
                      </div>
                      <h3 className="text-2xl font-bold">Career Gap Analysis</h3>
                      <p className="text-muted-foreground">
                        Our AI detected missing certifications that are trending in the Qatar market for your role.
                      </p>
                      <Button variant="outline" className="rounded-full">View Learning Roadmap</Button>
                    </div>
                    <div className="flex-1 grid sm:grid-cols-2 gap-4 w-full">
                      <Card className="bg-background border-border/50">
                        <CardContent className="p-5">
                          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-amber-500/20 mb-3">Recommended</Badge>
                          <h5 className="font-bold mb-1">AWS Certified Solutions Architect</h5>
                          <p className="text-xs text-muted-foreground mb-4">Required by 65% of high-paying roles in Doha.</p>
                          <Button size="sm" variant="ghost" className="p-0 h-auto text-primary text-xs group">
                            Explore course <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardContent>
                      </Card>
                      <Card className="bg-background border-border/50">
                        <CardContent className="p-5">
                          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-blue-500/20 mb-3">Skill Gap</Badge>
                          <h5 className="font-bold mb-1">Kubernetes (K8s)</h5>
                          <p className="text-xs text-muted-foreground mb-4">You have Docker experience, but K8s is in higher demand.</p>
                          <Button size="sm" variant="ghost" className="p-0 h-auto text-primary text-xs group">
                            Explore course <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>
    </Layout>
  );
}

function SuggestionItem({ type, title, desc }: { type: 'warning' | 'info' | 'success', title: string, desc: string }) {
  const icons = {
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    info: <Zap className="h-5 w-5 text-blue-500" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  };

  const bgColors = {
    warning: 'bg-amber-500/5 border-amber-500/10',
    info: 'bg-blue-500/5 border-blue-500/10',
    success: 'bg-emerald-500/5 border-emerald-500/10',
  };

  return (
    <div className={`flex gap-4 p-4 rounded-2xl border ${bgColors[type]}`}>
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div>
        <h5 className="text-sm font-bold">{title}</h5>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{desc}</p>
      </div>
    </div>
  );
}
