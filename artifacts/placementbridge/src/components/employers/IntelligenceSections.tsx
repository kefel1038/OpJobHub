import { motion } from "framer-motion";
import { 
  Activity, Globe, Zap, BarChart3, TrendingUp, Users, ArrowUpRight, ArrowDownRight, 
  MapPin, ShieldCheck, Database, BrainCircuit, Sparkles
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function LiveIntelligenceSection() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // In a real app, we'd fetch from multiple endpoints
    // For now, using mock data that mimics the requested API responses
    setStats({
      activeCorridors: 24,
      gccDemand: "8.2M",
      predictedShortages: "142k",
      sponsorshipReady: "45,290",
      aiConfidence: 98.4,
      migrationVelocity: "+12.4%",
      skillShortageIndex: 8.2,
      mobilityScore: 88,
    });
  }, []);

  if (!stats) return null;

  const metrics = [
    { label: "Active Corridors", value: stats.activeCorridors, icon: Globe, color: "text-blue-400", trend: "+2" },
    { label: "GCC Migration Demand", value: stats.gccDemand, icon: TrendingUp, color: "text-indigo-400", trend: "+5.4%" },
    { label: "Predicted Shortages", value: stats.predictedShortages, icon: Activity, color: "text-amber-400", trend: "High Risk" },
    { label: "Sponsorship-Ready", value: stats.sponsorshipReady, icon: ShieldCheck, color: "text-emerald-400", trend: "Verified" },
    { label: "AI Forecast Confidence", value: `${stats.aiConfidence}%`, icon: BrainCircuit, color: "text-purple-400", trend: "Optimal" },
    { label: "Flow Velocity", value: stats.migrationVelocity, icon: Zap, color: "text-sky-400", trend: "Accelerated" },
    { label: "Skill Shortage Index", value: `${stats.skillShortageIndex}/10`, icon: Database, color: "text-rose-400", trend: "Critical" },
    { label: "Workforce Mobility", value: `${stats.mobilityScore}/100`, icon: BarChart3, color: "text-teal-400", trend: "Strategic" },
  ];

  return (
    <section className="py-24 bg-[#050505] relative border-y border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div>
            <div className="text-blue-500 font-bold text-xs uppercase tracking-widest mb-3">Real-Time Ecosystem Pulse</div>
            <h2 className="text-3xl md:text-4xl font-black text-white">Live Workforce Intelligence</h2>
          </div>
          <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 font-medium flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Continuously Synchronizing Global Talent Graphs
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <m.icon className="h-12 w-12 text-white" />
              </div>
              
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
                <m.icon className={`h-3 w-3 ${m.color}`} />
                {m.label}
              </div>

              <div className="text-3xl font-black text-white mb-2 tracking-tight">
                {m.value}
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  m.trend.includes('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {m.trend}
                </span>
                <span className="text-[10px] text-gray-600 font-medium">Updated 12s ago</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SolutionsMappingSection() {
  const solutions = [
    { 
      problem: "Telecom talent shortage", 
      solution: "Forecasting Engine", 
      desc: "Predict role-specific demand surges 12 months in advance.",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "from-blue-500 to-indigo-500"
    },
    { 
      problem: "GCC sponsorship delays", 
      solution: "Migration Intelligence", 
      desc: "Real-time tracking of sponsorship bottleneck risks across corridors.",
      icon: <Globe className="h-5 w-5" />,
      color: "from-purple-500 to-pink-500"
    },
    { 
      problem: "Low-quality applicants", 
      solution: "Autonomous Sourcing", 
      desc: "Agentic discovery of verified talent from emerging labor markets.",
      icon: <Zap className="h-5 w-5" />,
      color: "from-amber-500 to-orange-500"
    },
    { 
      problem: "Retention uncertainty", 
      solution: "Predictive Simulation", 
      desc: "Simulate tenure and cultural fit using graph-based digital twins.",
      icon: <BrainCircuit className="h-5 w-5" />,
      color: "from-emerald-500 to-teal-500"
    },
    { 
      problem: "Workforce planning blind spots", 
      solution: "Labor Intelligence", 
      desc: "Unified view of skills availability and wage pressure analytics.",
      icon: <Activity className="h-5 w-5" />,
      color: "from-sky-500 to-blue-500"
    },
    { 
      problem: "Hiring bias", 
      solution: "Explainable Governance", 
      desc: "Audit logs for every AI decision with transparency scorecards.",
      icon: <ShieldCheck className="h-5 w-5" />,
      color: "from-indigo-500 to-blue-500"
    },
  ];

  return (
    <section className="py-24 bg-[#050505]">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            From Pain Points to <span className="text-blue-500">Infrastructure Intelligence</span>
          </h2>
          <p className="text-gray-400 text-lg">
            We map critical employer challenges to our autonomous intelligence layers, transforming recruitment into predictive workforce orchestration.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((s, i) => (
            <motion.div
              key={s.problem}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 group-hover:text-gray-400 transition-colors">Problem</div>
              <div className="text-lg font-bold text-white/60 mb-6 group-hover:text-white transition-colors">{s.problem}</div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${s.color} shadow-lg shadow-blue-500/20`}>
                  {s.icon}
                </div>
                <div className="text-xl font-black text-white">{s.solution}</div>
              </div>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {s.desc}
              </p>
              
              <div className="pt-6 border-t border-white/5">
                <button className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">
                  Access Intelligence <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OrchestrationPipelineSection() {
  const steps = [
    { label: "Post Job", icon: <Database className="h-5 w-5" /> },
    { label: "AI Sourcing", icon: <Zap className="h-5 w-5" />, active: true },
    { label: "Enrichment", icon: <BrainCircuit className="h-5 w-5" />, active: true },
    { label: "Readiness Score", icon: <ShieldCheck className="h-5 w-5" /> },
    { label: "Simulation", icon: <Activity className="h-5 w-5" /> },
    { label: "Ranking", icon: <TrendingUp className="h-5 w-5" /> },
    { label: "Recommendation", icon: <Sparkles className="h-5 w-5" /> },
  ];

  return (
    <section className="py-24 bg-[#050505] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Autonomous Hiring Pipeline</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Visualize the continuous orchestration flow as AI agents discover, verify, and simulate candidates in real-time.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent -translate-y-1/2 hidden lg:block" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center group"
              >
                <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500 mb-4 ${
                  step.active 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' 
                    : 'bg-white/5 border border-white/10 text-gray-500 group-hover:border-blue-500/30'
                }`}>
                  {step.icon}
                  {step.active && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-blue-500/20"
                    />
                  )}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-tighter text-center ${
                  step.active ? 'text-white' : 'text-gray-500'
                }`}>
                  {step.label}
                </div>
                {step.active && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">Active</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="mt-16 p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/10">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase">System Health</div>
                <div className="text-lg font-black text-white">99.98% Optimal</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase">Agent Latency</div>
                <div className="text-lg font-black text-white">&lt; 40ms</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-purple-400">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase">Global Sync</div>
                <div className="text-lg font-black text-white">Synchronized</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
