import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import { Building2, MapPin, Users, ChevronRight, Star, Verified, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const topCompanies = [
  { name: "QatarEnergy", industry: "Oil & Gas", positions: 8, location: "Doha", color: "from-purple-600 to-purple-800", size: "20,000+", logo: "https://logo.clearbit.com/qatarenergy.qa", careerUrl: "https://www.qatarenergy.qa/en/Careers/Pages/default.aspx" },
  { name: "Qatar Airways", industry: "Aviation", positions: 15, location: "Doha", color: "from-red-600 to-red-800", size: "40,000+", logo: "https://logo.clearbit.com/qatarairways.com", careerUrl: "https://careers.qatarairways.com/" },
  { name: "Ooredoo Qatar", industry: "Telecom", positions: 5, location: "Lusail", color: "from-blue-500 to-blue-700", size: "5,000+", logo: "https://logo.clearbit.com/ooredoo.qa", careerUrl: "https://careers.ooredoo.com/" },
  { name: "Hamad Medical", industry: "Healthcare", positions: 12, location: "Doha", color: "from-emerald-500 to-emerald-700", size: "25,000+", logo: "https://logo.clearbit.com/hamad.qa", careerUrl: "https://www.hamad.qa/EN/Careers/Pages/default.aspx" },
  { name: "Nakilat", industry: "Logistics", positions: 4, location: "Doha", color: "from-cyan-500 to-cyan-700", size: "3,000+", logo: "https://logo.clearbit.com/nakilat.com", careerUrl: "https://www.nakilat.com/careers/" },
  { name: "Ashghal", industry: "Construction", positions: 6, location: "Doha", color: "from-amber-500 to-amber-700", size: "10,000+", logo: "https://logo.clearbit.com/ashghal.gov.qa", careerUrl: "https://www.ashghal.gov.qa/en/Careers/" },
  { name: "Qatar Foundation", industry: "Education", positions: 7, location: "Al Rayyan", color: "from-teal-500 to-teal-700", size: "8,000+", logo: "https://logo.clearbit.com/qf.org.qa", careerUrl: "https://www.qf.org.qa/careers" },
  { name: "Snoonu", industry: "Technology", positions: 3, location: "Doha", color: "from-orange-500 to-orange-700", size: "500+", logo: "https://logo.clearbit.com/snoonu.com", careerUrl: "https://snoonu.com/careers" },
];

const CompanyLogo = ({ company }: { company: any }) => {
  const [error, setError] = useState(false);
  return (
    <div className={cn(
      "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0 transition-transform duration-300 group-hover:scale-110 overflow-hidden",
      company.color
    )}>
      {!error && company.logo ? (
        <img 
          src={company.logo} 
          alt={company.name} 
          className="w-full h-full object-cover bg-white" 
          onError={() => setError(true)}
        />
      ) : (
        company.name.charAt(0)
      )}
    </div>
  );
};

export function TopCompaniesGrid() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge className="mb-3 bg-blue-500/10 text-blue-600 border-blue-500/20 rounded-full text-xs font-medium dark:text-blue-400">
              <Building2 className="h-3 w-3 mr-1" /> Top Qatar Employers
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-black">
              Leading <span className="text-gradient">Qatar</span> Companies
            </h2>
          </div>
          <Button variant="ghost" asChild className="hidden sm:flex gap-1 text-sm rounded-full">
            <Link href="/jobs">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {topCompanies.map((company, i) => (
            <motion.a
              href={company.careerUrl}
              target="_blank"
              rel="noopener noreferrer"
              key={company.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="group relative rounded-2xl border border-border/60 bg-card p-4 cursor-pointer card-hover block"
            >
              <div className="flex items-center gap-3 mb-3">
                <CompanyLogo company={company} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold truncate">{company.name}</p>
                    <Verified className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">{company.industry}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {company.location}</p>
                <p className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {company.size} employees</p>
              </div>

              <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full font-medium">
                  <Briefcase className="h-3 w-3 mr-1" /> {company.positions} open
                </Badge>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
