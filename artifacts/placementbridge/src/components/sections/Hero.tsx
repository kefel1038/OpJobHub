import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, PlayCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-[#FFBF00]">
      {/* Background Graphics */}
      <div className="absolute bottom-0 left-0 right-0 h-40 city-silhouette opacity-30 pointer-events-none" />
      
      {/* Floating Clouds */}
      <motion.div 
        animate={{ x: [0, 20, 0] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-20 right-[15%] h-12 w-24 bg-white rounded-full opacity-40 blur-sm pointer-events-none" 
      />
      <motion.div 
        animate={{ x: [0, -30, 0] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-40 left-[10%] h-10 w-20 bg-white rounded-full opacity-30 blur-sm pointer-events-none" 
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-6xl md:text-8xl font-heading font-[900] tracking-tighter text-black leading-[0.9] mb-8 uppercase italic">
              find your <br />
              dream job <br />
              without <br />
              <span className="bg-black text-[#FFBF00] px-4 py-1 mt-2 inline-block transform -rotate-1">
                any hustle
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-black font-bold max-w-lg mb-10 leading-snug">
              Today's top candidates care about fairness and equality. 
              Discover verified jobs, match your skills instantly, and get hired faster.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button asChild className="bg-black text-[#FFBF00] hover:bg-zinc-900 font-black rounded-full px-10 h-14 text-lg shadow-xl group">
                <Link href="/ai-matching">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" className="bg-white border-black text-black hover:bg-zinc-50 font-black rounded-full px-10 h-14 text-lg border-2 shadow-sm gap-2">
                <PlayCircle className="h-6 w-6" />
                How it works?
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-2">
              <div className="flex -space-x-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-12 w-12 rounded-full border-4 border-[#FFBF00] bg-white overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=${i + 20}`} alt="Candidate" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-black text-black uppercase tracking-tight">
                Our platform is <span className="text-white bg-black px-1.5 py-0.5 rounded italic">free</span> for all the job seekers
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="hidden lg:block relative"
          >
            {/* Desktop Mockup Shape */}
            <div className="aspect-[4/3] bg-black rounded-[3rem] p-1 shadow-2xl relative group overflow-hidden border-[6px] border-black">
              <div className="h-full w-full bg-white rounded-[2.8rem] overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80" alt="Modern Office" className="w-full h-full object-cover opacity-80" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                 
                 <div className="absolute bottom-8 left-8 right-8 text-white">
                    <div className="h-2 w-24 bg-[#FFBF00] rounded-full mb-4" />
                    <h3 className="text-3xl font-black uppercase italic leading-none">The Future of Hiring</h3>
                    <p className="text-white/80 font-bold mt-2">Connecting talent with purpose.</p>
                 </div>
              </div>
            </div>

            {/* Floating Element */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-2xl border-2 border-black max-w-[200px]"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-black">Active Match</span>
              </div>
              <p className="text-xs font-bold text-black leading-tight">Software Engineer matched with 4 companies today</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Dotted Line Graphic */}
      <div className="absolute top-1/2 left-0 w-full h-64 dotted-line opacity-10 pointer-events-none -z-10" />
    </section>
  );
}
