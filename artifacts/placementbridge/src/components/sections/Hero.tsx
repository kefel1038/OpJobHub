import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-mesh min-h-[90vh] flex items-center">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] -z-10 animate-pulse delay-1000" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-semibold gap-1.5 bg-background/50 backdrop-blur-md border-border/50 text-foreground">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Now powered by AI Career Intelligence
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-heading font-extrabold tracking-tight text-foreground leading-[1.05] mb-8">
              The Future of <span className="text-gradient">Hiring</span> <br /> 
              is Semantic.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Skip the keyword matching. Our AI understands your skills, experience, and potential 
              to match you with high-growth roles in the Gulf and globally.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button asChild size="lg" className="rounded-full px-8 h-14 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 group">
                <Link href="/ai-matching">
                  Get Matched Now
                  <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-14 text-base font-semibold glass border-border/50 hover:bg-background/80 transition-all">
                <Link href="/jobs">Explore All Jobs</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto"
          >
            <HeroStat icon={<Zap className="h-5 w-5 text-amber-500" />} label="Instant Match" />
            <HeroStat icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />} label="Verified Roles" />
            <HeroStat icon={<CheckCircle2 className="h-5 w-5 text-blue-500" />} label="ATS Optimized" />
            <HeroStat icon={<Sparkles className="h-5 w-5 text-primary" />} label="AI Guidance" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-3xl glass border-border/20">
      <div className="h-10 w-10 rounded-2xl bg-background/50 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-bold text-foreground/70 uppercase tracking-widest">{label}</span>
    </div>
  );
}
