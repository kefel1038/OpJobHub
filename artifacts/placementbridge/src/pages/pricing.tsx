import { useState } from "react"
import { Link } from "wouter"
import { motion } from "framer-motion"
import { Layout } from "@/components/layout/Layout"
import {
  CheckCircle, Sparkles, Building2, Users, Globe, Shield,
  BrainCircuit, MessageCircle, BarChart3, Video, FileText,
  Search, Zap, Target, ArrowRight, Star, Briefcase, Clock,
  CreditCard, Lock, Award, Medal, ChevronRight, Check,
  Wallet, Banknote, PieChart, Workflow, Bot, Scan,
  GraduationCap, Laptop, BadgeCheck, Network,
  Rocket, ArrowUpRight, Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

const plans = [
  {
    name: "Starter Hiring",
    desc: "For small businesses, shops, restaurants, and local employers starting their hiring journey.",
    popular: false,
    monthlyPrice: "29",
    annualPrice: "290",
    payPerJob: "49",
    payPerHire: "99",
    color: "from-zinc-900 to-zinc-700",
    features: [
      { text: "5 active job posts", included: true },
      { text: "AI job description generator", included: true },
      { text: "Receive candidate applications", included: true },
      { text: "Basic analytics dashboard", included: true },
      { text: "WhatsApp notifications", included: true },
      { text: "Email support", included: true },
      { text: "AI candidate ranking", included: false },
      { text: "Applicant Tracking System (ATS)", included: false },
      { text: "Team collaboration", included: false },
      { text: "Video interview verification", included: false },
      { text: "International recruitment tools", included: false },
      { text: "Visa processing support", included: false },
    ],
    cta: "Start Hiring",
    href: "/register",
  },
  {
    name: "Growth Recruitment",
    desc: "For SMEs, agencies, hotels, and construction firms scaling their recruitment.",
    popular: true,
    monthlyPrice: "79",
    annualPrice: "790",
    payPerJob: "99",
    payPerHire: "199",
    color: "from-[#FFBF00] to-amber-600",
    features: [
      { text: "Unlimited job posts", included: true },
      { text: "AI job description generator", included: true },
      { text: "AI candidate ranking & matching", included: true },
      { text: "Applicant Tracking System (ATS)", included: true },
      { text: "Team collaboration tools", included: true },
      { text: "Candidate shortlisting & pipelines", included: true },
      { text: "Interview scheduling", included: true },
      { text: "Featured employer badge", included: true },
      { text: "Priority job listings", included: true },
      { text: "Bulk messaging to candidates", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Video interview verification", included: false },
      { text: "International recruitment tools", included: false },
      { text: "Visa processing support", included: false },
    ],
    cta: "Start Growing",
    href: "/register",
  },
  {
    name: "Workforce Expansion",
    desc: "For large companies, HR departments, and international employers.",
    popular: false,
    monthlyPrice: "199",
    annualPrice: "1,990",
    payPerJob: "149",
    payPerHire: "299",
    color: "from-blue-600 to-indigo-600",
    features: [
      { text: "Unlimited job posts", included: true },
      { text: "AI job description generator", included: true },
      { text: "AI candidate ranking & matching", included: true },
      { text: "Applicant Tracking System (ATS)", included: true },
      { text: "Team collaboration tools", included: true },
      { text: "Candidate shortlisting & pipelines", included: true },
      { text: "Interview scheduling", included: true },
      { text: "Featured employer badge", included: true },
      { text: "Priority job listings", included: true },
      { text: "Bulk messaging to candidates", included: true },
      { text: "Advanced analytics", included: true },
      { text: "International recruitment tools", included: true },
      { text: "Visa processing support", included: true },
      { text: "Multi-admin dashboard", included: true },
      { text: "AI recruitment assistant", included: true },
      { text: "Video interview verification", included: true },
      { text: "Custom integrations & API", included: true },
      { text: "Recruitment automation workflows", included: true },
    ],
    cta: "Expand Workforce",
    href: "/register",
  },
  {
    name: "International Staffing Suite",
    desc: "For Gulf employers, workforce sourcing firms, and recruitment agencies managing cross-border hiring.",
    popular: false,
    monthlyPrice: "499",
    annualPrice: "4,990",
    payPerJob: "249",
    payPerHire: "499",
    color: "from-emerald-600 to-teal-600",
    features: [
      { text: "End-to-end recruitment management", included: true },
      { text: "Overseas worker sourcing", included: true },
      { text: "Passport & ID verification", included: true },
      { text: "Work permit workflow", included: true },
      { text: "Contract templates & management", included: true },
      { text: "Accommodation coordination tools", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Managed recruitment services", included: true },
      { text: "All Growth plan features", included: true },
      { text: "All Workforce plan features", included: true },
      { text: "Everything in AI + ATS suite", included: true },
      { text: "Priority 24/7 support", included: true },
    ],
    cta: "Contact Sales",
    href: "/contact",
  },
]

const billingModes = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
  { value: "pay-per-job", label: "Pay Per Job" },
  { value: "pay-per-hire", label: "Pay Per Hire" },
]

const comparisonFeatures = [
  {
    category: "AI & Intelligence",
    items: [
      { name: "AI Job Description Generator", starter: true, growth: true, workforce: true, suite: true },
      { name: "AI Candidate Ranking", starter: false, growth: true, workforce: true, suite: true },
      { name: "AI Job Matching Engine", starter: false, growth: true, workforce: true, suite: true },
      { name: "AI CV Scoring", starter: false, growth: false, workforce: true, suite: true },
      { name: "AI Interview Summaries", starter: false, growth: false, workforce: true, suite: true },
      { name: "AI Fraud Detection", starter: false, growth: false, workforce: true, suite: true },
      { name: "AI Multilingual Translation", starter: false, growth: false, workforce: false, suite: true },
      { name: "AI Recruitment Assistant (Chatbot)", starter: false, growth: false, workforce: true, suite: true },
    ],
  },
  {
    category: "Job Posting & Listings",
    items: [
      { name: "Active Job Posts", starter: "5", growth: "Unlimited", workforce: "Unlimited", suite: "Unlimited" },
      { name: "Featured Employer Badge", starter: false, growth: true, workforce: true, suite: true },
      { name: "Priority Search Placement", starter: false, growth: true, workforce: true, suite: true },
      { name: "Sponsored Jobs", starter: false, growth: false, workforce: true, suite: true },
      { name: "Urgent Hiring Badge", starter: false, growth: true, workforce: true, suite: true },
      { name: "Homepage Spotlight", starter: false, growth: false, workforce: true, suite: true },
    ],
  },
  {
    category: "ATS & Recruitment Workflow",
    items: [
      { name: "Applicant Tracking System", starter: false, growth: true, workforce: true, suite: true },
      { name: "Candidate Pipelines & Stages", starter: false, growth: true, workforce: true, suite: true },
      { name: "Interview Scheduling", starter: false, growth: true, workforce: true, suite: true },
      { name: "Team Collaboration", starter: false, growth: true, workforce: true, suite: true },
      { name: "Notes & Comments on Candidates", starter: false, growth: true, workforce: true, suite: true },
      { name: "Bulk Actions on Candidates", starter: false, growth: true, workforce: true, suite: true },
      { name: "Calendar Integration", starter: false, growth: false, workforce: true, suite: true },
      { name: "Recruitment Automation", starter: false, growth: false, workforce: true, suite: true },
    ],
  },
  {
    category: "Verification & Compliance",
    items: [
      { name: "National ID Verification", starter: false, growth: false, workforce: true, suite: true },
      { name: "Passport Verification", starter: false, growth: false, workforce: true, suite: true },
      { name: "Certificate Verification", starter: false, growth: false, workforce: true, suite: true },
      { name: "Police Clearance Uploads", starter: false, growth: false, workforce: true, suite: true },
      { name: "Video Verification", starter: false, growth: false, workforce: true, suite: true },
      { name: "Visa Sponsorship Workflow", starter: false, growth: false, workforce: true, suite: true },
      { name: "Work Permit Management", starter: false, growth: false, workforce: false, suite: true },
      { name: "Labour Law Guidance", starter: false, growth: false, workforce: false, suite: true },
    ],
  },
  {
    category: "Analytics & Reporting",
    items: [
      { name: "Basic Analytics Dashboard", starter: true, growth: true, workforce: true, suite: true },
      { name: "Advanced Recruitment Analytics", starter: false, growth: true, workforce: true, suite: true },
      { name: "Custom Reports", starter: false, growth: false, workforce: true, suite: true },
      { name: "Pipeline Analytics", starter: false, growth: true, workforce: true, suite: true },
      { name: "Hiring Funnel Insights", starter: false, growth: false, workforce: true, suite: true },
    ],
  },
  {
    category: "Communication",
    items: [
      { name: "In-App Messaging", starter: true, growth: true, workforce: true, suite: true },
      { name: "WhatsApp Notifications", starter: true, growth: true, workforce: true, suite: true },
      { name: "Bulk Candidate Messaging", starter: false, growth: true, workforce: true, suite: true },
      { name: "Email Notifications", starter: true, growth: true, workforce: true, suite: true },
      { name: "Push Notifications", starter: false, growth: true, workforce: true, suite: true },
    ],
  },
  {
    category: "International Recruitment",
    items: [
      { name: "Overseas Worker Sourcing", starter: false, growth: false, workforce: true, suite: true },
      { name: "Multi-Currency Payments", starter: false, growth: false, workforce: true, suite: true },
      { name: "Relocation Support Tools", starter: false, growth: false, workforce: false, suite: true },
      { name: "Employer Compliance Tools", starter: false, growth: false, workforce: false, suite: true },
      { name: "International Onboarding", starter: false, growth: false, workforce: false, suite: true },
      { name: "Dedicated Account Manager", starter: false, growth: false, workforce: false, suite: true },
    ],
  },
  {
    category: "Marketplace & Gig Economy",
    items: [
      { name: "Freelance Job Access", starter: false, growth: true, workforce: true, suite: true },
      { name: "Skilled Labor Marketplace", starter: false, growth: true, workforce: true, suite: true },
      { name: "Remote Work Listings", starter: true, growth: true, workforce: true, suite: true },
      { name: "Service Listings", starter: false, growth: false, workforce: true, suite: true },
      { name: "Contractor Hiring Tools", starter: false, growth: false, workforce: true, suite: true },
    ],
  },
  {
    category: "API & Integrations",
    items: [
      { name: "REST API Access", starter: false, growth: false, workforce: true, suite: true },
      { name: "Webhook Support", starter: false, growth: false, workforce: true, suite: true },
      { name: "Custom Integrations", starter: false, growth: false, workforce: true, suite: true },
      { name: "SSO / SAML", starter: false, growth: false, workforce: false, suite: true },
    ],
  },
  {
    category: "Support",
    items: [
      { name: "Email Support", starter: true, growth: true, workforce: true, suite: true },
      { name: "Priority Support", starter: false, growth: false, workforce: true, suite: true },
      { name: "24/7 Dedicated Support", starter: false, growth: false, workforce: false, suite: true },
      { name: "Onboarding Assistance", starter: false, growth: false, workforce: true, suite: true },
    ],
  },
]

const aiFeatures = [
  { icon: BrainCircuit, title: "AI CV Scoring", desc: "Automatically score and rank candidates based on job requirements, skills match, and experience relevance." },
  { icon: Search, title: "AI Job Matching", desc: "Smart matching engine that pairs candidates with the most suitable roles using machine learning." },
  { icon: Video, title: "AI Interview Summaries", desc: "Generate concise interview summaries with key insights, sentiment analysis, and hiring recommendations." },
  { icon: FileText, title: "AI Job Description Generator", desc: "Create professional, inclusive job descriptions in seconds with AI-powered content generation." },
  { icon: Shield, title: "AI Fraud Detection", desc: "Detect fake applications, fraudulent credentials, and suspicious activity with AI-powered screening." },
  { icon: Globe, title: "AI Multilingual Translation", desc: "Translate job postings, applications, and communications across Arabic, English, Swahili, and more." },
  { icon: Sparkles, title: "AI Recommendation Engine", desc: "Personalized job and candidate recommendations powered by behavioral and preference analysis." },
  { icon: Zap, title: "AI Candidate Ranking", desc: "Rank applicants by fit score using weighted criteria — skills, experience, location, and cultural fit." },
]

const verificationFeatures = [
  { icon: Scan, title: "National ID Verification", desc: "Real-time verification of national identity documents across African and Gulf countries." },
  { icon: FileText, title: "Passport Verification", desc: "Automated passport validation and cross-checking against international databases." },
  { icon: Award, title: "Certificate Verification", desc: "Verify academic and professional certificates directly with issuing institutions." },
  { icon: Shield, title: "Police Clearance", desc: "Secure upload and verification of police clearance certificates and background checks." },
  { icon: Video, title: "Video Verification", desc: "Live video identity verification with AI-powered liveness detection and facial matching." },
  { icon: BadgeCheck, title: "Skill Assessment Badges", desc: "Verified skill badges awarded after passing AI-proctored assessments and tests." },
]

const stats = [
  { value: "300+", label: "Employers Trust Us" },
  { value: "10,000+", label: "Active Job Seekers" },
  { value: "50+", label: "Countries Covered" },
  { value: "95%", label: "Client Satisfaction" },
  { value: "5,000+", label: "Successful Placements" },
]

const paymentMethods = [
  { name: "Stripe", logo: "S" },
  { name: "Visa", logo: "V" },
  { name: "Mastercard", logo: "MC" },
  { name: "Apple Pay", logo: "AP" },
  { name: "Google Pay", logo: "GP" },
  { name: "Flutterwave", logo: "F" },
  { name: "Paystack", logo: "P" },
  { name: "MTN MoMo", logo: "M" },
  { name: "Airtel Money", logo: "A" },
  { name: "PayTabs", logo: "PT" },
]

export default function Pricing() {
  const [billing, setBilling] = useState("monthly")

  const getPrice = (plan: typeof plans[number]) => {
    switch (billing) {
      case "annual": return plan.annualPrice
      case "pay-per-job": return plan.payPerJob
      case "pay-per-hire": return plan.payPerHire
      default: return plan.monthlyPrice
    }
  }

  const getPeriodLabel = () => {
    switch (billing) {
      case "annual": return "/year"
      case "pay-per-job": return "/job"
      case "pay-per-hire": return "/hire"
      default: return "/month"
    }
  }

  return (
    <Layout>
      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFBF00]/20 via-background to-black/5 dark:from-[#FFBF00]/10 dark:via-background dark:to-black/20" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#FFBF00]/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Badge className="mb-6 px-6 py-2 text-base bg-primary/20 text-primary border-primary/30 font-black uppercase italic rounded-full">
              <Sparkles className="h-4 w-4 mr-2" />
              AI-Powered Recruitment Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black uppercase italic leading-[0.9] mb-6">
              Hire Smarter.
              <br />
              <span className="text-gradient">Faster.</span>
              <br />
              Across Africa & The Gulf
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-medium">
              AI-powered recruitment, workforce management, candidate verification, and international hiring solutions — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-black text-[#FFBF00] hover:bg-zinc-900 rounded-full px-10 h-14 font-black text-lg shadow-2xl border-2 border-black">
                <Link to="/register">Start Hiring <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-10 h-14 font-black text-lg border-2">
                <Link to="/post-job">Post a Job</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full px-10 h-14 font-black text-lg">
                <Link to="/contact">Contact Sales <ChevronRight className="ml-1 h-5 w-5" /></Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-primary">{stat.value}</div>
                <div className="text-sm font-bold text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING TOGGLE + CARDS ─── */}
      <section className="py-24" id="pricing">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-black uppercase italic mb-4">
              Choose Your <span className="text-primary">Plan</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-medium">
              Scale your hiring with the right tools. All plans include a 14-day free trial. No credit card required.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-16">
            <Tabs value={billing} onValueChange={setBilling} className="w-full max-w-2xl">
              <TabsList className="grid grid-cols-4 h-auto p-1.5 bg-muted rounded-2xl">
                {billingModes.map((mode) => (
                  <TabsTrigger key={mode.value} value={mode.value} className="rounded-xl py-3 text-sm font-black data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary">
                    {mode.label}
                    {mode.value === "annual" && (
                      <Badge className="ml-2 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">Save ~17%</Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 xl:gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-primary text-primary-foreground border-primary px-6 py-1.5 text-sm font-black uppercase italic shadow-lg">
                      <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <div className={`relative h-full rounded-3xl border-2 ${plan.popular ? "border-primary shadow-2xl shadow-primary/20" : "border-border"} bg-background p-8 flex flex-col card-hover ${plan.popular ? "scale-[1.02] lg:scale-105" : ""}`}>
                  {plan.popular && <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />}

                  <div className="relative z-10">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${plan.color} text-white font-black text-sm mb-6`}>
                      {i === 0 && <Building2 className="h-4 w-4" />}
                      {i === 1 && <TrendingUpIcon className="h-4 w-4" />}
                      {i === 2 && <Globe className="h-4 w-4" />}
                      {i === 3 && <Medal className="h-4 w-4" />}
                      {plan.name}
                    </div>

                    <div className="mb-2">
                      <span className="text-5xl font-black">${getPrice(plan)}</span>
                      <span className="text-muted-foreground font-bold ml-1">{getPeriodLabel()}</span>
                    </div>

                    <p className="text-sm text-muted-foreground font-medium mb-8 min-h-[40px]">{plan.desc}</p>

                    <Button
                      asChild
                      size="lg"
                      className={`w-full rounded-full font-black text-base h-14 mb-8 ${
                        plan.popular
                          ? "bg-black text-[#FFBF00] hover:bg-zinc-900 shadow-xl"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      <Link to={plan.href}>{plan.cta} <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                    </Button>

                    <ul className="space-y-3.5 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature.text} className={`flex items-start gap-3 text-sm ${feature.included ? "" : "text-muted-foreground/50"}`}>
                          {feature.included ? (
                            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                          ) : (
                            <div className="h-5 w-5 shrink-0 mt-0.5 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center">
                              <div className="h-2 w-0.5 bg-muted-foreground/20 rotate-45" />
                            </div>
                          )}
                          <span className={feature.included ? "font-semibold" : ""}>{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE COMPARISON TABLE ─── */}
      <section className="py-24 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-black uppercase italic mb-4">
              Full <span className="text-primary">Feature</span> Comparison
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-medium">
              Everything you need to know about what each plan includes.
            </p>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-4 pr-8 font-black text-sm uppercase italic">Feature</th>
                  <th className="text-center py-4 px-4 font-black text-sm uppercase italic">Starter</th>
                  <th className="text-center py-4 px-4 font-black text-sm uppercase italic text-primary">Growth</th>
                  <th className="text-center py-4 px-4 font-black text-sm uppercase italic">Workforce</th>
                  <th className="text-center py-4 px-4 font-black text-sm uppercase italic">Suite</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((group) => (
                  <>
                    <tr key={group.category} className="border-b border-border/50">
                      <td colSpan={5} className="py-5 font-black text-base uppercase italic text-primary">{group.category}</td>
                    </tr>
                    {group.items.map((item) => (
                      <tr key={item.name} className="border-b border-border/30 hover:bg-muted/50 transition-colors">
                        <td className="py-3.5 pr-8 text-sm font-medium">{item.name}</td>
                        <td className="text-center py-3.5 px-4">{renderCell(item.starter)}</td>
                        <td className="text-center py-3.5 px-4">{renderCell(item.growth)}</td>
                        <td className="text-center py-3.5 px-4">{renderCell(item.workforce)}</td>
                        <td className="text-center py-3.5 px-4">{renderCell(item.suite)}</td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── AI FEATURES ─── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge className="mb-4 px-5 py-1.5 bg-primary/10 text-primary border-primary/20 font-black uppercase italic rounded-full">
              <BrainCircuit className="h-4 w-4 mr-2" />
              AI Recruitment Intelligence
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-black uppercase italic mb-4">
              Powered by <span className="text-gradient">Artificial Intelligence</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
              Our AI engine automates the entire recruitment lifecycle — from job description generation to candidate ranking and fraud detection.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-6 card-hover"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-black text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VERIFICATION SYSTEM ─── */}
      <section className="py-24 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[#FFBF00]/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge className="mb-4 px-5 py-1.5 bg-[#FFBF00]/10 text-[#FFBF00] border-[#FFBF00]/20 font-black uppercase italic rounded-full">
              <Shield className="h-4 w-4 mr-2" />
              Verified Talent Access
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-black uppercase italic mb-4">
              Trust Through <span className="text-[#FFBF00]">Verification</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto font-medium">
              Every candidate on our platform goes through rigorous identity, credential, and skill verification.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {verificationFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-6 card-hover"
              >
                <div className="h-12 w-12 rounded-xl bg-[#FFBF00]/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-[#FFBF00]" />
                </div>
                <h3 className="font-black text-lg mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-white/60 font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PAYMENT METHODS ─── */}
      <section className="py-16 border-y border-border">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-black uppercase italic text-muted-foreground mb-8 tracking-widest">
            Supported Payment Methods
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {paymentMethods.map((method) => (
              <div key={method.name} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border font-black text-sm">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black">
                  {method.logo}
                </div>
                {method.name}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6 font-medium">
            <Lock className="h-3 w-3 inline mr-1" />
            Secure payments powered by Stripe & Flutterwave. Multi-currency support: USD, QAR, UGX, KES, AED.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#FFBF00] via-[#FFBF00] to-amber-500 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-black/5 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <Badge className="mb-6 px-6 py-2 bg-black/10 text-black border-black/20 font-black uppercase italic rounded-full text-base">
                <Rocket className="h-4 w-4 mr-2" />
                Start Hiring Today
              </Badge>
              <h2 className="text-4xl md:text-6xl font-heading font-black uppercase italic mb-6 text-black">
                Ready to Transform Your <br />
                <span className="text-white">Recruitment?</span>
              </h2>
              <p className="text-lg text-black/70 max-w-2xl mx-auto mb-10 font-bold">
                Join 300+ employers across Africa and the Gulf who are already using KeFeL Jobs to find, verify, and hire top talent.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="bg-black text-[#FFBF00] hover:bg-zinc-900 rounded-full px-12 h-16 font-black text-xl shadow-2xl border-2 border-black">
                  <Link to="/register">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full px-12 h-16 font-black text-xl text-black hover:bg-black/10 border-2 border-black/30">
                  <Link to="/contact">Talk to Sales</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  )
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function renderCell(value: boolean | string) {
  if (typeof value === "boolean") {
    return value
      ? <Check className="h-5 w-5 mx-auto text-primary" />
      : <div className="h-5 w-5 mx-auto rounded-full border-2 border-muted-foreground/20 flex items-center justify-center"><div className="h-2.5 w-0.5 bg-muted-foreground/20 rotate-45" /></div>
  }
  return <span className="font-black text-sm">{value}</span>
}
