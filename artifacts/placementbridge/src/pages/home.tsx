import { Layout } from "@/components/layout/Layout";
import { Hero } from "@/components/sections/Hero";
import { FeaturedJobs } from "@/components/sections/FeaturedJobs";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  FileText, 
  BrainCircuit, 
  Target, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  LayoutDashboard,
  ShieldCheck,
  Globe
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <Layout>
      <Hero />

      {/* AI Intelligence Strip */}
      <section className="py-20 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileText className="h-6 w-6 text-primary" />}
              title="Semantic Resume Scan"
              description="Our AI doesn't just read words; it understands your professional narrative and career trajectory."
            />
            <FeatureCard 
              icon={<BrainCircuit className="h-6 w-6 text-accent" />}
              title="Smart Match Engine"
              description="Get matched with roles based on your actual potential, skills, and market demand."
            />
            <FeatureCard 
              icon={<Target className="h-6 w-6 text-violet-500" />}
              title="ATS Optimization"
              description="Score your resume against real-world recruiter standards and get instant improvements."
            />
          </div>
        </div>
      </section>

      <FeaturedJobs />

      {/* AI Preview Section */}
      <section className="py-24 bg-foreground text-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <Badge className="bg-primary text-primary-foreground border-0">AI Assistant</Badge>
              <h2 className="text-4xl md:text-6xl font-heading font-bold leading-tight">
                Your Personal <br />
                <span className="text-primary">Career Agent.</span>
              </h2>
              <p className="text-xl text-background/70 leading-relaxed max-w-lg">
                Stop applying blindly. Use our AI tools to optimize your profile, 
                generate custom cover letters, and track your market competitiveness in real-time.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span>Real-time ATS Scoring & Feedback</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span>Semantic Skill Gap Analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span>Gulf Market Demand Insights</span>
                </li>
              </ul>

              <div className="pt-6">
                <Button asChild size="lg" className="rounded-full px-8 bg-background text-foreground hover:bg-background/90 group">
                  <Link href="/ai-matching">
                    Try AI Matching Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 p-8 glass-dark relative">
                {/* Mock UI Elements */}
                <div className="absolute top-10 left-10 right-10 bg-background/5 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
                   <div className="flex items-center justify-between mb-4">
                      <div className="h-2 w-24 bg-white/20 rounded-full" />
                      <div className="h-6 w-12 bg-primary/40 rounded-full" />
                   </div>
                   <div className="space-y-3">
                      <div className="h-2 w-full bg-white/10 rounded-full" />
                      <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                   </div>
                </div>
                
                <div className="absolute bottom-10 left-10 bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-xl animate-bounce duration-[3000ms]">
                   <Zap className="h-6 w-6 text-emerald-500 mb-2" />
                   <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">ATS Score</div>
                   <div className="text-2xl font-bold text-white">92%</div>
                </div>

                <div className="absolute bottom-20 right-10 bg-primary/10 border border-primary/20 p-6 rounded-2xl backdrop-blur-xl animate-pulse">
                   <LayoutDashboard className="h-6 w-6 text-primary mb-2" />
                   <div className="text-xs font-bold text-primary uppercase tracking-widest">Market Demand</div>
                   <div className="text-2xl font-bold text-white">Very High</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Stats Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Trusted by over <span className="text-primary">66,000+</span> Companies</h2>
            <p className="text-muted-foreground">From startups to Fortune 500s, we help organizations find the talent they need to grow.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             <StatCard value="120K+" label="Active Candidates" icon={<Users className="h-5 w-5" />} />
             <StatCard value="4.9/5" label="User Satisfaction" icon={<ShieldCheck className="h-5 w-5" />} />
             <StatCard value="15M+" label="Matches Made" icon={<Sparkles className="h-5 w-5" />} />
             <StatCard value="30+" label="Countries Covered" icon={<Globe className="h-5 w-5" />} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="rounded-[3rem] bg-primary p-12 md:p-20 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-mesh opacity-20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-foreground mb-6">Ready to find your <br /> next success story?</h2>
              <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
                Join thousands of others who are transforming their careers through data-driven recruitment.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" variant="secondary" className="rounded-full px-10 h-14 font-bold shadow-xl">
                  <Link href="/register">Get Started Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-10 h-14 font-bold border-white/20 text-white hover:bg-white/10">
                  <Link href="/post-job">I'm an Employer</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-background shadow-lg shadow-black/5 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-muted-foreground leading-relaxed text-sm">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center text-primary/40 mb-2">
        {icon}
      </div>
      <div className="text-4xl font-heading font-extrabold">{value}</div>
      <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
    </div>
  );
}
