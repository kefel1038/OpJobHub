import { useState, useEffect, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";
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
  Building2, HardHat, UserCheck, TrendingUp, Award,
  Cpu, Network, Lock, Rocket, RocketIcon, Lightbulb,
  Layers, BookOpen, Monitor, MessageSquare, Clock,
  FileText, PlayCircle
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
      <div className="text-sm text-gray-500 font-medium">{label}</div>
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
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium">Trusted by 20,000+ professionals</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-heading font-black leading-[0.95] mb-6">
              <span className="text-white">Connecting Talent</span>
              <br />
              <span className="text-gradient-electric">With Opportunity</span>
              <br />
              <span className="text-white/80">Through Technology</span>
            </h1>

            <p className="text-lg md:text-xl text-blue-200/70 max-w-xl mb-10 leading-relaxed">
              We're building Africa's most intelligent recruitment platform — 
              connecting skilled professionals with verified employers across the globe 
              using AI-powered matching, transparent processes, and cutting-edge technology.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12">
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 rounded-full px-10 h-14 text-base font-bold shadow-lg shadow-blue-600/25 group">
                <Link href="/jobs">
                  Find Jobs
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-blue-400/30 text-blue-300 hover:bg-blue-500/10 rounded-full px-10 h-14 text-base font-bold">
                <Link href="/employers">
                  <Building2 className="mr-2 h-5 w-5" />
                  Start Hiring
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-blue-900/50 overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="font-bold text-white">20,000+</div>
                <div className="text-blue-300/60">Professionals placed</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-sm">
                <div className="font-bold text-white">500+</div>
                <div className="text-blue-300/60">Verified employers</div>
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
                    AI Platform Active
                  </Badge>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <Search className="h-5 w-5 text-blue-400 mb-2" />
                      <div className="text-white text-sm font-semibold">AI Job Matching</div>
                      <div className="text-xs text-blue-300/50">94% accuracy rate</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <Users className="h-5 w-5 text-emerald-400 mb-2" />
                      <div className="text-white text-sm font-semibold">Verified Candidates</div>
                      <div className="text-xs text-blue-300/50">7-point verification</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <Globe className="h-5 w-5 text-amber-400 mb-2" />
                      <div className="text-white text-sm font-semibold">Global Reach</div>
                      <div className="text-xs text-blue-300/50">25+ countries</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <ShieldCheck className="h-5 w-5 text-cyan-400 mb-2" />
                      <div className="text-white text-sm font-semibold">Trusted Platform</div>
                      <div className="text-xs text-blue-300/50">Enterprise grade</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-2xl p-4 border border-blue-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-semibold text-white">Today's Activity</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "Active Listings", value: "2,847" },
                        { label: "Applications Today", value: "1,234" },
                        { label: "Successful Matches", value: "156" },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between text-sm">
                          <span className="text-blue-200/60">{item.label}</span>
                          <span className="text-white font-bold">{item.value}</span>
                        </div>
                      ))}
                    </div>
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

function MissionVisionSection() {
  const values = [
    { icon: Heart, title: "Trust & Transparency", description: "Every profile and employer is verified to ensure a safe, honest hiring ecosystem." },
    { icon: Zap, title: "Innovation First", description: "AI-powered matching and smart recruitment tools that evolve with the market." },
    { icon: Users, title: "Inclusive Opportunity", description: "Connecting talent across Africa, the Middle East, and global markets without bias." },
    { icon: Award, title: "Excellence in Service", description: "Dedicated support for both job seekers and employers at every step." },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4 block">Our Purpose</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
              Mission &{" "}
              <span className="text-gradient-blue">Vision</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              We're on a mission to make hiring fair, fast, and accessible for everyone.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <FadeIn delay={0.1}>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
              <Target className="h-10 w-10 text-blue-200 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-blue-100 leading-relaxed text-lg">
                To democratize access to quality employment opportunities by building 
                an intelligent recruitment platform that connects talented professionals 
                with verified employers — removing barriers, bias, and bureaucracy 
                from the hiring process.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
              <Eye className="h-10 w-10 text-blue-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                To become the most trusted recruitment ecosystem for the African and 
                Middle Eastern workforce — powering millions of successful career 
                connections and transforming how talent moves across borders 
                through technology.
              </p>
            </div>
          </FadeIn>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <FadeIn key={v.title} delay={0.1 * i}>
              <Card className="border-gray-100 card-hover h-full">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <v.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>
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
    <section className="py-24 employer-gradient-light relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-100 rounded-3xl -z-10" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-amber-100 rounded-3xl -z-10" />
              <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-xl">
                <Quote className="h-8 w-8 text-blue-200 mb-6" />
                <h2 className="text-3xl md:text-4xl font-heading font-black mb-6">
                  Why We Built{" "}
                  <span className="text-gradient-blue">KeFeL Job Hub</span>
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
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
                  <p className="text-gray-800 font-semibold text-lg">
                    KeFeL Job Hub was created to bridge this gap using technology, 
                    transparency, and intelligent recruitment systems.
                  </p>
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
              <div className="bg-white rounded-2xl p-6 border border-gray-100 card-hover flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                  <span className="text-2xl">😟</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">The Challenge</h4>
                  <p className="text-sm text-gray-500">87% of job seekers in Africa struggle to find verified employment opportunities. Employers spend 40%+ of their hiring budget on ineffective channels.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 card-hover flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                  <span className="text-2xl">💡</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">The Insight</h4>
                  <p className="text-sm text-gray-500">Technology could solve this. AI matching, blockchain verification, and automated workflows could make hiring fair, fast, and borderless.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 card-hover flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">The Solution</h4>
                  <p className="text-sm text-gray-500">An AI-powered recruitment ecosystem connecting African talent to Gulf and global opportunities with full verification, deployment support, and smart matching.</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold">KM</div>
                  <div>
                    <div className="font-bold">KeFeL Media Team</div>
                    <div className="text-xs text-blue-200">Founders, KeFeL Job Hub</div>
                  </div>
                </div>
                <p className="text-blue-100 text-sm italic">
                  "We believe talent is universal, but opportunity isn't. Our platform exists to change that — one connection at a time."
                </p>
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
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
          {[
            { value: 20000, label: "Active Job Seekers", suffix: "+" },
            { value: 5000, label: "Jobs Posted", suffix: "+" },
            { value: 500, label: "Hiring Companies", suffix: "+" },
            { value: 25, label: "Countries Reached", suffix: "" },
            { value: 12000, label: "Successful Placements", suffix: "+" },
          ].map((stat) => (
            <FadeIn key={stat.label}>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center">
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
    { icon: UserCheck, title: "Create Profile", desc: "Sign up and build a professional profile showcasing your skills and experience." },
    { icon: FileText, title: "Upload CV", desc: "Upload your resume for AI analysis and smart job matching." },
    { icon: Search, title: "Apply for Jobs", desc: "Browse verified opportunities and apply with one click." },
    { icon: Briefcase, title: "Get Hired", desc: "Connect with employers, interview, and land your dream role." },
  ];

  const employerSteps = [
    { icon: FileText, title: "Post Jobs", desc: "Create detailed job listings with AI-assisted descriptions." },
    { icon: Users, title: "Filter Candidates", desc: "AI ranks and scores candidates based on your requirements." },
    { icon: Calendar, title: "Schedule Interviews", desc: "Coordinate interviews directly through the platform." },
    { icon: TrendingUp, title: "Hire Faster", desc: "Make offers and manage the entire hiring workflow digitally." },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4 block">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
              Simple workflows for{" "}
              <span className="text-gradient-blue">everyone</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-12">
          <FadeIn>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">For Job Seekers</h3>
              </div>
              <div className="space-y-6">
                {seekerSteps.map((step, i) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-2xl bg-white border-2 border-blue-200 flex items-center justify-center text-blue-600 font-bold shrink-0">
                        <step.icon className="h-5 w-5" />
                      </div>
                      {i < seekerSteps.length - 1 && <div className="w-0.5 h-8 bg-blue-200 mt-1" />}
                    </div>
                    <div className="pt-2">
                      <h4 className="font-bold text-gray-800">{step.title}</h4>
                      <p className="text-sm text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-amber-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">For Employers</h3>
              </div>
              <div className="space-y-6">
                {employerSteps.map((step, i) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-2xl bg-white border-2 border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                        <step.icon className="h-5 w-5" />
                      </div>
                      {i < employerSteps.length - 1 && <div className="w-0.5 h-8 bg-amber-200 mt-1" />}
                    </div>
                    <div className="pt-2">
                      <h4 className="font-bold text-gray-800">{step.title}</h4>
                      <p className="text-sm text-gray-500">{step.desc}</p>
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

function WhyChooseSection() {
  const features = [
    { icon: Sparkles, title: "AI-Powered Job Matching", desc: "Smart algorithms match candidates to positions with 94% accuracy.", color: "from-blue-600 to-cyan-500" },
    { icon: FileText, title: "ATS-Friendly Profiles", desc: "Profiles optimized for Applicant Tracking Systems.", color: "from-indigo-600 to-purple-500" },
    { icon: BarChart3, title: "Smart Recruiter Dashboard", desc: "Real-time analytics and pipeline management.", color: "from-purple-600 to-pink-500" },
    { icon: Bell, title: "Real-Time Tracking", desc: "Instant notifications on application status.", color: "from-amber-500 to-orange-500" },
    { icon: ShieldCheck, title: "Verified Employers", desc: "Every employer is verified for trust and authenticity.", color: "from-emerald-500 to-teal-500" },
    { icon: Zap, title: "Resume Optimization", desc: "AI-powered suggestions to improve your CV.", color: "from-rose-500 to-red-500" },
    { icon: Globe, title: "Remote Opportunities", desc: "Work from anywhere with global remote jobs.", color: "from-sky-500 to-blue-500" },
    { icon: Users, title: "International Recruitment", desc: "Cross-border hiring with visa support.", color: "from-violet-500 to-indigo-500" },
    { icon: Cloud, title: "Secure Cloud Infrastructure", desc: "Enterprise-grade security for your data.", color: "from-cyan-500 to-blue-500" },
    { icon: Smartphone, title: "Mobile-First Experience", desc: "Full functionality on any device.", color: "from-teal-500 to-emerald-500" },
  ];

  return (
    <section className="py-24 employer-gradient-light relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-50" />
      <div className="container mx-auto px-4 relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4 block">Why Choose KeFeL</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
              Built for modern{" "}
              <span className="text-gradient-blue">recruitment</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Everything you need to hire or get hired — powered by AI and designed for results.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.03}>
              <Card className="border-gray-100 card-hover h-full">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
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
  const logos = ["Qatar Airways", "SABIC", "QNB", "Ooredoo", "Gulf Air", "Qatar Energy", "Saudi Aramco", "Emirates"];
  const badges = [
    { icon: ShieldCheck, label: "Verified Employers", desc: "All employers are vetted" },
    { icon: Lock, label: "Data Protection", desc: "GDPR compliant & encrypted" },
    { icon: Award, label: "Trusted Platform", desc: "20,000+ professionals" },
    { icon: CheckCircle2, label: "Secure Hiring", desc: "End-to-end verification" },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4 block">Trust & Credibility</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
              Built on{" "}
              <span className="text-gradient-blue">trust</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {badges.map((b, i) => (
            <FadeIn key={b.label} delay={i * 0.1}>
              <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 card-hover">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{b.label}</h3>
                <p className="text-sm text-gray-500">{b.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="text-center mb-8">
            <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-6">Trusted by leading companies</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {logos.map((name, i) => (
              <FadeIn key={name} delay={i * 0.05}>
                <div className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100 hover:border-blue-200 transition-all">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-sm">{name.charAt(0)}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-700">{name}</div>
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
      story: "After months of searching, I found my dream job through KeFeL. The AI matching suggested roles I hadn't considered, and the verification process made the employer trust my qualifications instantly.",
      rating: 5, achievement: "Placed in 2 weeks", avatar: "GA",
    },
    {
      name: "Ahmed Hassan", role: "HR Director", company: "Gulf Construction Co",
      story: "We needed 50 skilled workers urgently. KeFeL's bulk hiring and verification system delivered pre-screened, ready-to-deploy candidates within 10 days. Reduced our hiring time by 70%.",
      rating: 5, achievement: "50 hires in 10 days", avatar: "AH",
    },
    {
      name: "Sarah Wanjiku", role: "Remote Customer Success", company: "Global Tech Inc",
      story: "KeFeL connected me with a remote role that perfectly matched my skills. The platform's AI analyzed my resume and found opportunities I would have never discovered on my own.",
      rating: 5, achievement: "Remote placement", avatar: "SW",
    },
  ];

  return (
    <section className="py-24 employer-gradient-light relative overflow-hidden">
      <div className="container mx-auto px-4">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4 block">Success Stories</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
              Real people, real{" "}
              <span className="text-gradient-blue">results</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {stories.map((s, i) => (
            <FadeIn key={s.name} delay={i * 0.1}>
              <Card className="border-gray-100 card-hover h-full">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: s.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                    &ldquo;{s.story}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                        {s.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.role}, {s.company}</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs rounded-full">
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
    { icon: Zap, title: "Faster Hiring", desc: "Reduce time-to-hire by 70% with AI-powered candidate ranking and automated screening." },
    { icon: Users, title: "Better Filtering", desc: "AI analyzes skills, experience, and culture fit to surface the best candidates first." },
    { icon: DollarSign, title: "Reduced Costs", desc: "Cut recruitment costs by 60% compared to traditional agencies and job boards." },
    { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time metrics on your hiring pipeline, source effectiveness, and team performance." },
    { icon: Sparkles, title: "Smart Tools", desc: "AI job description generator, interview question suggestions, and automated scheduling." },
    { icon: Building2, title: "Employer Branding", desc: "Showcase your company with a branded profile, videos, and culture content." },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <FadeIn direction="left">
            <div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full px-4 py-1.5 text-sm mb-6">
                <Building2 className="h-4 w-4 mr-1" />
                For Employers
              </Badge>
              <h2 className="text-4xl md:text-5xl font-heading font-black mb-6">
                Hire the best talent{" "}
                <span className="text-gradient-blue">faster</span>
              </h2>
              <p className="text-gray-500 text-lg mb-8">
                Our AI-powered platform helps you find, screen, and hire verified candidates 
                in record time. From posting a job to signing a contract — we've streamlined 
                every step.
              </p>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-blue-600/25 group">
                <Link href="/employers">
                  Start Hiring
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </FadeIn>

          <FadeIn direction="right">
            <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl p-8 border border-blue-500/20 shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-blue-300/50 ml-2">Recruiter Dashboard Preview</span>
              </div>
              <div className="space-y-3">
                {["Construction Foreman - 48 applicants", "Security Guard - 32 applicants", "Electrician - 18 applicants"].map((item) => (
                  <div key={item} className="bg-white/5 rounded-xl p-3 border border-white/5 flex justify-between items-center">
                    <span className="text-sm text-blue-200">{item}</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">AI Matched</Badge>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <FadeIn key={b.title} delay={i * 0.05}>
              <Card className="border-gray-100 card-hover h-full">
                <CardContent className="p-6 flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <b.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1">{b.title}</h4>
                    <p className="text-xs text-gray-500">{b.desc}</p>
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
    { icon: UserCheck, title: "Professional Profile", desc: "Build a standout profile that gets noticed by top employers." },
    { icon: Sparkles, title: "AI Recommendations", desc: "Get personalized job recommendations based on your skills and experience." },
    { icon: FileText, title: "Resume Building", desc: "AI-powered tools to optimize your CV for ATS and recruiter review." },
    { icon: Bell, title: "Job Alerts", desc: "Never miss an opportunity with real-time job alerts tailored to you." },
    { icon: BarChart3, title: "Application Tracking", desc: "Track every application, interview, and offer in one place." },
  ];

  return (
    <section className="py-24 employer-gradient-light relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <FadeIn direction="left">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 border border-blue-500/20 shadow-2xl order-last lg:order-first">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-200" />
                <span className="text-white font-semibold">AI Career Assistant</span>
              </div>
              <div className="space-y-3">
                {[
                  "Your profile matches 12 jobs in Qatar",
                  "Suggested: Update your skills section",
                  "Top match: Senior Engineer - 94% fit",
                ].map((item) => (
                  <div key={item} className="bg-white/10 rounded-xl p-3 text-sm text-blue-100">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="right">
            <div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full px-4 py-1.5 text-sm mb-6">
                <Users className="h-4 w-4 mr-1" />
                For Job Seekers
              </Badge>
              <h2 className="text-4xl md:text-5xl font-heading font-black mb-6">
                Find your{" "}
                <span className="text-gradient-blue">dream job</span>
              </h2>
              <p className="text-gray-500 text-lg mb-8">
                Whether you're looking for local opportunities or international roles, 
                our AI-powered platform connects you with verified employers who value 
                your skills and experience.
              </p>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-blue-600/25 group">
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
              <Card className="border-gray-100 card-hover h-full">
                <CardContent className="p-6 flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <b.icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1">{b.title}</h4>
                    <p className="text-xs text-gray-500">{b.desc}</p>
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
    { icon: Search, title: "Smart Search", desc: "Natural language processing for intelligent job and candidate discovery." },
    { icon: Bell, title: "Real-Time Notifications", desc: "Instant alerts via email, SMS, and in-app for new matches and updates." },
    { icon: Cloud, title: "Cloud Infrastructure", desc: "Scalable cloud architecture ensuring 99.9% uptime and global availability." },
    { icon: Layers, title: "Scalable Architecture", desc: "Microservices design that scales effortlessly as we grow across markets." },
    { icon: Smartphone, title: "Mobile Optimization", desc: "Responsive design optimized for the mobile-first users across Africa and the Gulf." },
  ];

  return (
    <section className="py-24 employer-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-[0.02]" />
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
            <FadeIn key={t.title} delay={i * 0.05}>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 card-hover-navy">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/20 flex items-center justify-center mb-4">
                  <t.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-2">{t.title}</h3>
                <p className="text-blue-200/50 text-sm">{t.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              {[
                { label: "AI Accuracy", value: "94%" },
                { label: "Platform Uptime", value: "99.9%" },
                { label: "Data Encryption", value: "256-bit" },
                { label: "Response Time", value: "<100ms" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-2xl font-black text-gradient-electric">{m.value}</div>
                  <div className="text-sm text-blue-300/60">{m.label}</div>
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
    { name: "KeFeL Media", role: "Founder & CEO", bio: "Visionary leader driving the future of recruitment technology across Africa and the Gulf.", initials: "KM" },
    { name: "Engineering Team", role: "Engineering Lead", bio: "Building scalable AI-powered recruitment infrastructure.", initials: "ET" },
    { name: "Recruitment Team", role: "Recruitment Specialist", bio: "10+ years connecting talent with opportunities across borders.", initials: "RT" },
    { name: "Partnerships Team", role: "Partnerships Manager", bio: "Building strategic relationships with employers and agencies globally.", initials: "PT" },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4 block">Our Team</span>
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
              Meet the people behind{" "}
              <span className="text-gradient-blue">KeFeL</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {team.map((m, i) => (
            <FadeIn key={m.name} delay={i * 0.1}>
              <Card className="border-gray-100 card-hover text-center h-full">
                <CardContent className="p-6">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                    {m.initials}
                  </div>
                  <h3 className="font-bold text-gray-800">{m.name}</h3>
                  <p className="text-sm text-blue-600 font-medium mb-3">{m.role}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{m.bio}</p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Linkedin className="h-4 w-4 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" />
                    <Mail className="h-4 w-4 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" />
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
    <section className="py-28 employer-gradient relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-[0.03]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <FadeIn>
          <h2 className="text-4xl md:text-6xl font-heading font-black text-white mb-6 leading-[1.05]">
            Ready to build your career or{" "}
            <span className="text-gradient-electric">hire top talent</span>?
          </h2>
          <p className="text-xl text-blue-200/60 max-w-2xl mx-auto mb-12">
            Join 20,000+ professionals and 500+ employers already using KeFeL Job Hub.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 rounded-full px-12 h-14 text-lg font-bold shadow-xl shadow-blue-600/25 group">
              <Link href="/jobs">
                Explore Jobs
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-blue-400/30 text-blue-300 hover:bg-blue-500/10 rounded-full px-10 h-14 text-lg font-bold">
              <Link href="/register">
                <Building2 className="mr-2 h-5 w-5" />
                Create Employer Account
              </Link>
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-blue-300/40">
            <span>Free to join</span>
            <span className="h-1 w-1 rounded-full bg-blue-300/20" />
            <span>Verified employers</span>
            <span className="h-1 w-1 rounded-full bg-blue-300/20" />
            <span>AI-powered matching</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
