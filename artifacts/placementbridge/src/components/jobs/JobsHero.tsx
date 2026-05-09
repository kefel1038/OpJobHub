import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Briefcase, Sparkles, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const trendingTags = [
  "Software Engineer", "Data Scientist", "UI/UX Designer", "Product Manager",
  "DevOps Engineer", "AI/ML Engineer", "Frontend Developer", "Backend Developer"
];

const jobTypes = ["All Types", "Full-Time", "Part-Time", "Contract", "Internship", "Freelance"];

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

  const suggestions = [
    "Senior React Developer", "Full Stack Engineer", "Machine Learning Engineer",
    "Cloud Architect", "Technical Lead", "DevOps Engineer"
  ];

  return (
    <section className="relative min-h-[75vh] flex items-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
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
          className="text-center max-w-4xl mx-auto mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Job Matching
            <span className="hidden sm:inline"> &mdash; 10x faster placement</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-tight mb-6 leading-[0.95]">
            Find Your
            <br />
            <span className="text-gradient">Dream Job</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Discover thousands of curated opportunities powered by AI that matches your skills, experience, and career aspirations.
          </p>
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
                  placeholder="Job title, keyword, or company"
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

              <div className="relative lg:w-56">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Location"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="w-full h-14 pl-11 pr-4 bg-transparent border-0 rounded-xl text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="relative lg:w-48">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full h-14 pl-11 pr-8 bg-transparent border-0 rounded-xl text-base appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {jobTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <Button
                onClick={onSearch}
                size="lg"
                className="h-14 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base gap-2 shadow-lg"
              >
                <Search className="h-5 w-5" />
                Search
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-sm text-muted-foreground font-medium">Trending:</span>
          {trendingTags.slice(0, 6).map((tag) => (
            <button
              key={tag}
              onClick={() => { setSearchQuery(tag); onSearch(); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-primary/10 hover:text-primary transition-all border border-border/50"
            >
              {tag}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
