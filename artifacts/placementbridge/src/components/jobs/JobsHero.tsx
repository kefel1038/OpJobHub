import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Briefcase, Sparkles, TrendingUp, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

const trendingTags = [
  "Driver", "Engineer", "Nurse", "Security Guard", "Sales Executive",
  "Accountant", "Electrician", "Hotel Staff", "IT Support", "Construction Worker"
];

const qatarLocations = [
  "Doha", "Lusail", "Al Wakrah", "Al Rayyan", "Industrial Area", "Al Khor"
];

const quickCategories = [
  { label: "Engineering", icon: "⚙️" },
  { label: "Driver", icon: "🚗" },
  { label: "Hospitality", icon: "🏨" },
  { label: "Oil & Gas", icon: "🛢️" },
  { label: "Security", icon: "🛡️" },
  { label: "Healthcare", icon: "🏥" },
  { label: "IT", icon: "💻" },
  { label: "Construction", icon: "🏗️" },
  { label: "Factory", icon: "🏭" },
  { label: "Nursing", icon: "👩‍⚕️" },
];

interface JobsHeroProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  locationQuery: string;
  setLocationQuery: (q: string) => void;
  jobType: string;
  setJobType: (t: string) => void;
  onSearch: () => void;
}

export function JobsHero({ searchQuery, setSearchQuery, locationQuery, setLocationQuery, jobType, setJobType, onSearch }: JobsHeroProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stats, setStats] = useState<{ totalJobs: number; recentJobs: number }>({ totalJobs: 0, recentJobs: 0 });

  useEffect(() => {
    api.searchStats().then((s) => {
      setStats({ totalJobs: s.totalJobs, recentJobs: s.recentJobs });
    }).catch(() => {});
  }, []);

  const suggestions = [
    "Driver with valid QID", "Senior Electrical Engineer", "Hotel Receptionist",
    "Safety Officer", "Graphic Designer", "Accountant - Arabic Speaker"
  ];

  const now = new Date();
  const qatarTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Qatar" }));
  const lastUpdated = qatarTime.toLocaleString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Fresh Qatar Jobs Updated Daily at 08:00 AM
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-tight mb-4 leading-[0.95]">
            Find Fresh Qatar
            <br />
            <span className="text-gradient">Jobs Daily</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed mb-4">
            Thousands of verified jobs from Doha, Lusail, Al Wakrah, and across Qatar. 
            Aggregated daily from trusted sources.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{stats.totalJobs.toLocaleString()}</span>
              <span>active jobs</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>Updated today</span>
              <span className="font-semibold text-foreground">{lastUpdated}</span>
              <span>Qatar time</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{stats.recentJobs}</span>
              <span>new today</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-2 shadow-2xl glow-yellow">
            <div className="flex flex-col lg:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Job title, keyword, or company..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full h-14 pl-11 pr-4 bg-transparent border-0 rounded-xl text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {showSuggestions && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border bg-background shadow-2xl z-50 overflow-hidden">
                    {suggestions.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).map((s) => (
                      <button
                        key={s}
                        onMouseDown={() => { setSearchQuery(s); setShowSuggestions(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-3 transition-colors"
                      >
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative lg:w-52">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="w-full h-14 pl-11 pr-8 bg-transparent border-0 rounded-xl text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">All Qatar</option>
                  {qatarLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="relative lg:w-44">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full h-14 pl-11 pr-8 bg-transparent border-0 rounded-xl text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">All Types</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>

              <Button
                onClick={onSearch}
                size="lg"
                className="h-14 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base gap-2 shadow-lg"
              >
                <Search className="h-5 w-5" />
                Search Jobs
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6"
        >
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground font-medium mr-1">Trending:</span>
            {trendingTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                onClick={() => { setSearchQuery(tag); onSearch(); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-primary/10 hover:text-primary transition-all border border-border/50"
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground font-medium mr-1">Quick Search:</span>
            {quickCategories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => { setSearchQuery(cat.label); onSearch(); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/5 hover:bg-primary/15 text-primary hover:text-primary transition-all border border-primary/10"
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
