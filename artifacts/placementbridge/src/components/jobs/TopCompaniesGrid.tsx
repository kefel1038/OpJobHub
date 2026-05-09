import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Users, ChevronRight, Star, Verified } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const topCompanies = [
  { name: "Google", industry: "Technology", positions: 12, location: "Mountain View, CA", color: "from-blue-500 to-blue-600", size: "100,000+" },
  { name: "Microsoft", industry: "Technology", positions: 8, location: "Redmond, WA", color: "from-cyan-500 to-blue-600", size: "100,000+" },
  { name: "Apple", industry: "Technology", positions: 15, location: "Cupertino, CA", color: "from-zinc-700 to-zinc-900", size: "100,000+" },
  { name: "Amazon", industry: "Technology", positions: 20, location: "Seattle, WA", color: "from-amber-500 to-orange-600", size: "500,000+" },
  { name: "Meta", industry: "Social Media", positions: 6, location: "Menlo Park, CA", color: "from-blue-600 to-indigo-600", size: "50,000+" },
  { name: "Tesla", industry: "Automotive", positions: 4, location: "Austin, TX", color: "from-red-500 to-red-600", size: "100,000+" },
  { name: "Netflix", industry: "Entertainment", positions: 3, location: "Los Gatos, CA", color: "from-red-600 to-red-800", size: "10,000+" },
  { name: "Spotify", industry: "Music", positions: 5, location: "New York, NY", color: "from-green-500 to-emerald-600", size: "5,000+" },
];

export function TopCompaniesGrid() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge className="mb-3 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full text-xs font-medium">
              <Building2 className="h-3 w-3 mr-1" /> Top Employers
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-black">
              Featured <span className="text-gradient">Companies</span>
            </h2>
          </div>
          <Button variant="ghost" className="hidden sm:flex gap-1 text-sm rounded-full">
            View All <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {topCompanies.map((company, i) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="group relative rounded-2xl border border-border/60 bg-card p-4 cursor-pointer card-hover"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0 transition-transform duration-300",
                  company.color,
                  hoveredIndex === i && "scale-110"
                )}>
                  {company.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold truncate">{company.name}</p>
                    <Verified className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">{company.industry}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> {company.location}
                </p>
                <p className="flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> {company.size} employees
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {company.positions} open positions
                </Badge>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
