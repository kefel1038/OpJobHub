import { motion } from "framer-motion";
import {
  Building2, Shield, Car, Hotel, Home,
  Cog, Wifi, Stethoscope, Monitor, Users,
  Briefcase, HardHat, Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

const industries = [
  { icon: HardHat, name: "Construction", color: "from-amber-500 to-orange-500", bgColor: "bg-amber-50", count: "2,400+" },
  { icon: Shield, name: "Security", color: "from-blue-600 to-blue-400", bgColor: "bg-blue-50", count: "1,800+" },
  { icon: Car, name: "Drivers", color: "from-emerald-500 to-emerald-400", bgColor: "bg-emerald-50", count: "3,200+" },
  { icon: Hotel, name: "Hospitality", color: "from-purple-500 to-purple-400", bgColor: "bg-purple-50", count: "1,600+" },
  { icon: Home, name: "Domestic Workers", color: "from-pink-500 to-pink-400", bgColor: "bg-pink-50", count: "2,100+" },
  { icon: Cog, name: "Engineering", color: "from-cyan-500 to-cyan-400", bgColor: "bg-cyan-50", count: "950+" },
  { icon: Wifi, name: "Telecom", color: "from-indigo-500 to-indigo-400", bgColor: "bg-indigo-50", count: "780+" },
  { icon: Stethoscope, name: "Healthcare", color: "from-rose-500 to-rose-400", bgColor: "bg-rose-50", count: "1,200+" },
  { icon: Monitor, name: "IT & Software", color: "from-blue-500 to-indigo-400", bgColor: "bg-blue-50", count: "650+" },
  { icon: Users, name: "Remote Workers", color: "from-teal-500 to-teal-400", bgColor: "bg-teal-50", count: "890+" },
  { icon: Briefcase, name: "Freelancers", color: "from-violet-500 to-violet-400", bgColor: "bg-violet-50", count: "1,500+" },
  { icon: Truck, name: "Logistics", color: "from-orange-500 to-orange-400", bgColor: "bg-orange-50", count: "1,100+" },
];

export function IndustryHiringSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 pointer-events-none" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4 block">
            Industry Specialization
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
            Hire across every{" "}
            <span className="text-gradient-blue">industry</span>
          </h2>
          <p className="text-gray-500 max-w-3xl mx-auto text-lg">
            Specialized recruitment for 12+ industries with pre-screened, verified talent pools.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {industries.map((industry, i) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="group bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-blue-200 transition-all duration-300 card-hover cursor-pointer"
            >
              <div className={`h-12 w-12 rounded-xl ${industry.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <industry.icon className={`h-6 w-6 ${industry.color.replace("from-", "text-").split(" ")[0].replace("to-", "")}`} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{industry.name}</h3>
              <p className="text-sm text-gray-400">{industry.count} candidates</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button asChild className="bg-navy-900 hover:bg-navy-800 text-white rounded-full px-10 h-12 font-bold shadow-xl group">
            <Link href="/jobs">
              Browse All Industries
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
