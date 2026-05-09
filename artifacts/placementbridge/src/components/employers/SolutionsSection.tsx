import { motion } from "framer-motion";
import {
  Briefcase, Users, Globe, Search, Star, Clock,
  Share2, Zap, Building2, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const solutions = [
  {
    icon: Briefcase,
    title: "Permanent Recruitment",
    description: "Find and hire top-tier permanent talent for long-term roles across all industries.",
    color: "from-blue-600 to-blue-400",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Users,
    title: "Bulk Hiring",
    description: "Scale your workforce fast with our bulk hiring solution. Hire 50+ candidates simultaneously.",
    color: "from-indigo-600 to-indigo-400",
    bgColor: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    icon: Globe,
    title: "International Recruitment",
    description: "Source talent across East Africa and deploy to Gulf countries with full visa support.",
    color: "from-emerald-600 to-emerald-400",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: Building2,
    title: "Workforce Outsourcing",
    description: "Outsource your entire workforce needs with our managed recruitment and deployment services.",
    color: "from-purple-600 to-purple-400",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    icon: Zap,
    title: "Freelance Hiring",
    description: "Access a pool of pre-vetted freelancers and gig workers for project-based work.",
    color: "from-amber-600 to-amber-400",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: Star,
    title: "Executive Search",
    description: "Premium headhunting for C-suite and senior management positions across the Gulf.",
    color: "from-rose-600 to-rose-400",
    bgColor: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    icon: Clock,
    title: "Temporary Staffing",
    description: "Flexible temporary staffing solutions for seasonal peaks and special projects.",
    color: "from-cyan-600 to-cyan-400",
    bgColor: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
  {
    icon: Share2,
    title: "Contract Workforce",
    description: "Build and manage contract workforce teams with end-to-end compliance support.",
    color: "from-orange-600 to-orange-400",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    icon: Search,
    title: "Gig Hiring",
    description: "Quickly connect with skilled gig workers for short-term assignments and projects.",
    color: "from-teal-600 to-teal-400",
    bgColor: "bg-teal-50",
    iconColor: "text-teal-600",
  },
];

export function SolutionsSection() {
  return (
    <section className="py-24 employer-gradient-light relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4 block">Solutions</span>
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
            Complete workforce{" "}
            <span className="text-gradient-blue">solutions</span>
          </h2>
          <p className="text-gray-500 max-w-3xl mx-auto text-lg">
            One platform for all your recruitment needs — from permanent hiring to international workforce deployment.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((solution, i) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-3xl p-8 border border-gray-100 hover:border-blue-200 transition-all duration-500 card-hover"
            >
              <div className={`h-14 w-14 rounded-2xl ${solution.bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <solution.icon className={`h-7 w-7 ${solution.iconColor}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{solution.title}</h3>
              <p className="text-gray-500 leading-relaxed mb-5">{solution.description}</p>
              <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${solution.color} group-hover:w-full transition-all duration-300`} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button asChild className="bg-navy-900 hover:bg-navy-800 text-white rounded-full px-10 h-12 font-bold shadow-xl group">
            <Link href="/post-job">
              View All Solutions
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
