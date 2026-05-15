import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Lock, Eye, CheckCircle2, AlertTriangle, Fingerprint, 
  Search, ShieldAlert, BadgeCheck, Zap, Globe, MessageSquare,
  ChevronRight, BrainCircuit, Activity, BarChart3, ArrowRight, Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function IntelligencePlatformSection() {
  const systems = [
    { title: "Labor Intelligence Engine", metric: "1.2M Data Points", confidence: 99.2, useCase: "Wage Benchmarking" },
    { title: "Migration Intelligence Layer", metric: "24 Corridors", confidence: 98.4, useCase: "Bottleneck Prediction" },
    { title: "Workforce Forecasting", metric: "12mo Horizon", confidence: 96.8, useCase: "Strategic Planning" },
    { title: "Knowledge Graph (RAG)", metric: "8.4M Relations", confidence: 99.9, useCase: "Semantic Matching" },
    { title: "Predictive Simulation", metric: "Digital Twins", confidence: 94.2, useCase: "Tenure Prediction" },
    { title: "Workforce Orchestration", metric: "Autonomous", confidence: 98.9, useCase: "Swarm Sourcing" },
  ];

  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8">Workforce Intelligence Platform</h2>
            <p className="text-gray-400 text-lg mb-12">
              Our infrastructure is built on specialized intelligence layers that transform raw labor data into actionable enterprise strategy.
            </p>
            <div className="space-y-4">
              {systems.slice(0, 3).map((s, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white mb-1">{s.title}</div>
                    <div className="text-xs text-blue-400 font-medium">{s.useCase}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white">{s.metric}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Confidence: {s.confidence}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {systems.slice(3).map((s, i) => (
              <div key={i} className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 h-full">
                <div className="text-xl font-black text-white mb-4 leading-tight">{s.title}</div>
                <div className="text-3xl font-black text-blue-500 mb-6">{s.confidence}%</div>
                <div className="space-y-2">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.confidence}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase">
                    <span>Precision Score</span>
                    <span>{s.metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function MigrationCorridorMapSection() {
  const corridors = [
    { from: "Uganda", to: "Qatar", flow: 84, health: 92, demand: "High" },
    { from: "Kenya", to: "UAE", flow: 72, health: 88, demand: "Medium" },
    { from: "Nigeria", to: "Saudi Arabia", flow: 95, health: 84, demand: "Critical" },
    { from: "Egypt", to: "GCC", flow: 68, health: 96, demand: "Stable" },
  ];

  return (
    <section className="py-24 bg-[#050505] relative border-y border-white/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Migration Corridor Intelligence</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Interactive Africa ↔ GCC talent export visualization powered by real-time labor mobility metrics.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 aspect-[16/9] bg-white/5 rounded-[2.5rem] border border-white/10 relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 opacity-20 pointer-events-none">
                <Globe className="h-full w-full p-20" />
             </div>
             <div className="relative text-center">
                <div className="text-blue-500 font-black text-4xl mb-4 animate-pulse">Africa ↔ GCC</div>
                <div className="text-gray-400 text-sm font-bold uppercase tracking-[0.2em]">Live Intelligence Sync</div>
             </div>
             
             {/* Animated Lines Placeholder */}
             <div className="absolute inset-0">
                {corridors.map((c, i) => (
                  <motion.div
                    key={i}
                    animate={{ x: [0, 100, 0], opacity: [0, 0.5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                    className="absolute h-px w-32 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                    style={{ top: `${20 + i * 20}%`, left: `${10 + i * 15}%`, transform: `rotate(${i * 15}deg)` }}
                  />
                ))}
             </div>
          </div>

          <div className="space-y-4">
            {corridors.map((c, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-bold text-white">{c.from} ↔ {c.to}</div>
                  <div className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    c.demand === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>{c.demand} Demand</div>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-2xl font-black text-white">{c.flow}%</div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase">Flow Velocity</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-400">{c.health}</div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase">Health Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustGovernanceSection() {
  const systems = [
    { label: "Explainable AI", icon: BrainCircuit },
    { label: "Override Controls", icon: Zap },
    { label: "Audit Logging", icon: Activity },
    { label: "Bias Detection", icon: ShieldAlert },
  ];

  return (
    <section className="py-24 bg-[#050505]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8">Enterprise Trust & Governance</h2>
            <p className="text-gray-400 text-lg mb-10">
              Our governance layer ensures every AI decision is explainable, auditable, and subject to human oversight.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {systems.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-white font-bold">
                  <s.icon className="h-5 w-5 text-blue-500" />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-6">
            {[
              "Verified Employer", 
              "GCC Sponsorship Verified", 
              "Enterprise Verified", 
              "Trusted Workforce Partner"
            ].map((badge, i) => (
              <div key={i} className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-all">
                <BadgeCheck className="h-12 w-12 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-black text-white tracking-tight">{badge}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashboardPreviewSection() {
  const tabs = ["Labor Intel", "Migration", "Forecasting", "Predictive AI", "Graph", "Orchestration"];
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Workforce Command Center</h2>
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === i 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden p-2 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
          <div className="bg-[#0a0a0a] rounded-[2.6rem] p-12 min-h-[400px]">
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.3 }}
                 className="grid md:grid-cols-3 gap-8"
               >
                 <div className="md:col-span-2">
                    <h3 className="text-3xl font-black text-white mb-4">{tabs[activeTab]} Intelligence</h3>
                    <p className="text-gray-400 text-lg mb-8">
                      Autonomous {tabs[activeTab].toLowerCase()} monitoring with real-time signal streaming and predictive simulation.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                          <div className="text-[10px] font-bold text-gray-600 uppercase mb-2">Real-Time Metric</div>
                          <div className="text-3xl font-black text-white">88.4</div>
                       </div>
                       <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                          <div className="text-[10px] font-bold text-gray-600 uppercase mb-2">AI Confidence</div>
                          <div className="text-3xl font-black text-emerald-400">99.2%</div>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                       <div className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          Live Signals
                       </div>
                       <div className="space-y-3">
                          {[1,2,3].map(i => (
                            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                               <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                               <div className="text-[10px] text-gray-500 font-medium">Signal {i} Detected</div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
               </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PublicIntelligenceFeedSection() {
  const alerts = [
    { type: "Shortage Alert", message: "Predicted 12% telecom engineer shortage in Qatar corridor.", urgency: "High" },
    { type: "Trend Detected", message: "Emerging skill: 'AI-Enhanced Construction Management' in UAE.", urgency: "Medium" },
    { type: "Migration Forecast", message: "Anticipated 5.2% volume increase in Nigeria ↔ Saudi corridor.", urgency: "Low" },
    { type: "Workforce Risk", message: "Regional instability detected in Northern Kenya corridor.", urgency: "Critical" },
  ];

  return (
    <section className="py-24 bg-[#050505]">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Public Workforce Feed</h2>
          <p className="text-gray-400 text-lg">
            Live ecosystem intelligence streaming from our labor mobility engines.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {alerts.map((a, i) => (
            <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 relative group">
              <div className={`absolute top-0 right-0 p-4 opacity-20`}>
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div className={`text-[10px] font-black uppercase tracking-widest mb-4 ${
                a.urgency === 'Critical' ? 'text-rose-500' : 
                a.urgency === 'High' ? 'text-amber-500' : 'text-blue-500'
              }`}>{a.type}</div>
              <p className="text-sm font-bold text-white mb-6 leading-relaxed">{a.message}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase">
                <span className="h-1 w-1 rounded-full bg-gray-600" />
                Detected 4m ago
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTASection() {
  return (
    <section className="py-32 bg-[#050505] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(60,80,255,0.1),transparent_50%)]" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-5xl md:text-7xl font-black text-white mb-8">Build Your Workforce Intelligence Pipeline</h2>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-12">
          Transform your recruitment from a reactive marketplace into a predictive, autonomous intelligence infrastructure.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" className="rounded-full bg-white text-black hover:bg-white/90 px-10 h-16 font-bold text-lg group">
            Create Employer Account
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 px-10 h-16 font-bold text-lg">
            Launch Enterprise Workspace
          </Button>
          <Button variant="ghost" size="lg" className="rounded-full text-blue-400 hover:text-blue-300 hover:bg-blue-400/5 px-10 h-16 font-bold text-lg">
            Talk to Intelligence Team
          </Button>
        </div>
      </div>
    </section>
  );
}

export function AICopilotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50">
       <button 
         onClick={() => setOpen(!open)}
         className="h-16 w-16 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/40 flex items-center justify-center hover:scale-110 transition-all active:scale-95 group"
       >
          <MessageSquare className="h-7 w-7 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-[#050505] rounded-full animate-pulse" />
       </button>

       <AnimatePresence>
         {open && (
           <motion.div
             initial={{ opacity: 0, y: 20, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.95 }}
             className="absolute bottom-20 right-0 w-[400px] rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden backdrop-blur-3xl"
           >
              <div className="p-8 border-b border-white/5 bg-gradient-to-br from-blue-600/20 to-transparent">
                 <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-6 w-6 text-blue-400" />
                    <span className="text-lg font-black text-white tracking-tight">Employer Copilot</span>
                 </div>
                 <p className="text-gray-400 text-sm">Ask about sourcing, forecasting, or migration intelligence.</p>
              </div>
              <div className="p-8 h-[300px] overflow-y-auto space-y-4">
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-gray-300">
                    Hello! I'm your AI Workforce Copilot. How can I assist your enterprise today?
                 </div>
                 <div className="grid grid-cols-1 gap-2">
                    {[
                      "Need telecom engineers in Qatar?",
                      "Forecast migration volume UAE ↔ Kenya",
                      "Check sponsorship bottleneck risks"
                    ].map(q => (
                      <button key={q} className="text-left p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 hover:bg-blue-500/20 transition-all">
                        {q}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="p-6 border-t border-white/5">
                 <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Type your query..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                    <Button size="icon" className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700">
                       <ArrowRight className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}
