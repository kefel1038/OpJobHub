import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Target, Eye, Heart, Search, Briefcase, Users, Globe,
  Sparkles, ShieldCheck, Zap, BarChart3, Bell, Cloud,
  Smartphone, CheckCircle2, ArrowRight, Quote, Star,
  Linkedin, Twitter, Mail, MapPin, ChevronRight,
  Building2, HardHat, UserPlus, TrendingUp, Award,
  Cpu, Network, Lock, Rocket, Lightbulb,
  Layers, BookOpen, Monitor, MessageSquare, Clock,
  FileText, PlayCircle, Calendar, DollarSign, HeadphonesIcon,
  Fingerprint, Bot
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
      transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
    },
  };
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={variants}>
      {children}
    </motion.div>
  );
}

function FloatingCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`absolute ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function About() {
  return (
    <Layout>
      <HeroSection />
      <MissionVisionSection />
      <FounderStorySection />
      <StatisticsSection />
      <HowItWorksSection />
      <WhyChooseSection />
      <TrustSection />
      <SuccessStoriesSection />
      <ForEmployersSection />
      <ForJobSeekersSection />
      <TechnologySection />
      <TeamSection />
      <CTASection />
    </Layout>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen hero-gradient-employer overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-[0.03] pointer-events-none" />
      <div className="absolute top-1/4 -left-48 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[120px] animate-pulse-soft" />
      <div className="absolute bottom-1/3 -right-48 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/3 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 relative z-10 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[85vh]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 rounded-full px-5 py-2 mb-8"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-blue-200 font-medium">Trusted by 20,000+ professionals worldwide</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black leading-[0.9] mb-8">
              <span className="text-white">Connecting</span>
              <br />
              <span className="text-gradient-electric">Talent</span>
              <br />
              <span className="text-white/90">With Opportunity</span>
            </h1>

            <p className="text-lg md:text-xl text-blue-200/60 max-w-xl mb-10 leading-relaxed">
              Africa's most intelligent recruitment platform. We combine AI-powered matching, 
              verified candidate profiles, and end-to-end deployment support to connect skilled 
              professionals with verified employers across the globe.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12">
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 rounded-full px-10 h-14 text-base font-bold shadow-lg shadow-blue-600/25 group relative overflow-hidden">
                <Link href="/jobs" className="relative flex items-center h-full w-full px-10">
                  <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center">
                    Find Jobs
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-blue-400/30 text-blue-300 hover:bg-blue-500/10 rounded-full px-10 h-14 text-base font-bold group">
                <Link href="/employers">
                  <Building2 className="mr-2 h-5 w-5" />
                  Start Hiring
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[
                  { bg: "from-blue-400 to-indigo-500", letter: "A" },
                  { bg: "from-emerald-400 to-teal-500", letter: "S" },
                  { bg: "from-amber-400 to-orange-500", letter: "K" },
                  { bg: "from-rose-400 to-pink-500", letter: "M" },
                  { bg: "from-violet-400 to-purple-500", letter: "J" },
                ].map((p, i) => (
                  <div key={i} className={`h-10 w-10 rounded-full border-2 border-blue-900/50 overflow-hidden bg-gradient-to-br ${p.bg} flex items-center justify-center text-white text-xs font-bold`}>
                    {p.letter}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="font-bold text-white">20,000+</div>
                <div className="text-blue-300/50">Professionals placed</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-sm">
                <div className="font-bold text-white">500+</div>
                <div className="text-blue-300/50">Verified employers</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-sm">
                <div className="font-bold text-white">25+</div>
                <div className="text-blue-300/50">Countries reached</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="hidden lg:block relative"
          >
            <div className="relative h-[600px]">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-indigo-500/20 rounded-3xl blur-3xl translate-y-4 translate-x-4" />

              <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl h-full">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    AI Platform Active
                  </Badge>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                      <Search className="h-5 w-5 text-blue-400 mb-2" />
                      <div className="text-white text-sm font-semibold">AI Job Matching</div>
                      <div className="text-xs text-blue-300/50">94% accuracy rate</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                      <Users className="h-5 w-5 text-emerald-400 mb-2" />
                      <div className="text-white text-sm font-semibold">Verified Candidates</div>
                      <div className="text-xs text-blue-300/50">7-point verification</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                      <Globe className="h-5 w-5 text-amber-400 mb-2" />
                      <div className="text-white text-sm font-semibold">Global Reach</div>
                      <div className="text-xs text-blue-300/50">25+ countries</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                      <ShieldCheck className="h-5 w-5 text-cyan-400 mb-2" />
                      <div className="text-white text-sm font-semibold">Trusted Platform</div>
                      <div className="text-xs text-blue-300/50">Enterprise grade</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-2xl p-4 border border-blue-500/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-semibold text-white">Live Platform Activity</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: "Active Listings", value: "2,847" },
                        { label: "Applications Today", value: "1,234" },
                        { label: "Successful Matches", value: "156" },
                        { label: "Employers Online", value: "48" },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between text-sm">
                          <span className="text-blue-200/50">{item.label}</span>
                          <span className="text-white font-bold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <FloatingCard delay={1} className="top-12 -right-16">
                <div className="bg-gradient-to-br from-emerald-500/90 to-teal-600/90 backdrop-blur rounded-2xl p-4 shadow-2xl border border-emerald-400/30 min-w-[180px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white text-2xl font-black">12K+</div>
                      <div className="text-emerald-200 text-xs">Active Job Seekers</div>
                    </div>
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard delay={1.3} className="bottom-20 -left-20">
                <div className="bg-gradient-to-br from-amber-500/90 to-orange-600/90 backdrop-blur rounded-2xl p-4 shadow-2xl border border-amber-400/30 min-w-[180px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white text-2xl font-black">500+</div>
                      <div className="text-amber-200 text-xs">Verified Employers</div>
                    </div>
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard delay={1.6} className="bottom-40 -right-12">
                <div className="bg-gradient-to-br from-blue-500/90 to-indigo-600/90 backdrop-blur rounded-2xl p-4 shadow-2xl border border-blue-400/30 min-w-[180px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white text-2xl font-black">25+</div>
                      <div className="text-blue-200 text-xs">Countries Reached</div>
                    </div>
                  </div>
                </div>
              </FloatingCard>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
    </section>
  );
}

function MissionVisionSection() {
  const values = [
    { icon: Heart, title: "Trust & Transparency", description: "Every profile and employer is verified to ensure a safe, honest hiring ecosystem." },
    { icon: Zap, title: "Innovation First", description: "AI-powered matching and smart recruitment tools that evolve with the market." },
    { icon: Users, title: "Inclusive Opportunity", description: "Connecting talent across Africa, the Middle East, and global markets without bias." },
    { icon: Award, title: "Excellence in Service", description: "Dedicated support for both job seekers and employers at every step." },
  ];

  return (
    <section className="py-28 bg-white dark:bg-[#070B2E] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-200/20 to-transparent" />
      <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-200/20 to-transparent" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <Badge className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 rounded-full px-5 py-1.5 text-sm mb-6">
              <Target className="h-4 w-4 mr-1" />
              Our Purpose
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4 dark:text-white">
              Mission &{" "}
              <span className="text-gradient-blue">Vision</span>
            </h2>
            <p className="text-gray-500 dark:text-blue-200/60 max-w-2xl mx-auto text-lg">
              We're on a mission to make hiring fair, fast, and accessible — for everyone.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <FadeIn delay={0.1}>
            <div className="group relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-10 text-white overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-6">
                  <Target className="h-7 w-7 text-blue-200" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-blue-100 leading-relaxed text-lg">
                  To democratize access to quality employment opportunities by building 
                  an intelligent recruitment platform that connects talented professionals 
                  with verified employers — removing barriers, bias, and bureaucracy 
                  from the hiring process.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-blue-950 rounded-3xl p-10 text-white overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-6">
                  <Eye className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-gray-300 leading-relaxed text-lg">
                  To become the most trusted recruitment ecosystem for the African and 
                  Middle Eastern workforce — powering millions of successful career 
                  connections and transforming how talent moves across borders 
                  through technology.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <FadeIn key={v.title} delay={0.1 * i}>
              <Card className="border-gray-100 dark:border-white/10 card-hover h-full bg-white dark:bg-white/5">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
                    <v.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-blue-200/60 leading-relaxed">{v.description}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderStorySection() {
  return (
    <section className="py-28 employer-gradient-light dark:bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-100 dark:bg-blue-500/10 rounded-3xl -z-10" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-amber-100 dark:bg-amber-500/10 rounded-3xl -z-10" />
              <div className="bg-white dark:bg-white/5 rounded-3xl p-10 border border-gray-100 dark:border-white/10 shadow-xl">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6">
                  <Quote className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 rounded-full px-4 py-1 text-sm mb-6">
                  <Rocket className="h-3.5 w-3.5 mr-1" />
                  Our Story
                </Badge>
                <h2 className="text-3xl md:text-4xl font-heading font-black mb-6 dark:text-white">
                  Why We Built{" "}
                  <span className="text-gradient-blue">KeFeL Job Hub</span>
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-blue-200/70 leading-relaxed">
                  <p>
                    We saw talented people struggling to find trusted jobs while employers 
                    struggled to reach qualified candidates. The recruitment industry was 
                    broken — fragmented, opaque, and inefficient.
                  </p>
                  <p>
                    Job seekers spent months applying with no response. Employers wasted 
                    thousands on platforms that delivered unqualified leads. The Gulf 
                    region and Africa had no dedicated platform bridging this gap effectively.
                  </p>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-2xl p-6 border border-blue-100 dark:border-blue-500/10 my-6">
                    <p className="text-gray-800 dark:text-white font-semibold text-lg italic">
                      "KeFeL Job Hub was created to bridge this gap using technology, 
                      transparency, and intelligent recruitment systems."
                    </p>
                  </div>
                  <p>
                    Our AI-powered matching, 7-point candidate verification, and 
                    end-to-end deployment support means employers can hire with 
                    confidence, and job seekers can find opportunities that truly 
                    match their skills and aspirations.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="right">
            <div className="space-y-6">
              <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 card-hover flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl">😟</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-1">The Challenge</h4>
                  <p className="text-sm text-gray-500 dark:text-blue-200/60">87% of job seekers in Africa struggle to find verified employment opportunities. Employers spend 40%+ of their hiring budget on ineffective channels.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 card-hover flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl">💡</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-1">The Insight</h4>
                  <p className="text-sm text-gray-500 dark:text-blue-200/60">Technology could solve this. AI matching, intelligent verification, and automated workflows could make hiring fair, fast, and borderless.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 card-hover flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-1">The Solution</h4>
                  <p className="text-sm text-gray-500 dark:text-blue-200/60">An AI-powered recruitment ecosystem connecting African talent to Gulf and global opportunities with full verification, deployment support, and smart matching.</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl shrink-0">KM</div>
                  <div>
                    <div className="font-bold text-lg">KeFeL Media Team</div>
                    <div className="text-xs text-blue-200/80">Founders, KeFeL Job Hub</div>
                    <p className="text-blue-100 text-sm mt-2 italic">
                      "We believe talent is universal, but opportunity isn't. Our platform exists to change that — one connection at a time."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function StatisticsSection() {
  return (
    <section className="py-24 employer-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-[0.02]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full px-5 py-1.5 text-sm mb-6">
              <BarChart3 className="h-4 w-4 mr-1" />
              Platform Impact
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-black text-white mb-4">
              Our platform by the{" "}
              <span className="text-gradient-electric">numbers</span>
            </h2>
            <p className="text-blue-200/60 max-w-2xl mx-auto text-lg">
              Real metrics showing the scale and impact of our recruitment ecosystem.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-5 max-w-5xl mx-auto">
          {[
            { value: 20000, label: "Active Job Seekers", suffix: "+", icon: Users },
            { value: 5000, label: "Jobs Posted", suffix: "+", icon: Briefcase },
            { value: 500, label: "Hiring Companies", suffix: "+", icon: Building2 },
            { value: 25, label: "Countries Reached", suffix: "", icon: Globe },
            { value: 12000, label: "Successful Placements", suffix: "+", icon: TrendingUp },
          ].map((stat) => (
            <FadeIn key={stat.label}>
              <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center hover:bg-white/10 transition-all duration-300 card-hover-navy">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="h-5 w-5 text-blue-400" />
                </div>
                <AnimatedCounter value={stat.value} label={stat.label} suffix={stat.suffix} />
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
    </section>
  );
}

function HowItWorksSection() {
  const seekerSteps = [
    { icon: UserPlus, title: "Create Profile", desc: "Sign up in minutes and build a professional profile that showcases your skills, experience, and career aspirations." },
    { icon: FileText, title: "Upload CV & Get AI Analysis", desc: "Upload your resume for instant AI analysis. Get suggestions on how to improve your CV for better matches." },
    { icon: Search, title: "Apply With One Click", desc: "Browse AI-matched opportunities and apply instantly. Track every application from your personalized dashboard." },
    { icon: Briefcase, title: "Get Hired & Start Working", desc: "Connect with verified employers, interview through our platform, and land your dream role." },
  ];

  const employerSteps = [
    { icon: FileText, title: "Post Jobs With AI Assistance", desc: "Create detailed job listings with AI-generated descriptions that attract the right candidates." },
    { icon: Users, title: "AI Filters & Ranks Candidates", desc: "Our AI automatically ranks applicants based on skills, experience, and culture fit." },
    { icon: Calendar, title: "Interview & Evaluate", desc: "Schedule interviews, share feedback with your team, and make data-driven hiring decisions." },
    { icon: TrendingUp, title: "Hire & Deploy Faster", desc: "Make offers, manage contracts, and onboard new hires — all within the platform." },
  ];

  return (
    <section className="py-28 bg-white dark:bg-[#070B2E] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <Badge className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 rounded-full px-5 py-1.5 text-sm mb-6">
              <Layers className="h-4 w-4 mr-1" />
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4 dark:text-white">
              Simple workflows for{" "}
              <span className="text-gradient-blue">everyone</span>
            </h2>
            <p className="text-gray-500 dark:text-blue-200/60 max-w-2xl mx-auto text-lg">
              Whether you're looking for a job or hiring talent, we've streamlined every step.
            </p>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-10">
          <FadeIn>
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-3xl p-8 border border-blue-100 dark:border-blue-500/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/20 dark:bg-blue-500/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">For Job Seekers</h3>
                    <p className="text-sm text-gray-500 dark:text-blue-200/60">4 simple steps to your next role</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {seekerSteps.map((step, i) => (
                    <div key={step.title} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-white/10 border-2 border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0 group-hover:border-blue-400 dark:group-hover:border-blue-400 transition-colors">
                          <step.icon className="h-5 w-5" />
                        </div>
                        {i < seekerSteps.length - 1 && <div className="w-0.5 h-8 bg-blue-200 dark:bg-blue-500/20 mt-1" />}
                      </div>
                      <div className="pt-2">
                        <h4 className="font-bold text-gray-800 dark:text-white">{step.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-blue-200/60">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 rounded-3xl p-8 border border-amber-100 dark:border-amber-500/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200/20 dark:bg-amber-500/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/25">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">For Employers</h3>
                    <p className="text-sm text-gray-500 dark:text-blue-200/60">Streamlined hiring in 4 steps</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {employerSteps.map((step, i) => (
                    <div key={step.title} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-white/10 border-2 border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0 group-hover:border-amber-400 dark:group-hover:border-amber-400 transition-colors">
                          <step.icon className="h-5 w-5" />
                        </div>
                        {i < employerSteps.length - 1 && <div className="w-0.5 h-8 bg-amber-200 dark:bg-amber-500/20 mt-1" />}
                      </div>
                      <div className="pt-2">
                        <h4 className="font-bold text-gray-800 dark:text-white">{step.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-blue-200/60">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function WhyChooseSection() {
  const features = [
    { icon: Sparkles, title: "AI-Powered Job Matching", desc: "Smart algorithms that learn from every interaction to deliver 94% accurate matches.", gradient: "from-blue-600 to-cyan-500" },
    { icon: FileText, title: "ATS-Optimized Profiles", desc: "Profiles built to pass Applicant Tracking Systems and impress recruiters.", gradient: "from-indigo-600 to-purple-500" },
    { icon: BarChart3, title: "Smart Recruiter Dashboard", desc: "Real-time analytics, pipeline management, and team collaboration tools.", gradient: "from-purple-600 to-pink-500" },
    { icon: Bell, title: "Real-Time Application Tracking", desc: "Instant notifications on application reviews, interviews, and offers.", gradient: "from-amber-500 to-orange-500" },
    { icon: ShieldCheck, title: "Verified Employer Accounts", desc: "Every employer undergoes a 7-point verification process for trust.", gradient: "from-emerald-500 to-teal-500" },
    { icon: Zap, title: "Resume Optimization Tools", desc: "AI-powered suggestions to improve your CV and increase interview chances.", gradient: "from-rose-500 to-red-500" },
    { icon: Globe, title: "Remote Job Opportunities", desc: "Work from anywhere with vetted remote and hybrid positions.", gradient: "from-sky-500 to-blue-500" },
    { icon: Users, title: "International Recruitment", desc: "Cross-border hiring support with visa guidance and relocation assistance.", gradient: "from-violet-500 to-indigo-500" },
    { icon: Cloud, title: "Secure Cloud Infrastructure", desc: "Enterprise-grade security with end-to-end encryption and 99.9% uptime.", gradient: "from-cyan-500 to-blue-500" },
    { icon: Smartphone, title: "Mobile-First Experience", desc: "Full recruitment functionality optimized for mobile and WhatsApp integration.", gradient: "from-teal-500 to-emerald-500" },
  ];

  return (
    <section className="py-28 employer-gradient-light dark:bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-50 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <Badge className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 rounded-full px-5 py-1.5 text-sm mb-6">
              <Star className="h-4 w-4 mr-1" />
              Why Choose KeFeL
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4 dark:text-white">
              Built for modern{" "}
              <span className="text-gradient-blue">recruitment</span>
            </h2>
            <p className="text-gray-500 dark:text-blue-200/60 max-w-2xl mx-auto text-lg">
              Everything you need to hire or get hired — powered by AI and designed for results.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.03}>
              <Card className="border-gray-100 dark:border-white/10 card-hover h-full bg-white dark:bg-white/5 group overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                <CardContent className="p-6 relative z-10">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-blue-200/60">{f.desc}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const logos = ["Qatar Airways", "SABIC", "QNB", "Ooredoo", "Gulf Air", "Qatar Energy", "Saudi Aramco", "Emirates", "DP World", "Masraf Al Rayan", "Vodafone Qatar", "KPMG Qatar"];
  const badges = [
    { icon: ShieldCheck, label: "Verified Employers", desc: "All employers undergo 7-point verification", color: "from-emerald-500 to-teal-500" },
    { icon: Lock, label: "GDPR Compliant", desc: "Enterprise-grade data encryption & protection", color: "from-blue-500 to-indigo-500" },
    { icon: Award, label: "Trusted Platform", desc: "20,000+ professionals and 500+ employers", color: "from-amber-500 to-orange-500" },
    { icon: Fingerprint, label: "Identity Verified", desc: "End-to-end identity & document verification", color: "from-violet-500 to-purple-500" },
  ];

  return (
    <section className="py-28 bg-white dark:bg-[#070B2E] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4">
        <FadeIn>
          <div className="text-center mb-16">
            <Badge className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 rounded-full px-5 py-1.5 text-sm mb-6">
              <ShieldCheck className="h-4 w-4 mr-1" />
              Trust & Credibility
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4 dark:text-white">
              Built on a foundation of{" "}
              <span className="text-gradient-blue">trust</span>
            </h2>
            <p className="text-gray-500 dark:text-blue-200/60 max-w-2xl mx-auto text-lg">
              Every interaction on our platform is secured, verified, and transparent.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {badges.map((b, i) => (
            <FadeIn key={b.label} delay={i * 0.1}>
              <div className="group bg-gray-50 dark:bg-white/5 rounded-2xl p-6 text-center border border-gray-100 dark:border-white/10 card-hover relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${b.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${b.color} bg-opacity-10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <b.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-1">{b.label}</h3>
                  <p className="text-sm text-gray-500 dark:text-blue-200/60">{b.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="text-center mb-8">
            <p className="text-sm text-gray-400 dark:text-blue-300/50 uppercase tracking-widest font-bold mb-8">Trusted by leading companies across the Gulf & Africa</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {logos.map((name, i) => (
              <FadeIn key={name} delay={i * 0.03}>
                <div className="group bg-gray-50 dark:bg-white/5 rounded-2xl p-4 text-center border border-gray-100 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-sm">{name.charAt(0)}</span>
                  </div>
                  <div className="text-xs font-bold text-gray-700 dark:text-blue-200/70 truncate">{name}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function SuccessStoriesSection() {
  const stories = [
    {
      name: "Grace Akello", role: "Software Engineer", company: "Qatar Tech Solutions",
      story: "After months of searching, I found my dream job through KeFeL. The AI matching suggested roles I hadn't considered, and the verification process made the employer trust my qualifications instantly. I moved from Kampala to Doha in just 3 weeks.",
      rating: 5, achievement: "Placed in 2 weeks", avatar: "GA", type: "Job Seeker",
    },
    {
      name: "Ahmed Al Thani", role: "HR Director", company: "Gulf Construction Co",
      story: "We needed 50 skilled workers urgently for a major project in Lusail. KeFeL's bulk hiring and AI verification system delivered pre-screened, ready-to-deploy candidates within 10 days. Reduced our hiring time by 70% and cost by 45%.",
      rating: 5, achievement: "50 hires in 10 days", avatar: "AT", type: "Employer",
    },
    {
      name: "Sarah Wanjiku", role: "Customer Success Manager", company: "Global Tech Inc",
      story: "KeFeL connected me with a remote role that perfectly matched my skills. The AI analyzed my resume and found opportunities I would have never discovered on my own. I now work from Nairobi serving clients worldwide.",
      rating: 5, achievement: "Remote placement", avatar: "SW", type: "Job Seeker",
    },
    {
      name: "Mohammed Al-Kuwari", role: "Talent Acquisition Lead", company: "QatarEnergy",
      story: "The platform's candidate verification saved us countless hours. Every candidate that comes through KeFeL is pre-vetted, skills-tested, and ready to interview. It's become our primary hiring channel for technical roles.",
      rating: 5, achievement: "250+ hires", avatar: "MK", type: "Employer",
    },
  ];

  return (
    <section className="py-28 employer-gradient-light dark:bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4">
        <FadeIn>
          <div className="text-center mb-16">
            <Badge className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 rounded-full px-5 py-1.5 text-sm mb-6">
              <Star className="h-4 w-4 mr-1" />
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4 dark:text-white">
              Real people, real{" "}
              <span className="text-gradient-blue">results</span>
            </h2>
            <p className="text-gray-500 dark:text-blue-200/60 max-w-2xl mx-auto text-lg">
              Stories from job seekers and employers who found success on our platform.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {stories.map((s, i) => (
            <FadeIn key={s.name} delay={i * 0.08}>
              <Card className="border-gray-100 dark:border-white/10 card-hover h-full bg-white dark:bg-white/5 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-7 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {Array.from({ length: s.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <Badge className={s.type === "Employer" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 text-xs rounded-full" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 text-xs rounded-full"}>
                      {s.type}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-blue-200/80 text-sm leading-relaxed mb-6 italic">
                    &ldquo;{s.story}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {s.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 dark:text-white text-sm">{s.name}</div>
                        <div className="text-xs text-gray-500 dark:text-blue-200/60">{s.role}, {s.company}</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 text-xs rounded-full whitespace-nowrap">
                      {s.achievement}
                    </Badge>
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

function ForEmployersSection() {
  const benefits = [
    { icon: Zap, title: "Faster Hiring", desc: "Reduce time-to-hire by 70% with AI-powered candidate ranking and automated screening workflows." },
    { icon: Users, title: "Better Candidate Filtering", desc: "AI analyzes skills, experience, and culture fit to surface the best candidates first." },
    { icon: DollarSign, title: "Reduced Recruitment Costs", desc: "Cut recruitment costs by 60% compared to traditional agencies and job boards." },
    { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time metrics on pipeline, source effectiveness, and team performance." },
    { icon: Sparkles, title: "Smart Recruitment Tools", desc: "AI job description generator, interview questions, and automated scheduling." },
    { icon: Building2, title: "Employer Branding", desc: "Showcase your company with branded profiles, videos, and culture content." },
  ];

  return (
    <section className="py-28 bg-white dark:bg-[#070B2E] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <FadeIn direction="left">
            <div>
              <Badge className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 rounded-full px-5 py-1.5 text-sm mb-6">
                <Building2 className="h-4 w-4 mr-1" />
                For Employers
              </Badge>
              <h2 className="text-4xl md:text-5xl font-heading font-black mb-6 dark:text-white">
                Hire the best talent{" "}
                <span className="text-gradient-blue">faster</span>
              </h2>
              <p className="text-gray-500 dark:text-blue-200/60 text-lg mb-8 leading-relaxed">
                Our AI-powered platform helps you find, screen, and hire verified candidates 
                in record time. From posting a job to signing a contract — we've streamlined 
                every step of the recruitment process.
              </p>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-blue-600/25 group">
                <Link href="/employers">
                  Start Hiring Today
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </FadeIn>

          <FadeIn direction="right">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-indigo-500/10 rounded-3xl blur-3xl translate-y-4" />
              <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 rounded-3xl p-8 border border-blue-500/20 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-blue-300/50 ml-2">Recruiter Dashboard</span>
                    <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs border-emerald-500/30">Live</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: "Total Applicants", value: "847", change: "+12%", color: "text-emerald-400" },
                      { label: "Interviews", value: "34", change: "+8%", color: "text-blue-400" },
                      { label: "Offers Sent", value: "12", change: "+5%", color: "text-amber-400" },
                      { label: "Time to Hire", value: "6d", change: "-2d", color: "text-rose-400" },
                    ].map((m) => (
                      <div key={m.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <div className="text-xs text-blue-300/50">{m.label}</div>
                        <div className="text-white font-bold text-lg">{m.value}</div>
                        <div className={`text-xs ${m.color}`}>{m.change}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { role: "Construction Foreman", applicants: 48, status: "AI Matched" },
                      { role: "Security Guard", applicants: 32, status: "In Review" },
                      { role: "Electrician", applicants: 18, status: "Shortlisted" },
                    ].map((item) => (
                      <div key={item.role} className="bg-white/5 rounded-xl p-3 border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                        <div>
                          <div className="text-sm text-blue-200 font-medium">{item.role}</div>
                          <div className="text-xs text-blue-300/50">{item.applicants} applicants</div>
                        </div>
                        <Badge className={
                          item.status === "AI Matched" ? "bg-emerald-500/20 text-emerald-400 text-xs border-emerald-500/30" :
                          item.status === "In Review" ? "bg-blue-500/20 text-blue-400 text-xs border-blue-500/30" :
                          "bg-amber-500/20 text-amber-400 text-xs border-amber-500/30"
                        }>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <FadeIn key={b.title} delay={i * 0.05}>
              <Card className="border-gray-100 dark:border-white/10 card-hover h-full bg-white dark:bg-white/5">
                <CardContent className="p-6 flex gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                    <b.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-1">{b.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-blue-200/60 leading-relaxed">{b.desc}</p>
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

function ForJobSeekersSection() {
  const benefits = [
    { icon: Briefcase, title: "Career Opportunities", desc: "Access thousands of verified job listings across industries and countries." },
    { icon: UserPlus, title: "Professional Profile", desc: "Build a standout profile that gets noticed by top employers." },
    { icon: Sparkles, title: "AI Recommendations", desc: "Get personalized job recommendations based on your skills and experience." },
    { icon: FileText, title: "Resume Building", desc: "AI-powered tools to optimize your CV for ATS and recruiter review." },
    { icon: Bell, title: "Job Alerts", desc: "Never miss an opportunity with real-time job alerts tailored to you." },
    { icon: BarChart3, title: "Application Tracking", desc: "Track every application, interview, and offer in one place." },
  ];

  return (
    <section className="py-28 employer-gradient-light dark:bg-[#0A1628] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <FadeIn direction="left">
            <div className="relative order-last lg:order-first">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-indigo-500/10 rounded-3xl blur-3xl -translate-y-4" />
              <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 rounded-3xl p-8 border border-blue-400/20 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-8 w-8 rounded-xl bg-white/15 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-blue-200" />
                    </div>
                    <span className="text-white font-semibold">AI Career Assistant</span>
                    <Badge className="ml-auto bg-white/15 text-blue-200 text-xs border-white/20">Powered by AI</Badge>
                  </div>
                  <div className="space-y-3">
                    {[
                      { text: "Your profile matches 12 jobs in Qatar", icon: Briefcase },
                      { text: "Suggested: Update your skills section for better matches", icon: Zap },
                      { text: "Top match: Senior Engineer — 94% fit score", icon: Target },
                      { text: "New: 5 remote positions added today", icon: Globe },
                    ].map((item) => (
                      <div key={item.text} className="bg-white/10 backdrop-blur rounded-xl p-3.5 flex items-center gap-3 border border-white/5 hover:bg-white/15 transition-colors">
                        <item.icon className="h-4 w-4 text-blue-200 shrink-0" />
                        <span className="text-sm text-blue-100">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="right">
            <div>
              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 rounded-full px-5 py-1.5 text-sm mb-6">
                <Users className="h-4 w-4 mr-1" />
                For Job Seekers
              </Badge>
              <h2 className="text-4xl md:text-5xl font-heading font-black mb-6 dark:text-white">
                Find your{" "}
                <span className="text-gradient-blue">dream job</span>
              </h2>
              <p className="text-gray-500 dark:text-blue-200/60 text-lg mb-8 leading-relaxed">
                Whether you're looking for local opportunities in the Gulf or international 
                remote roles, our AI-powered platform connects you with verified employers 
                who value your skills and experience.
              </p>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-blue-600/25 group">
                <Link href="/register">
                  Create Free Profile
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <FadeIn key={b.title} delay={i * 0.05}>
              <Card className="border-gray-100 dark:border-white/10 card-hover h-full bg-white dark:bg-white/5">
                <CardContent className="p-6 flex gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <b.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-1">{b.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-blue-200/60 leading-relaxed">{b.desc}</p>
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

function TechnologySection() {
  const techs = [
    { icon: Cpu, title: "AI-Powered Matching", desc: "Machine learning algorithms that learn from every interaction to deliver better matches." },
    { icon: Search, title: "Smart Search", desc: "Natural language processing for intelligent job and candidate discovery across markets." },
    { icon: Bell, title: "Real-Time Notifications", desc: "Instant alerts via email, SMS, WhatsApp, and in-app for new matches and updates." },
    { icon: Cloud, title: "Cloud Infrastructure", desc: "Scalable cloud architecture on AWS ensuring 99.9% uptime and global availability." },
    { icon: Layers, title: "Microservices Architecture", desc: "Modular system design that scales effortlessly as we grow across new markets." },
    { icon: Smartphone, title: "Mobile Optimization", desc: "Responsive design optimized for mobile-first users across Africa and the Gulf." },
    { icon: Network, title: "Real-Time Sync", desc: "Live synchronization across all devices ensures you never miss an update." },
    { icon: Lock, title: "End-to-End Encryption", desc: "256-bit encryption for all data, communications, and document transfers." },
    { icon: Bot, title: "AI Resume Analysis", desc: "Advanced NLP that extracts, analyzes, and optimizes candidate resume data." },
  ];

  return (
    <section className="py-28 employer-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-[0.02]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px]" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full px-5 py-1.5 text-sm mb-6">
              <Cpu className="h-4 w-4 mr-1" />
              Technology
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-black text-white mb-4">
              Technology behind{" "}
              <span className="text-gradient-electric">KeFeL</span>
            </h2>
            <p className="text-blue-200/60 max-w-2xl mx-auto text-lg">
              Built with cutting-edge technology to deliver a seamless, secure, and intelligent recruitment experience.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {techs.map((t, i) => (
            <FadeIn key={t.title} delay={i * 0.03}>
              <div className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 card-hover-navy relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <t.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-bold mb-2">{t.title}</h3>
                  <p className="text-blue-200/50 text-sm leading-relaxed">{t.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { label: "AI Matching Accuracy", value: "94%" },
                { label: "Platform Uptime", value: "99.9%" },
                { label: "Data Encryption", value: "256-bit" },
                { label: "Average Response", value: "<100ms" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-2xl font-black text-gradient-electric">{m.value}</div>
                  <div className="text-sm text-blue-300/60 mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function TeamSection() {
  const team = [
    { name: "KeFeL Media", role: "Founder & CEO", bio: "Visionary leader driving the future of recruitment technology across Africa and the Gulf.", initials: "KM", gradient: "from-blue-500 to-indigo-600" },
    { name: "Engineering Team", role: "Lead Engineer", bio: "Building scalable AI-powered recruitment infrastructure with modern cloud architecture.", initials: "ET", gradient: "from-emerald-500 to-teal-600" },
    { name: "Recruitment Team", role: "Head of Recruitment", bio: "10+ years connecting top talent with leading employers across borders and industries.", initials: "RT", gradient: "from-amber-500 to-orange-600" },
    { name: "Partnerships Team", role: "Partnerships Director", bio: "Building strategic relationships with employers, agencies, and governments globally.", initials: "PT", gradient: "from-violet-500 to-purple-600" },
  ];

  return (
    <section className="py-28 bg-white dark:bg-[#070B2E] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
      <div className="container mx-auto px-4">
        <FadeIn>
          <div className="text-center mb-16">
            <Badge className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 rounded-full px-5 py-1.5 text-sm mb-6">
              <Users className="h-4 w-4 mr-1" />
              Our Team
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4 dark:text-white">
              Meet the people behind{" "}
              <span className="text-gradient-blue">KeFeL</span>
            </h2>
            <p className="text-gray-500 dark:text-blue-200/60 max-w-2xl mx-auto text-lg">
              A dedicated team committed to transforming recruitment through technology.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {team.map((m, i) => (
            <FadeIn key={m.name} delay={i * 0.1}>
              <Card className="border-gray-100 dark:border-white/10 card-hover text-center h-full bg-white dark:bg-white/5 group relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                <CardContent className="p-6 relative z-10">
                  <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    {m.initials}
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white">{m.name}</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-3">{m.role}</p>
                  <p className="text-xs text-gray-500 dark:text-blue-200/60 leading-relaxed">{m.bio}</p>
                  <div className="flex justify-center gap-3 mt-4">
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer group/icon">
                      <Linkedin className="h-4 w-4 text-gray-400 dark:text-blue-300/50 group-hover/icon:text-blue-600 dark:group-hover/icon:text-blue-400 transition-colors" />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer group/icon">
                      <Mail className="h-4 w-4 text-gray-400 dark:text-blue-300/50 group-hover/icon:text-blue-600 dark:group-hover/icon:text-blue-400 transition-colors" />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/5 flex items justify-center hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer group/icon">
                      <Twitter className="h-4 w-4 text-gray-400 dark:text-blue-300/50 group-hover/icon:text-blue-600 dark:group-hover/icon:text-blue-400 transition-colors" />
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
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800" />
      <div className="absolute inset-0 bg-grid-white opacity-[0.04] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-white/5 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-amber-400/10 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: "1.5s" }} />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <FadeIn>
          <Badge className="bg-white/10 text-white border-white/20 mb-6 text-sm px-6 py-2 rounded-full backdrop-blur">
            <Sparkles className="h-4 w-4 mr-2" />
            Join 20,000+ professionals & 500+ employers
          </Badge>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black text-white mb-6 leading-[1.05] max-w-4xl mx-auto">
            Ready to build your career or{" "}
            <span className="text-gradient-white">hire top talent</span>?
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-xl text-blue-100/70 max-w-2xl mx-auto mb-12">
            Join thousands of professionals and employers already using KeFeL Job Hub 
            to connect, recruit, and grow.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="bg-white text-blue-700 hover:bg-blue-50 border-0 rounded-full px-12 h-14 text-lg font-bold shadow-xl shadow-black/10 group relative overflow-hidden">
              <Link href="/jobs" className="relative flex items-center h-full w-full px-12">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative flex items-center">
                  Explore Jobs
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 rounded-full px-10 h-14 text-lg font-bold group">
              <Link href="/register">
                <Building2 className="mr-2 h-5 w-5" />
                Create Employer Account
              </Link>
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-blue-200/50">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Free to join</span>
            <span className="h-1 w-1 rounded-full bg-blue-300/20" />
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Verified employers</span>
            <span className="h-1 w-1 rounded-full bg-blue-300/20" />
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> AI-powered matching</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
