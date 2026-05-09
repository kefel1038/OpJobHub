import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Loader2, SlidersHorizontal, ChevronDown, ChevronUp,
  Search, X, ArrowUp, Clock, Bell, ShieldCheck, Sparkles, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Footer } from "@/components/layout/Footer";

export default function Jobs() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalJobs: number; recentJobs: number }>({ totalJobs: 0, recentJobs: 0 });

  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [jobType, setJobType] = useState("");
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const [filterMobileOpen, setFilterMobileOpen] = useState(false);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  const [sortBy, setSortBy] = useState<"newest" | "match" | "salary">("newest");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showJobAlerts, setShowJobAlerts] = useState(false);
  const pageSize = 15;

  useEffect(() => {
    Promise.all([
      api.listJobs(),
      api.searchStats().catch(() => ({ totalJobs: 0, recentJobs: 0 })),
    ])
      .then(([jobs, s]) => {
        setAllJobs(jobs);
        setStats(s);
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
          j.company.toLowerCase().includes(q) ||
          (j.description || "").toLowerCase().includes(q) ||
          (j.skills || []).some((s) => s.toLowerCase().includes(q)) ||
          (j.industry || "").toLowerCase().includes(q),
      );
    }
    if (locationQuery) {
      const l = locationQuery.toLowerCase();
      result = result.filter((j) => j.location.toLowerCase().includes(l));
    }
    if (jobType) {
      result = result.filter((j) => (j.employmentType || "Full-Time").toLowerCase() === jobType.toLowerCase());
    }

    if (filters.locations.length > 0) {
      result = result.filter((j) =>
        filters.locations.some((loc) => j.location.toLowerCase().includes(loc.toLowerCase()))
      );
    }
    if (filters.categories.length > 0) {
      result = result.filter((j) =>
        filters.categories.some((cat) =>
          (j.industry || j.title).toLowerCase().includes(cat.toLowerCase().slice(0, 4))
        )
      );
    }
    if (filters.workTypes.length > 0) {
      result = result.filter((j) => {
        const wt = j.isRemote ? "Remote" : "On-site";
        return filters.workTypes.some((fw) => wt.toLowerCase().includes(fw.toLowerCase()));
      });
    }
    if (filters.skills.length > 0) {
      result = result.filter((j) =>
        filters.skills.some((s) => (j.skills || []).some((js) => js.toLowerCase().includes(s.toLowerCase())))
      );
    }
    if (filters.visaSponsored) {
      result = result.filter((j) => j.visaSponsored === true);
    }
    if (filters.isRemote) {
      result = result.filter((j) => j.isRemote === true);
    }
    if (filters.isUrgent) {
      result = result.filter((j) => j.isUrgent === true);
    }
    if (filters.aiMatchScore > 0) {
      result = result.filter((j) => (j.aiMatchScore ?? 0) >= filters.aiMatchScore);
    }
    if (filters.salaryRange[0] > 0) {
      result = result.filter((j) => (j.salaryMax ?? 999999) >= filters.salaryRange[0]);
    }

    switch (sortBy) {
      case "match":
        result.sort((a, b) => (b.aiMatchScore ?? 0) - (a.aiMatchScore ?? 0));
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
  const hasMore = paginatedJobs.length < filtered.length;

  const handleSearch = useCallback(() => setCurrentPage(1), []);
  const loadMore = useCallback(() => setCurrentPage((prev) => prev + 1), []);

  const handleSelectJob = useCallback((job: Job) => {
    setSelectedJob(job);
    setDetailPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setDetailPanelOpen(false);
    setTimeout(() => setSelectedJob(null), 300);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const now = new Date();
  const qatarTime = now.toLocaleString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "Asia/Qatar",
  });

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

      <div className="relative">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-heading font-black">
                  {loading ? "Loading jobs..." : `${filtered.length} Jobs in Qatar`}
                </h2>
                {!loading && filtered.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-xs px-3 py-1">
                    Updated {qatarTime}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                {searchQuery && <span>"{searchQuery}"</span>}
                {locationQuery && <span>in {locationQuery}</span>}
                {stats.recentJobs > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" />
                    {stats.recentJobs} new today
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-9 gap-1.5"
                onClick={() => setShowJobAlerts(true)}
              >
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Job Alerts</span>
              </Button>
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
                <ChevronDown className="h-3.5 w-3.5" />
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
                    Try adjusting your search terms or filters to find more opportunities in Qatar.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => { setSearchQuery(""); setLocationQuery(""); setFilters(defaultFilterState); }}
                      className="rounded-full"
                    >
                      Clear all filters
                    </Button>
                    <Button variant="default" className="rounded-full gap-2" onClick={() => setShowJobAlerts(true)}>
                      <Bell className="h-4 w-4" /> Get Job Alerts
                    </Button>
                  </div>
                </div>
              ) : (
                <>
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
                        Showing all {filtered.length} Qatar jobs
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

      <JobDetailPanel job={selectedJob} open={detailPanelOpen} onClose={handleClosePanel} />
      <AIChatbot />

      <AnimatePresence>
        {showJobAlerts && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowJobAlerts(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background rounded-2xl border shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">Job Alerts</h3>
                </div>
                <button onClick={() => setShowJobAlerts(false)} className="p-1 rounded-md hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Get notified when new jobs matching your preferences are posted in Qatar.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full h-11 px-4 rounded-xl border border-border/60 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="text"
                  placeholder="Job keywords (e.g., Engineer, Driver)"
                  className="w-full h-11 px-4 rounded-xl border border-border/60 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select className="w-full h-11 px-4 rounded-xl border border-border/60 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option>Daily updates</option>
                  <option>Weekly updates</option>
                  <option>Instant alerts</option>
                </select>
                <Button className="w-full rounded-xl h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2">
                  <Bell className="h-4 w-4" /> Subscribe to Alerts
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-6 left-6 z-50 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
