import { motion } from "framer-motion";
import {
  Globe, Plane, FileCheck, HeartPulse, ShieldCheck,
  Building2, MapPin, ArrowRight, CheckCircle2, Clock,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const routes = [
  { from: "Uganda", to: "Qatar", flag: "🇺🇬", toFlag: "🇶🇦", active: true },
  { from: "Uganda", to: "UAE", flag: "🇺🇬", toFlag: "🇦🇪", active: true },
  { from: "Kenya", to: "Saudi Arabia", flag: "🇰🇪", toFlag: "🇸🇦", active: true },
  { from: "Tanzania", to: "Oman", flag: "🇹🇿", toFlag: "🇴🇲", active: true },
  { from: "Ethiopia", to: "Kuwait", flag: "🇪🇹", toFlag: "🇰🇼", active: false },
  { from: "Rwanda", to: "Bahrain", flag: "🇷🇼", toFlag: "🇧🇭", active: false },
];

const workflowSteps = [
  { icon: FileCheck, title: "Passport Verification", description: "International passport authentication" },
  { icon: ShieldCheck, title: "Visa Processing", description: "Work visa application & approval" },
  { icon: HeartPulse, title: "Medical Clearance", description: "Gulf-standard medical examination" },
  { icon: GraduationCap, title: "Skill Assessment", description: "Trade test & certification verification" },
  { icon: Building2, title: "Contract Signing", description: "Employment contract finalization" },
  { icon: Plane, title: "Deployment", description: "Travel & relocation coordination" },
];

export function InternationalSection() {
  return (
    <section className="py-24 employer-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-[0.02] pointer-events-none" />
      <div className="absolute top-20 left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full px-5 py-1.5 text-sm mb-6 inline-flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Africa-to-Gulf Recruitment
          </Badge>
          <h2 className="text-4xl md:text-5xl font-heading font-black text-white mb-4">
            International workforce{" "}
            <span className="text-gradient-electric">deployment</span>
          </h2>
          <p className="text-blue-200/60 max-w-3xl mx-auto text-lg">
            End-to-end recruitment and deployment from East Africa to Gulf countries.
            We handle the paperwork, you get the talent.
          </p>
        </motion.div>

        {/* Country Routes */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
          {routes.map((route, i) => (
            <motion.div
              key={`${route.from}-${route.to}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white/5 backdrop-blur-sm rounded-2xl p-5 border ${
                route.active ? "border-blue-500/20 hover:border-blue-400/40" : "border-white/5 opacity-50"
              } transition-all duration-300 card-hover-navy`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{route.flag}</span>
                  <span className="text-white font-bold">{route.from}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-400" />
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{route.to}</span>
                  <span className="text-2xl">{route.toFlag}</span>
                </div>
              </div>
              {route.active ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 rounded-full text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Active Route
                </Badge>
              ) : (
                <Badge className="bg-white/5 text-blue-300/30 border-white/10 rounded-full text-xs">
                  Coming Soon
                </Badge>
              )}
            </motion.div>
          ))}
        </div>

        {/* Deployment Workflow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-white/5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-400" />
              Worker Deployment Workflow
            </h3>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-0 p-6">
            {workflowSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative text-center group"
              >
                {i < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
                )}
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <step.icon className="h-7 w-7 text-blue-400" />
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{step.title}</h4>
                <p className="text-blue-300/50 text-xs">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto"
        >
          {[
            { label: "Workers Deployed", value: "8,500+" },
            { label: "Visa Success Rate", value: "98%" },
            { label: "Avg. Processing Time", value: "21 Days" },
            { label: "Partner Agencies", value: "40+" },
          ].map((stat) => (
            <div key={stat.label} className="text-center bg-white/5 rounded-2xl p-5 border border-white/5">
              <div className="text-3xl font-black text-gradient-electric">{stat.value}</div>
              <div className="text-sm text-blue-300/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 rounded-full px-10 h-12 font-bold shadow-lg shadow-blue-600/25 group">
            <Link href="/contact">
              Start International Hiring
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
