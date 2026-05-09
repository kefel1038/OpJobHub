import { motion } from "framer-motion";
import {
  BrainCircuit, TrendingUp, BarChart3, Target, Sparkles,
  Users, Briefcase, DollarSign, Clock, ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const insights = [
  { label: "Market Demand", value: "High", trend: "+23%", color: "text-emerald-500", progress: 85 },
  { label: "Salary Range", value: "$90K - $160K", trend: "+8%", color: "text-primary", progress: 72 },
  { label: "Competition Level", value: "Moderate", trend: "-5%", color: "text-amber-500", progress: 45 },
  { label: "Skills Match", value: "87%", trend: "+12%", color: "text-blue-500", progress: 87 },
];

const recommendations = [
  { icon: BrainCircuit, title: "Upskill in AI/ML", desc: "Demand for AI skills grew 180% this year", color: "text-purple-500 bg-purple-500/10" },
  { icon: TrendingUp, title: "Senior Roles Growing", desc: "Senior positions increased by 34% QoQ", color: "text-blue-500 bg-blue-500/10" },
  { icon: Target, title: "Remote Opportunities", desc: "62% of tech jobs now offer remote options", color: "text-emerald-500 bg-emerald-500/10" },
  { icon: Briefcase, title: "Top Industry: FinTech", desc: "FinTech hiring is up 41% this quarter", color: "text-amber-500 bg-amber-500/10" },
];

const marketTrends = [
  { role: "AI Engineer", growth: "+45%", hot: true },
  { role: "DevOps Lead", growth: "+32%", hot: true },
  { role: "Security Analyst", growth: "+28%", hot: true },
  { role: "Product Designer", growth: "+21%", hot: false },
  { role: "Data Engineer", growth: "+35%", hot: true },
];

export function AICareerInsights() {
  return (
    <section className="py-16 bg-muted/30 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full text-xs font-medium">
            <BrainCircuit className="h-3 w-3 mr-1" /> AI-Powered Insights
          </Badge>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-black">
              Career <span className="text-gradient">Intelligence</span>
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Real-time market analysis and personalized career recommendations powered by AI
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {insights.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border/60 bg-card p-4"
                >
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className={cn("h-3 w-3", item.color)} />
                    <span className={cn("text-xs font-medium", item.color)}>{item.trend}</span>
                    <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                  </div>
                  <Progress value={item.progress} className="h-1 mt-3 bg-muted" />
                </motion.div>
              ))}
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Hottest Roles This Month
              </h3>
              <div className="space-y-3">
                {marketTrends.map((trend, i) => (
                  <div key={trend.role} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{i + 1}.</span>
                      <span className="text-sm font-medium">{trend.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-500">{trend.growth}</span>
                      {trend.hot && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium animate-pulse">HOT</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Recommendations
              </h3>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <motion.div
                    key={rec.title}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", rec.color)}>
                      <rec.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{rec.title}</p>
                      <p className="text-xs text-muted-foreground">{rec.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="text-lg font-bold mb-2">Salary Insights Graph</h3>
              <div className="flex items-end gap-1.5 h-24">
                {[35, 50, 45, 62, 58, 72, 68, 85, 78, 92, 88, 95].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.03 }}
                      className={cn(
                        "w-full rounded-t-md transition-colors",
                        i > 7 ? "bg-primary" : "bg-primary/30"
                      )}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
                <span>Sep</span>
                <span>Nov</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Avg. salary trend</span>
                <span className="font-bold text-emerald-500">+12.5% YoY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
