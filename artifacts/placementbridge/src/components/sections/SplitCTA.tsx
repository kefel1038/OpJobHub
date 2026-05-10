import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Building2, User } from "lucide-react";

export function SplitCTA() {
  return (
    <section className="py-24 overflow-hidden bg-default">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-600/10 to-purple-600/5 p-12 rounded-[2rem] relative overflow-hidden group border border-[#2C2C2E]"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-400" />
                </div>
              </div>
              <span className="text-blue-400 font-semibold text-sm tracking-wider mb-4 block uppercase">For Companies</span>
              <h2 className="text-4xl md:text-5xl font-heading font-black text-white mb-8">Hire Smarter</h2>

              <ul className="space-y-4 mb-10">
                {[
                  "Pre-qualified candidates",
                  "Automated unbiased headhunting",
                  "Increased diversity",
                  "Simple ATS integration"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-300 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-full px-8 h-12 shadow-lg shadow-blue-600/20">
                <Link href="/post-job">Learn more</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-600/10 to-blue-600/5 p-12 rounded-[2rem] relative overflow-hidden group border border-[#2C2C2E]"
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <span className="text-purple-400 font-semibold text-sm tracking-wider mb-4 block uppercase">For Job Seekers</span>
              <h2 className="text-4xl md:text-5xl font-heading font-black text-white mb-8">Find Your Future</h2>

              <ul className="space-y-4 mb-10">
                {[
                  "Fair hires with companies that care",
                  "Feedback on the application process",
                  "Automated process and tracking",
                  "Connect thousands of companies instantly"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-300 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-full px-8 h-12 shadow-lg shadow-purple-600/20">
                <Link href="/ai-matching">Learn more</Link>
              </Button>
            </div>

            <div className="absolute bottom-8 right-8 flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-[#2C2C2E] bg-surface overflow-hidden shadow-sm">
                  <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
