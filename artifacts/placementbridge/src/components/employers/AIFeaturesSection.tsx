import { motion } from "framer-motion";
import {
  BrainCircuit, Sparkles, FileSearch, BarChart3,
  MessageSquareText, ListChecks, Zap, FileText,
  ArrowRight, CheckCircle2, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const features = [
  {
    icon: FileSearch,
    title: "AI Resume Matching",
    description: "Automatically match candidates to jobs with 94% accuracy using our advanced AI engine.",
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "ATS Candidate Scoring",
    description: "Rank and score applicants based on skills, experience, and cultural fit automatically.",
    gradient: "from-indigo-600 to-purple-500",
  },
  {
    icon: BrainCircuit,
    title: "AI Candidate Ranking",
    description: "Smart ranking algorithms surface the best candidates first, saving hours of manual screening.",
    gradient: "from-purple-600 to-pink-500",
  },
  {
    icon: MessageSquareText,
    title: "AI Interview Questions",
    description: "Generate role-specific interview questions tailored to each candidate's profile.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Bot,
    title: "AI Hiring Assistant",
    description: "24/7 AI assistant that screens candidates, answers queries, and schedules interviews.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: ListChecks,
    title: "AI-Powered Shortlisting",
    description: "Automatically shortlist the top candidates based on your custom hiring criteria.",
    gradient: "from-rose-500 to-red-500",
  },
  {
    icon: FileText,
    title: "AI Job Description Generator",
    description: "Create compelling, inclusive job descriptions optimized for your target talent pool.",
    gradient: "from-sky-500 to-blue-500",
  },
  {
    icon: Zap,
    title: "Smart Hiring Recommendations",
    description: "Get data-driven recommendations on salary, benefits, and hiring strategies.",
    gradient: "from-violet-500 to-indigo-500",
  },
];

const metrics = [
  { label: "Faster Screening", value: "90%" },
  { label: "Accuracy Rate", value: "94%" },
  { label: "Time Saved", value: "70%" },
  { label: "Cost Reduction", value: "60%" },
];

export function AIFeaturesSection() {
  return (
    <section className="py-24 employer-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-[0.02] pointer-events-none" />

      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full px-5 py-1.5 text-sm mb-6 inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI-Powered Recruitment
          </Badge>
          <h2 className="text-4xl md:text-5xl font-heading font-black text-white mb-4">
            Intelligence that finds{" "}
            <span className="text-gradient">top talent</span>
          </h2>
          <p className="text-blue-200/60 max-w-3xl mx-auto text-lg">
            Our AI doesn't just match keywords — it understands skills, culture fit, and potential.
          </p>
        </motion.div>

        {/* Metrics Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-3xl mx-auto"
        >
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="text-3xl font-black text-gradient">{metric.value}</div>
              <div className="text-sm text-blue-300/60 mt-1">{metric.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 card-hover-navy"
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold mb-2">{feature.title}</h3>
              <p className="text-blue-200/50 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* AI Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-blue-400" />
              <span className="text-white font-semibold">AI Recruitment Dashboard</span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              AI Processing: Active
            </Badge>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Resume Analysis */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-blue-200">Recent AI Analyses</h4>
                {[
                  { name: "John M.", role: "Construction Foreman", score: 96, status: "Shortlisted" },
                  { name: "Sarah K.", role: "Security Supervisor", score: 92, status: "Interviewed" },
                  { name: "Ahmed H.", role: "Electrician", score: 88, status: "Reviewed" },
                  { name: "Grace N.", role: "Domestic Worker", score: 85, status: "Shortlisted" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {item.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">{item.name}</div>
                        <div className="text-xs text-blue-300/50">{item.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-blue-300/50">{item.status}</span>
                      <span className="text-sm font-bold text-emerald-400">{item.score}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-2xl p-5 border border-blue-500/10">
                <h4 className="text-sm font-semibold text-blue-200 mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  AI Hiring Insights
                </h4>
                <div className="space-y-3">
                  {[
                    "Top 5 candidates match 95%+ of your requirements",
                    "Suggested salary range: $2,500 - $3,800/month",
                    "3 candidates available for immediate deployment",
                    "Visa processing: 2-3 weeks for selected candidates",
                  ].map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-blue-200/70">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 rounded-full px-10 h-12 font-bold shadow-lg shadow-blue-600/25 group">
            <Link href="/ai-matching">
              Explore AI Features
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
