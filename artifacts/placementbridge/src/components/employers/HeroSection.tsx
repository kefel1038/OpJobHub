import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Activity, Globe, Zap, BarChart3, Shield, Workflow, LayoutDashboard } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { useAuth } from "@/hooks/use-auth";

const data = [
  { name: '00:00', value: 400 },
  { name: '04:00', value: 300 },
  { name: '08:00', value: 600 },
  { name: '12:00', value: 800 },
  { name: '16:00', value: 500 },
  { name: '20:00', value: 900 },
  { name: '23:59', value: 700 },
];

export function HeroSection() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const isEmployer = isAuthenticated && user?.role === "employer";

  const handleStartHiring = () => {
    if (isEmployer) {
      navigate("/employer/dashboard");
    } else {
      navigate("/register");
    }
  };

  return (
    <section className="relative min-h-screen bg-[#050505] overflow-hidden pt-20">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(60,80,255,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="h-3 w-3" />
              AI-Native Workforce Intelligence
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6">
              AI Workforce <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Intelligence</span> for Global Employers
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-10 leading-relaxed">
              Source, forecast, simulate, and orchestrate workforce pipelines across Africa and the GCC using autonomous labor intelligence.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <Button size="lg" onClick={handleStartHiring} className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 font-bold text-base group">
                {isEmployer ? (
                  <>Go to Dashboard <LayoutDashboard className="ml-2 h-5 w-5" /></>
                ) : (
                  <>Start Hiring <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
              <Button variant="outline" size="lg" asChild className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 px-8 h-14 font-bold text-base">
                <Link href="/contact">Book Enterprise Demo</Link>
              </Button>
              <Button variant="ghost" size="lg" asChild className="rounded-full text-blue-400 hover:text-blue-300 hover:bg-blue-400/5 px-8 h-14 font-bold text-base">
                <Link href="/ai-matching">Explore Workforce Intelligence</Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "AI Forecast Confidence", value: "98.4%", icon: Zap },
                { label: "Active Corridors", value: "24", icon: Globe },
                { label: "Intelligence Nodes", value: "1.2M", icon: Activity },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-tighter">
                    <stat.icon className="h-3 w-3" />
                    {stat.label}
                  </div>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden p-1 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
              
              <div className="relative bg-[#0a0a0a] rounded-[22px] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    <span className="text-sm font-bold text-white tracking-tight">Real-Time Labor Mobility Score</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                    <span className="animate-pulse h-1.5 w-1.5 rounded-full bg-blue-400" />
                    LIVE
                  </div>
                </div>

                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Migration Flow Velocity</div>
                    <div className="text-xl font-black text-emerald-400">+12.4%</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Skill Shortage Index</div>
                    <div className="text-xl font-black text-blue-400">8.2 / 10</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Visualizations */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 p-4 rounded-2xl bg-[#111] border border-white/10 shadow-2xl z-20"
            >
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Sponsorship Verified</span>
              </div>
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-6 w-6 rounded-full bg-gray-800 border border-white/20" />
                ))}
                <div className="h-6 w-6 rounded-full bg-blue-600 border border-white/20 flex items-center justify-center text-[8px] font-bold text-white">+84</div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-6 -left-6 p-4 rounded-2xl bg-[#111] border border-white/10 shadow-2xl z-20"
            >
              <div className="flex items-center gap-3 mb-2">
                <Workflow className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-white">Pipeline Active</span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 w-4 rounded-full ${i <= 3 ? 'bg-purple-500' : 'bg-gray-800'}`} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
