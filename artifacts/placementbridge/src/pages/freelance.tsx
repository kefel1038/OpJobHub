import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase, Users, Globe, Sparkles, ShieldCheck, Zap, Star,
  ArrowRight, CheckCircle2, Clock, DollarSign, MessageSquare,
  Search, FileText, Monitor, Smartphone, Grid3X3,
  Code, Palette, Pen, TrendingUp, Database, HeadphonesIcon,
  Building2, HardHat, Calculator, ChevronRight, Layers,
  PlayCircle, Lightbulb, Network, Lock, BookOpen
} from "lucide-react";

function AnimatedCounter({ value, label, suffix = "", prefix = "" }: { value: number; label: string; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black text-gradient-electric mb-1">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-gray-500 dark:text-blue-200/60 font-medium">{label}</div>
    </div>
  );
}

function FadeIn({ children, delay = 0, direction = "up" }: { children: React.ReactNode; delay?: number; direction?: "up" | "left" | "right" }) {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 30 : 0,
      x: direction === "left" ? -30 : direction === "right" ? 30 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={variants}>
      {children}
    </motion.div>
  );
}

export default function Freelance() {
  return (
    <Layout>
      <HeroSection />
      <StatsSection />
      <HowItWorksFreelancerSection />
      <HowItWorksEmployerSection />
      <CategoriesSection />
      <FeaturedGigsSection />
      <BenefitsSection />
      <TestimonialsSection />
      <CTASection />
    </Layout>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] hero-gradient-employer overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-[0.03] pointer-events-none" />
      <div className="absolute top-40 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="absolute bottom-40 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4 relative z-10 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8"
            >
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-amber-300 font-medium">Africa's #1 Freelance Marketplace</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-heading font-black leading-[0.95] mb-6">
              <span className="text-white">Hire Top African</span>
              <br />
              <span className="text-gradient-electric">Freelance Talent</span>
              <br />
              <span className="text-white/80">For Global Projects</span>
            </h1>

            <p className="text-lg md:text-xl text-blue-200/70 max-w-xl mb-10 leading-relaxed">
              Connect with vetted freelancers across Africa for remote work, 
              contract projects, and gig-based roles. AI-matched, verified, and ready to deliver.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12">
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 rounded-full px-10 h-14 text-base font-bold shadow-lg shadow-blue-600/25 group">
                <Link href="/jobs?employmentType=Freelance">
                  Find Freelance Work
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-blue-400/30 text-blue-300 hover:bg-blue-500/10 rounded-full px-10 h-14 text-base font-bold">
                <Link href="/post-job">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Post a Gig
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-blue-900/50 overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="font-bold text-white">12,000+</div>
                <div className="text-blue-300/60">Freelancers available</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-sm">
                <div className="font-bold text-white">8,500+</div>
                <div className="text-blue-300/60">Projects completed</div>
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
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    Live Marketplace
                  </Badge>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { title: "Full-Stack Developer", freelancer: "Amara O.", rate: "$45/hr", location: "Lagos, Nigeria", match: 98, tag: "Development" },
                    { title: "UI/UX Designer", freelancer: "Fatima M.", rate: "$35/hr", location: "Nairobi, Kenya", match: 95, tag: "Design" },
                    { title: "Content Strategist", freelancer: "Kwame A.", rate: "$30/hr", location: "Accra, Ghana", match: 92, tag: "Writing" },
                    { title: "Digital Marketing Specialist", freelancer: "Zara H.", rate: "$40/hr", location: "Cairo, Egypt", match: 90, tag: "Marketing" },
                  ].map((gig, i) => (
                    <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-white font-semibold text-sm">{gig.title}</div>
                          <div className="text-blue-300/60 text-xs mt-0.5">{gig.freelancer} · {gig.location}</div>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">{gig.tag}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-amber-400 font-bold text-sm">{gig.rate}</span>
                        <span className="text-emerald-400 text-xs font-medium">{gig.match}% Match</span>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <span className="text-blue-300/50 text-xs">AI-powered matching · Verified freelancers · Escrow payments</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
    </section>
  );
}

function StatsSection() {
  return (
    <section className="py-20 bg-white dark:bg-[#070B2E] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <FadeIn><AnimatedCounter value={12000} label="Active Freelancers" suffix="+" /></FadeIn>
          <FadeIn delay={0.1}><AnimatedCounter value={8500} label="Projects Completed" suffix="+" /></FadeIn>
          <FadeIn delay={0.2}><AnimatedCounter value={3500} label="Happy Employers" suffix="+" /></FadeIn>
          <FadeIn delay={0.3}><AnimatedCounter value={98} label="Satisfaction Rate" suffix="%" /></FadeIn>
        </div>
      </div>
    </section>
  );
}

function HowItWorksFreelancerSection() {
  const steps = [
    { icon: UserCheck, title: "Create Profile", description: "Sign up, showcase your skills, portfolio, and experience. Our AI helps optimize your profile for better matches." },
    { icon: Search, title: "Find Gigs", description: "Browse AI-matched freelance opportunities across 20+ categories. Get personalized project recommendations." },
    { icon: MessageSquare, title: "Connect & Bid", description: "Chat directly with employers, submit proposals, and negotiate terms — all within the platform." },
    { icon: DollarSign, title: "Get Paid Securely", description: "Escrow payment protection ensures you get paid on time. Milestone-based releases for peace of mind." },
  ];

  return (
    <section className="py-24 employer-gradient-light dark:bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm tracking-widest uppercase mb-4 block">For Freelancers</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4 dark:text-white">
              How It{" "}
              <span className="text-gradient-blue">Works</span>
            </h2>
            <p className="text-gray-500 dark:text-blue-200/60 max-w-2xl mx-auto text-lg">
              Start finding remote freelance opportunities from global employers in minutes.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <FadeIn key={step.title} delay={0.1 * i}>
              <div className="relative">
                <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-gray-100 dark:border-white/10 card-hover h-full">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-5">
                    <step.icon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Step {i + 1}</div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-blue-200/60 leading-relaxed">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 text-blue-300 dark:text-blue-500/30">
                    <ChevronRight className="h-6 w-6" />
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <div className="text-center mt-12">
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full px-10 h-12 font-bold shadow-lg shadow-blue-600/25">
              <Link href="/register">
                Start Freelancing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function HowItWorksEmployerSection() {
  const steps = [
    { icon: FileText, title: "Post a Gig", description: "Describe your project, set your budget, and choose from fixed-price or hourly contracts. AI suggests optimal pricing." },
    { icon: Users, title: "Review Proposals", description: "Receive AI-ranked proposals from vetted freelancers. Review portfolios, ratings, and past work instantly." },
    { icon: MessageSquare, title: "Interview & Hire", description: "Use built-in messaging and video calls to interview candidates. Hire with one click." },
    { icon: ShieldCheck, title: "Manage & Pay", description: "Track milestones, communicate in real-time, and release payments securely through our escrow system." },
  ];

  return (
    <section className="py-24 bg-white dark:bg-[#070B2E] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm tracking-widest uppercase mb-4 block">For Employers</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4 dark:text-white">
              How to{" "}
              <span className="text-gradient-blue">Hire Freelancers</span>
            </h2>
            <p className="text-gray-500 dark:text-blue-200/60 max-w-2xl mx-auto text-lg">
              Access Africa's top freelance talent for your projects — fast, secure, and AI-powered.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <FadeIn key={step.title} delay={0.1 * i}>
              <div className="relative">
                <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-gray-100 dark:border-white/10 card-hover h-full">
                  <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-5">
                    <step.icon className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-2">Step {i + 1}</div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-blue-200/60 leading-relaxed">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 text-amber-300 dark:text-amber-500/30">
                    <ChevronRight className="h-6 w-6" />
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <div className="text-center mt-12">
            <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full px-10 h-12 font-bold shadow-lg shadow-amber-500/25">
              <Link href="/post-job">
                Post a Gig Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function CategoriesSection() {
  const categories = [
    { icon: Code, title: "Development", desc: "Web, mobile, backend & full-stack", gigs: "2,450+" },
    { icon: Palette, title: "Design & Creative", desc: "UI/UX, graphic design, animation", gigs: "1,800+" },
    { icon: Pen, title: "Content Writing", desc: "Copywriting, technical writing, translation", gigs: "1,200+" },
    { icon: TrendingUp, title: "Marketing & Sales", desc: "Digital marketing, SEO, social media", gigs: "980+" },
    { icon: Database, title: "Data Entry & Admin", desc: "Virtual assistance, data processing", gigs: "1,500+" },
    { icon: HeadphonesIcon, title: "Customer Support", desc: "Support, QA, success management", gigs: "760+" },
    { icon: HardHat, title: "Engineering", desc: "Civil, mechanical, electrical", gigs: "620+" },
    { icon: Calculator, title: "Finance & Accounting", desc: "Bookkeeping, auditing, consulting", gigs: "540+" },
  ];

  return (
    <section className="py-24 employer-gradient-light dark:bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm tracking-widest uppercase mb-4 block">Categories</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4 dark:text-white">
              Explore{" "}
              <span className="text-gradient-blue">Freelance Categories</span>
            </h2>
            <p className="text-gray-500 dark:text-blue-200/60 max-w-2xl mx-auto text-lg">
              Find expert freelancers across 20+ categories, all vetted and ready to work.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <FadeIn key={cat.title} delay={0.05 * i}>
              <Link href={`/jobs?employmentType=Freelance&industry=${cat.title}`}>
                <Card className="border-gray-100 dark:border-white/10 card-hover cursor-pointer bg-white dark:bg-white/5 h-full">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
                      <cat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-white mb-1">{cat.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-blue-200/60 mb-3">{cat.desc}</p>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{cat.gigs} gigs</span>
                  </CardContent>
                </Card>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedGigsSection() {
  const gigs = [
    { title: "React Native Developer", budget: "$2,000 - $4,000", duration: "2-3 months", skills: ["React Native", "TypeScript", "Firebase"], flag: "High Demand" },
    { title: "Social Media Manager", budget: "$800 - $1,500/mo", duration: "Ongoing", skills: ["Instagram", "TikTok", "Content Strategy"], flag: "Remote" },
    { title: "Technical Writer", budget: "$500 - $2,000", duration: "1-2 months", skills: ["Technical Writing", "API Docs", "Markdown"], flag: "Urgent" },
    { title: "AI/ML Consultant", budget: "$100 - $200/hr", duration: "2 weeks", skills: ["Python", "TensorFlow", "NLP"], flag: "Premium" },
    { title: "Graphic Designer", budget: "$300 - $1,000", duration: "3 weeks", skills: ["Figma", "Photoshop", "Branding"], flag: "Remote" },
    { title: "Full-Stack Developer", budget: "$3,000 - $6,000", duration: "3-4 months", skills: ["Next.js", "Node.js", "PostgreSQL"], flag: "High Demand" },
  ];

  return (
    <section className="py-24 bg-white dark:bg-[#070B2E] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-end justify-between mb-12">
          <FadeIn>
            <div>
              <span className="text-blue-600 dark:text-blue-400 font-bold text-sm tracking-widest uppercase mb-4 block">Featured Gigs</span>
              <h2 className="text-4xl md:text-5xl font-heading font-black dark:text-white">
                Trending{" "}
                <span className="text-gradient-blue">Opportunities</span>
              </h2>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <Button variant="outline" asChild className="hidden sm:flex rounded-full border-blue-400/30 text-blue-600 dark:text-blue-400">
              <Link href="/jobs?employmentType=Freelance">
                View All Gigs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </FadeIn>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig, i) => (
            <FadeIn key={gig.title} delay={0.05 * i}>
              <Card className="border-gray-100 dark:border-white/10 card-hover bg-white dark:bg-white/5 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-gray-800 dark:text-white">{gig.title}</h3>
                    <Badge className={
                      gig.flag === "High Demand" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      gig.flag === "Urgent" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      gig.flag === "Premium" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                      "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    }>
                      {gig.flag}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                      <DollarSign className="h-4 w-4" />
                      {gig.budget}
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-blue-200/60">
                      <Clock className="h-4 w-4" />
                      {gig.duration}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gig.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-blue-200/70">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <div className="text-center mt-10 sm:hidden">
            <Button variant="outline" asChild className="rounded-full border-blue-400/30 text-blue-600 dark:text-blue-400">
              <Link href="/jobs?employmentType=Freelance">
                View All Gigs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const freelancerBenefits = [
    { icon: Globe, title: "Work Globally", desc: "Access projects from employers across the Gulf, Europe, and North America." },
    { icon: ShieldCheck, title: "Secure Payments", desc: "Escrow-protected milestone payments ensure you never miss a paycheck." },
    { icon: Zap, title: "AI Matching", desc: "Get matched to projects that fit your skills, experience, and rate preferences." },
    { icon: Smartphone, title: "Mobile First", desc: "Manage your freelance business entirely from your phone via WhatsApp integration." },
  ];

  const employerBenefits = [
    { icon: Users, title: "Vetted Talent Pool", desc: "Every freelancer is verified — skills, identity, and work history checked." },
    { icon: DollarSign, title: "Cost Effective", desc: "Save 40-60% compared to local hiring. Pay for results, not hours." },
    { icon: Clock, title: "Fast Onboarding", desc: "Post a gig and receive AI-matched proposals within 24 hours." },
    { icon: Lock, title: "IP Protection", desc: "NDA agreements, secure contracts, and intellectual property protection built in." },
  ];

  return (
    <section className="py-24 employer-gradient-light dark:bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm tracking-widest uppercase mb-4 block">Why Choose KeFeL</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4 dark:text-white">
              Built for{" "}
              <span className="text-gradient-blue">Both Sides</span>
            </h2>
            <p className="text-gray-500 dark:text-blue-200/60 max-w-2xl mx-auto text-lg">
              A platform designed to serve freelancers and employers equally.
            </p>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-12">
          <FadeIn direction="left">
            <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold dark:text-white">For Freelancers</h3>
              </div>
              <div className="space-y-6">
                {freelancerBenefits.map((b) => (
                  <div key={b.title} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <b.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white mb-1">{b.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-blue-200/60">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="right">
            <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold dark:text-white">For Employers</h3>
              </div>
              <div className="space-y-6">
                {employerBenefits.map((b) => (
                  <div key={b.title} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <b.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white mb-1">{b.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-blue-200/60">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "KeFeL connected me with a Dubai-based startup within a week. The AI matching was spot-on — I got a project that perfectly matches my full-stack skills.",
      name: "Chidi Obi",
      role: "Full-Stack Developer",
      location: "Lagos, Nigeria",
      rating: 5,
    },
    {
      quote: "We needed a graphic designer urgently for our Qatar office launch. Found an amazing talent from Ghana within 24 hours. The escrow payment system made it stress-free.",
      name: "Sarah Al Thani",
      role: "HR Manager",
      location: "Doha, Qatar",
      rating: 5,
    },
    {
      quote: "As a freelance writer, I've tripled my income since joining KeFeL. The clients are serious, payments are on time, and the platform fee is totally worth it.",
      name: "Grace Wanjiku",
      role: "Content Strategist",
      location: "Nairobi, Kenya",
      rating: 5,
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-[#070B2E] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm tracking-widest uppercase mb-4 block">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4 dark:text-white">
              What Our{" "}
              <span className="text-gradient-blue">Community Says</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={0.1 * i}>
              <Card className="border-gray-100 dark:border-white/10 card-hover bg-white dark:bg-white/5 h-full">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-blue-200/80 leading-relaxed mb-8 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 dark:text-white text-sm">{t.name}</div>
                      <div className="text-xs text-gray-500 dark:text-blue-200/60">{t.role} · {t.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800" />
      <div className="absolute inset-0 bg-grid-white opacity-[0.04] pointer-events-none" />
      <div className="absolute top-1/2 -left-32 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 -right-32 w-80 h-80 bg-amber-400/10 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <FadeIn>
          <Badge className="bg-white/10 text-white border-white/20 mb-6 text-sm px-5 py-2 rounded-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Join 12,000+ Freelancers & 3,500+ Employers
          </Badge>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="text-4xl md:text-6xl font-heading font-black text-white mb-6 leading-[1.1] max-w-3xl mx-auto">
            Ready to Build Your{" "}
            <span className="text-gradient-white">Freelance Future?</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-lg md:text-xl text-blue-100/70 max-w-2xl mx-auto mb-10">
            Whether you're a freelancer looking for global opportunities or an employer 
            seeking top African talent — KeFeL connects you with the right people.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="bg-white text-blue-700 hover:bg-blue-50 rounded-full px-10 h-14 text-base font-bold shadow-xl shadow-black/10 group">
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 rounded-full px-10 h-14 text-base font-bold">
              <Link href="/jobs?employmentType=Freelance">
                Browse Gigs
              </Link>
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="flex items-center justify-center gap-8 mt-12 text-blue-200/50 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> No setup fees</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Free to join</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Cancel anytime</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
