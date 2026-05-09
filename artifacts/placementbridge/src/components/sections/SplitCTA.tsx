import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

export function SplitCTA() {
  return (
    <section className="bg-white py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Companies Side */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-black text-white p-12 rounded-[3rem] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFBF00]/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <span className="text-[#FFBF00] font-black uppercase text-sm tracking-widest mb-4 block">FOR</span>
              <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8">Companies</h2>
              
              <ul className="space-y-4 mb-10">
                {[
                  "Pre-qualified candidates",
                  "Automated unbiased headhunting",
                  "Increased diversity",
                  "Simple ATS integration"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-bold text-white/80">
                    <CheckCircle2 className="h-5 w-5 text-[#FFBF00]" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <Button asChild className="bg-white text-black hover:bg-zinc-100 font-black rounded-full px-8 h-12">
                <Link href="/post-job">Learn more</Link>
              </Button>
            </div>
            
            {/* Silhouette Decor */}
            <div className="absolute bottom-0 right-0 h-24 w-48 city-silhouette opacity-20 pointer-events-none" />
          </motion.div>

          {/* Jobseekers Side */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-[#FFBF00] text-black p-12 rounded-[3rem] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full blur-3xl" />
            <div className="relative z-10">
              <span className="text-black/60 font-black uppercase text-sm tracking-widest mb-4 block">FOR</span>
              <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8">Jobseekers</h2>
              
              <ul className="space-y-4 mb-10">
                {[
                  "Fair hires with companies that care",
                  "Feedback on the application process",
                  "Automated process and tracking",
                  "Connect thousands of companies instantly"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-bold">
                    <CheckCircle2 className="h-5 w-5 text-black" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <Button asChild className="bg-black text-[#FFBF00] hover:bg-zinc-900 font-black rounded-full px-8 h-12">
                <Link href="/ai-matching">Learn more</Link>
              </Button>
            </div>
            
            {/* Avatar Cluster Graphic */}
            <div className="absolute bottom-8 right-8 flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-[#FFBF00] bg-white overflow-hidden shadow-sm">
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
