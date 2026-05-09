import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Loader2, SlidersHorizontal, ChevronDown, ChevronUp,
  Bell, Download, Search, Filter, X, ArrowUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { api, type Job } from "@/lib/api";
import { JobsNavbar } from "@/components/jobs/JobsNavbar";
import { JobsHero } from "@/components/jobs/JobsHero";
import { JobsFilterSidebar, defaultFilterState, type FilterState } from "@/components/jobs/JobsFilterSidebar";
import { JobCard } from "@/components/jobs/JobCard";
import { JobDetailPanel } from "@/components/jobs/JobDetailPanel";
import { FeaturedJobsCarousel } from "@/components/jobs/FeaturedJobsCarousel";
import { TopCompaniesGrid } from "@/components/jobs/TopCompaniesGrid";
import { AICareerInsights } from "@/components/jobs/AICareerInsights";
import { AIChatbot } from "@/components/jobs/AIChatbot";
import { ResumeUploadCTA } from "@/components/jobs/ResumeUploadCTA";

interface ExtendedJob extends Job {
  aiMatch?: number;
  atsScore?: number;
  skills?: string[];
  workType?: string;
  salaryMin?: number;
  salaryMax?: number;
  logo?: string;
}

export default function Jobs() {
  const [allJobs, setAllJobs] = useState<ExtendedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [jobType, setJobType] = useState("All Types");
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const [filterMobileOpen, setFilterMobileOpen] = useState(false);

  const [selectedJob, setSelectedJob] = useState<ExtendedJob | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  const [sortBy, setSortBy] = useState<"newest" | "match" | "salary">("newest");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const jobsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listJobs()
      .then((res) => {
        const enriched = res.map((job) => ({
          ...job,
          aiMatch: Math.floor(Math.random() * 30) + 70,
          atsScore: Math.floor(Math.random() * 20) + 78,
          skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "GraphQL", "PostgreSQL"]
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 4) + 3),
          workType: ["Remote", "Hybrid", "On-site", "Flexible"][Math.floor(Math.random() * 4)],
          salaryMin: Math.floor(Math.random() * 80 + 60) * 1000,
          salaryMax: Math.floor(Math.random() * 100 + 120) * 1000,
        }));
        setAllJobs(enriched);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filtered = useMemo(() => {
    let result = [...allJobs];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q)
      );
    }
    if (locationQuery) {
      const l = locationQuery.toLowerCase();
      result = result.filter((j) => j.location.toLowerCase().includes(l));
    }
    if (jobType !== "All Types") {
      result = result.filter((j) => (j.workType ?? "Full-Time").toLowerCase() === jobType.toLowerCase());
    }
    if (filters.categories.length > 0) {
      result = result.filter((j) =>
        filters.categories.some((c) => j.title.toLowerCase().includes(c.toLowerCase().split(" ")[0]))
      );
    }
    if (filters.workTypes.length > 0) {
      result = result.filter((j) => filters.workTypes.includes(j.workType ?? ""));
    }
    if (filters.experienceLevels.length > 0) {
      result = result.filter((_, i) => i % 3 === 0);
    }
    if (filters.skills.length > 0) {
      result = result.filter((j) =>
        filters.skills.some((s) => (j.skills ?? []).includes(s))
      );
    }
    if (filters.aiMatchScore > 0) {
      result = result.filter((j) => (j.aiMatch ?? 0) >= filters.aiMatchScore);
    }

    switch (sortBy) {
      case "match":
        result.sort((a, b) => (b.aiMatch ?? 0) - (a.aiMatch ?? 0));
        break;
      case "salary":
        result.sort((a, b) => (b.salaryMax ?? 0) - (a.salaryMax ?? 0));
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [allJobs, searchQuery, locationQuery, jobType, filters, sortBy]);

  const paginatedJobs = filtered.slice(0, currentPage * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const hasMore = paginatedJobs.length < filtered.length;

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const loadMore = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  const handleSelectJob = useCallback((job: ExtendedJob) => {
    setSelectedJob(job);
    setDetailPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setDetailPanelOpen(false);
    setTimeout(() => setSelectedJob(null), 300);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <JobsNavbar />

      <JobsHero
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        locationQuery={locationQuery}
        setLocationQuery={setLocationQuery}
        jobType={jobType}
        setJobType={setJobType}
        onSearch={handleSearch}
      />

      <ResumeUploadCTA />

      <FeaturedJobsCarousel />

      <div ref={jobsRef} className="relative">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-black">
                {loading ? "Loading jobs..." : `${filtered.length} Jobs Found`}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery && `"${searchQuery}"`}
                {locationQuery && ` in ${locationQuery}`}
                {filters.categories.length > 0 && ` \u2022 ${filters.categories.length} categories`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden rounded-full h-9 gap-1.5"
                onClick={() => setFilterMobileOpen(true)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </Button>
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5">
                <Filter className="h-3.5 w-3.5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-transparent border-0 text-sm focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="match">Best Match</option>
                  <option value="salary">Highest Salary</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            <JobsFilterSidebar
              filters={filters}
              setFilters={setFilters}
              isMobileOpen={filterMobileOpen}
              setIsMobileOpen={setFilterMobileOpen}
            />

            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border/60 p-5">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-14 w-14 rounded-xl" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <X className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="text-destructive font-medium mb-2">Failed to load jobs</p>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button variant="outline" onClick={() => window.location.reload()} className="rounded-full">
                    Try Again
                  </Button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-bold mb-2">No jobs found</p>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Try adjusting your search terms or filters to find more opportunities.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => { setSearchQuery(""); setLocationQuery(""); setFilters(defaultFilterState); }}
                    className="rounded-full"
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-3">
                      {paginatedJobs.map((job, i) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          index={i}
                          onSelect={handleSelectJob}
                          isSelected={selectedJob?.id === job.id}
                        />
                      ))}
                    </div>
                  </AnimatePresence>

                  {hasMore && (
                    <div className="flex justify-center mt-8">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        className="rounded-full px-8 gap-2"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Load More Jobs
                        <span className="text-xs text-muted-foreground">
                          ({filtered.length - paginatedJobs.length} remaining)
                        </span>
                      </Button>
                    </div>
                  )}

                  {!hasMore && paginatedJobs.length > 0 && (
                    <div className="text-center py-10">
                      <div className="h-px bg-border/60 max-w-xs mx-auto mb-6" />
                      <p className="text-sm text-muted-foreground">
                        Showing all {filtered.length} jobs
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <TopCompaniesGrid />

      <AICareerInsights />

      <JobDetailPanel
        job={selectedJob}
        open={detailPanelOpen}
        onClose={handleClosePanel}
      />

      <AIChatbot />

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-6 left-6 z-50 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="border-t border-border/60 bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <Briefcase className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">KeFeL Jobs</span>
              <span className="hidden sm:inline">&mdash; AI-Powered Career Platform</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
              <span>&copy; {new Date().getFullYear()} KeFeL Media</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
