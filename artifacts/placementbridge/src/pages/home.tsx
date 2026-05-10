import { Layout } from "@/components/layout/Layout";
import { Hero } from "@/components/sections/Hero";
import { FeaturedJobs } from "@/components/sections/FeaturedJobs";
import { SplitCTA } from "@/components/sections/SplitCTA";
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
  Globe,
  Search,
  CheckCircle,
  Briefcase
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <Layout>
      <Hero />

      <SplitCTA />

      {/* How it works Section */}
      <section className="py-24 bg-surface overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
              <Target className="h-3 w-3 mr-1" />
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-white">
              How <span className="text-gradient">KeFeL</span> works for <br className="hidden md:block" /> companies
            </h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/30 via-purple-500/20 to-transparent -translate-x-1/2 hidden md:block" />

            <div className="space-y-24 relative">
              <TimelineStep
                number={1}
                title="Specify requirements"
                description="Sign to your dashboard to specify your hiring requirements and skills needs in a very simple and easy steps."
                image="https://images.unsplash.com/photo-1454165833767-027ffea9e78a?auto=format&fit=crop&q=80&w=400"
              />
              <TimelineStep
                number={2}
                side="left"
                title="Evaluate top candidates"
                description="Defining your hiring needs and criteria helps us find what you're looking for. We trust in our data-driven approach. It empowers you to make an unbiased decision and hire."
                image="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"
              />
              <TimelineStep
                number={3}
                title="Hire the best talent"
                description="Hiring prequalified and carefully screened talent, schedule interviews at your convenience."
                image="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <div className="bg-default border-y border-[#2C2C2E]">
        <FeaturedJobs />
      </div>

      {/* Final CTA Strip */}
      <section className="py-24 bg-surface">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-blue-600/20 rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden group border border-[#2C2C2E]">
            <div className="absolute inset-0 bg-grid-white opacity-20 pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-8 text-white">
                Ready to find your <br /> next success story?
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full px-12 h-16 font-bold text-xl shadow-2xl shadow-blue-600/20">
                  <Link href="/register">Get Started Free</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function TimelineStep({ number, title, description, image, side = "right" }: { number: number; title: string; description: string; image: string; side?: "left" | "right" }) {
  return (
    <div className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${side === "left" ? "md:flex-row-reverse" : ""}`}>
      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, x: side === "right" ? -30 : 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold shrink-0 text-sm">
              {number}
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white">{title}</h3>
          </div>
          <p className="text-gray-400 leading-relaxed font-medium">
            {description}
          </p>
        </motion.div>
      </div>

      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl overflow-hidden border border-[#2C2C2E] bg-surface"
        >
          <img src={image} alt={title} className="w-full aspect-video object-cover opacity-90" />
        </motion.div>
      </div>
    </div>
  );
}
