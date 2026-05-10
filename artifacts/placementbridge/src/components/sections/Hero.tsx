import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, PlayCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden hero-gradient">
      <div className="absolute inset-0 bg-grid-white opacity-30 pointer-events-none" />
      <div className="absolute top-40 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400 font-medium">AI-Powered Recruitment Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-heading font-black tracking-tight text-white leading-[1.05] mb-6">
              Find your
              <br />
              <span className="text-gradient">dream job</span>
              <br />
              without the hustle
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-lg mb-10 leading-relaxed">
              Today's top candidates care about fairness and equality.
              Discover verified jobs, match your skills instantly, and get hired faster.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-full px-8 h-13 text-base shadow-xl shadow-blue-600/20 group">
                <Link href="/ai-matching">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full h-13 px-6">
                <Link href="/about">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Learn More
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[2rem] blur-2xl" />
              <div className="relative bg-[#141416] rounded-[2rem] border border-[#2C2C2E] p-8 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">AI Match Dashboard</span>
                </div>
                <div className="space-y-4">
                  {[
                    { role: "Senior Developer", match: 94, color: "blue" },
                    { role: "UX Designer", match: 88, color: "purple" },
                    { role: "Project Manager", match: 82, color: "emerald" },
                  ].map((item) => (
                    <div key={item.role} className="flex items-center justify-between bg-[#1C1C1E] rounded-xl p-4 border border-[#2C2C2E]">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          item.color === "blue" ? "bg-blue-500/20 text-blue-400" :
                          item.color === "purple" ? "bg-purple-500/20 text-purple-400" :
                          "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {item.role.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-200">{item.role}</div>
                          <div className="text-xs text-gray-500">AI Match Score</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          item.color === "blue" ? "text-blue-400" :
                          item.color === "purple" ? "text-purple-400" :
                          "text-emerald-400"
                        }`}>
                          {item.match}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-[#2C2C2E]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total Matches Found</span>
                    <span className="text-white font-bold">1,247</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
