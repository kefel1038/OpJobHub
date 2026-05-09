import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, ArrowRight, PlayCircle, Users, Briefcase,
  Globe, ShieldCheck, BarChart3, MessageSquare, CheckCircle2,
  Star, ChevronRight
} from "lucide-react";

const stats = [
  { label: "Active Employers", value: "2,400+", icon: Users },
  { label: "Verified Candidates", value: "50,000+", icon: ShieldCheck },
  { label: "Successful Placements", value: "12,000+", icon: Briefcase },
  { label: "Countries Reached", value: "25+", icon: Globe },
];

const floatingMetrics = [
  { label: "AI Match Rate", value: "94%", color: "text-emerald-400" },
  { label: "Avg. Hire Time", value: "48hrs", color: "text-blue-400" },
  { label: "Candidate Quality", value: "Top 5%", color: "text-amber-400" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen hero-gradient-employer overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-[0.03] pointer-events-none" />

      <div className="absolute top-40 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="absolute bottom-40 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4 relative z-10 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-120px)]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8"
            >
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium">AI-Powered Recruitment Platform</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black leading-[0.95] mb-8">
              <span className="text-white">Hire Verified</span>
              <br />
              <span className="text-gradient-electric">Talent Faster</span>
              <br />
              <span className="text-white/80">Across Africa & The Gulf</span>
            </h1>

            <p className="text-lg md:text-xl text-blue-200/70 max-w-2xl mb-10 leading-relaxed font-medium">
              AI-powered workforce recruitment platform connecting employers with pre-screened,
              verified candidates across East Africa and the Gulf. Reduce hiring time by 70%
              with smart matching, automated screening, and end-to-end deployment support.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12">
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 rounded-full px-10 h-14 text-base font-bold shadow-lg shadow-blue-600/25 group">
                <Link href="/post-job">
                  Post a Job
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-blue-400/30 text-blue-300 hover:bg-blue-500/10 rounded-full px-10 h-14 text-base font-bold">
                <Link href="/jobs?type=candidates">
                  <Users className="mr-2 h-5 w-5" />
                  Browse Candidates
                </Link>
              </Button>
              <Button variant="ghost" asChild className="text-blue-300 hover:text-white hover:bg-white/5 rounded-full px-6 h-14 text-base font-medium gap-2">
                <Link href="/contact">
                  <PlayCircle className="h-5 w-5" />
                  Book Consultation
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-blue-900/50 overflow-hidden">
                    <img
                      src={`https://i.pravatar.cc/100?u=employer_${i}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 text-amber-400 mb-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-blue-300/70 font-medium">
                  Trusted by <span className="text-white font-bold">500+</span> employers
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="hidden lg:block relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-indigo-500/20 rounded-3xl blur-3xl -translate-y-4 translate-x-4" />

              <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/60" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                      <div className="h-3 w-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-xs text-blue-300/50 font-mono">Employer Dashboard</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-3 py-0.5 rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    Live
                  </Badge>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 space-y-5">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    {stats.slice(0, 3).map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="bg-white/5 rounded-2xl p-4 border border-white/5"
                      >
                        <stat.icon className="h-4 w-4 text-blue-400 mb-2" />
                        <div className="text-2xl font-black text-white">{stat.value}</div>
                        <div className="text-xs text-blue-300/50 mt-0.5">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* AI Matching Visualization */}
                  <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-2xl p-5 border border-blue-500/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-semibold text-white">AI Smart Matching</span>
                      </div>
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { role: "Construction Manager", match: 96, candidates: 12 },
                        { role: "Security Personnel", match: 92, candidates: 28 },
                        { role: "Software Engineer", match: 88, candidates: 8 },
                      ].map((item, i) => (
                        <motion.div
                          key={item.role}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + i * 0.1 }}
                          className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-blue-400" />
                            <span className="text-sm text-blue-200">{item.role}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-blue-300/60">{item.candidates} candidates</span>
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                                  style={{ width: `${item.match}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-emerald-400">{item.match}%</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Hiring Pipeline */}
                  <div className="grid grid-cols-6 gap-2">
                    {["Applied", "Reviewed", "Shortlisted", "Interviewed", "Hired", "Deployed"].map((stage, i) => (
                      <motion.div
                        key={stage}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 + i * 0.05 }}
                        className="text-center"
                      >
                        <div className={`h-1.5 rounded-full mb-1.5 ${i <= 2 ? "bg-blue-500" : i <= 4 ? "bg-amber-500" : "bg-emerald-500"}`} />
                        <div className="text-[10px] text-blue-300/50 font-medium truncate">{stage}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Metric Badges */}
              {floatingMetrics.map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5 + i * 0.2, type: "spring" }}
                  className={`absolute -${i % 2 === 0 ? "right" : "left"}-${(i + 1) * 4} top-${60 + i * 20} bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/10 shadow-xl`}
                  style={{
                    right: i % 2 === 0 ? `${-20 + i * 10}px` : undefined,
                    left: i % 2 !== 0 ? `${-20 + (i - 1) * 10}px` : undefined,
                    top: `${10 + i * 25}%`,
                  }}
                >
                  <div className={`text-lg font-black ${metric.color}`}>{metric.value}</div>
                  <div className="text-[10px] text-blue-300/60 font-medium whitespace-nowrap">{metric.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-sm text-blue-300/50 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
    </section>
  );
}
