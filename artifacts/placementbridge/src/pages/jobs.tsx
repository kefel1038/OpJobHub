import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Loader2, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  Search, X, ArrowUp, Clock, Bell, ShieldCheck, Sparkles, Users, AlertCircle, RefreshCw, WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { type Job } from "@/lib/api";
import { useJobSearch, type JobSearchApiParams, usePrefetchJobSearch } from "@/hooks/use-jobs-query";
import { useDebounce } from "@/hooks/use-debounce";
import { JobsNavbar } from "@/components/jobs/JobsNavbar";
import { JobsHero } from "@/components/jobs/JobsHero";
import { JobsFilterSidebar } from "@/components/jobs/JobsFilterSidebar";
import { JobCard } from "@/components/jobs/JobCard";
import { JobDetailPanel } from "@/components/jobs/JobDetailPanel";
import { JobListSkeleton } from "@/components/jobs/JobListSkeleton";
import { EmptyJobState } from "@/components/jobs/EmptyJobState";
import { RecommendedJobsRail } from "@/components/jobs/RecommendedJobsRail";
import { SavedSearches } from "@/components/jobs/SavedSearches";
import { FeaturedJobsCarousel } from "@/components/jobs/FeaturedJobsCarousel";
import { TopCompaniesGrid } from "@/components/jobs/TopCompaniesGrid";
import { AICareerInsights } from "@/components/jobs/AICareerInsights";
import { AIChatbot } from "@/components/jobs/AIChatbot";
import { ResumeUploadCTA } from "@/components/jobs/ResumeUploadCTA";
import { Footer } from "@/components/layout/Footer";

const PAGE_SIZE = 15;

const JOB_TABS = [
  { id: "", label: "All Jobs" },
  { id: "Engineering", label: "Engineering" },
  { id: "Driver", label: "Driver" },
  { id: "Hospitality", label: "Hospitality" },
  { id: "Oil & Gas", label: "Oil & Gas" },
  { id: "Security", label: "Security" },
  { id: "Healthcare", label: "Healthcare" },
  { id: "IT", label: "IT" },
  { id: "Construction", label: "Construction" },
  { id: "Nursing", label: "Nursing" },
];

interface URLParams {
  q: string;
  location: string;
  employmentType: string;
  categories: string;
  locations: string;
  experienceLevels: string;
  workTypes: string;
  skills: string;
  nationalities: string;
  datePosted: string;
  salaryMin: string;
  salaryMax: string;
  visaSponsored: boolean;
  isRemote: boolean;
  isUrgent: boolean;
  aiMatchScore: string;
  source: string;
  sort: string;
  page: number;
}

function parseURLSearchParams(sp: URLSearchParams): URLParams {
  return {
    q: sp.get("q") || "",
    location: sp.get("location") || "",
    employmentType: sp.get("type") || "",
    categories: sp.get("categories") || "",
    locations: sp.get("locations") || "",
    experienceLevels: sp.get("exp") || "",
    workTypes: sp.get("workType") || "",
    skills: sp.get("skills") || "",
    nationalities: sp.get("nationality") || "",
    datePosted: sp.get("posted") || "",
    salaryMin: sp.get("salaryMin") || "",
    salaryMax: sp.get("salaryMax") || "",
    visaSponsored: sp.get("visa") === "true",
    isRemote: sp.get("remote") === "true",
    isUrgent: sp.get("urgent") === "true",
    aiMatchScore: sp.get("matchScore") || "",
    source: sp.get("source") || "",
    sort: sp.get("sort") || "newest",
    page: parseInt(sp.get("page") || "1", 10),
  };
}

function paramsToAPI(p: URLParams, debouncedQ: string): JobSearchApiParams {
  const api: JobSearchApiParams = {
    sort: p.sort,
    page: p.page,
    limit: PAGE_SIZE,
  };
  if (debouncedQ) api.q = debouncedQ;
  if (p.location) api.location = p.location;
  if (p.categories) api.categories = p.categories;
  if (p.employmentType) api.employmentType = p.employmentType;
  if (p.locations) api.locations = p.locations;
  if (p.experienceLevels) api.experienceLevels = p.experienceLevels;
  if (p.workTypes) api.workTypes = p.workTypes;
  if (p.skills) api.skills = p.skills;
  if (p.nationalities) api.nationalities = p.nationalities;
  if (p.datePosted) api.datePosted = p.datePosted;
  if (p.salaryMin) api.salaryMin = Number(p.salaryMin);
  if (p.salaryMax) api.salaryMax = Number(p.salaryMax);
  if (p.visaSponsored) api.visaSponsored = true;
  if (p.isRemote) api.isRemote = true;
  if (p.isUrgent) api.isUrgent = true;
  if (p.source) api.source = p.source;
  if (p.aiMatchScore) api.aiMatchScore = Number(p.aiMatchScore);
  return api;
}



export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => parseURLSearchParams(searchParams), [searchParams]);

  const debouncedQ = useDebounce(params.q, 400);

  const apiParams = useMemo(() => paramsToAPI(params, debouncedQ), [params, debouncedQ]);

  const { data, isLoading, isFetching, error } = useJobSearch(apiParams);
  const jobs = data?.jobs ?? [];
  const pagination = data?.pagination ?? { page: 1, total: 0, totalPages: 0, hasMore: false, limit: PAGE_SIZE };

  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const staleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (!staleTimerRef.current) {
        staleTimerRef.current = setTimeout(() => {
          setLoadingTimedOut(true);
        }, 10000);
      }
    } else {
      if (staleTimerRef.current) {
        clearTimeout(staleTimerRef.current);
        staleTimerRef.current = null;
      }
      setLoadingTimedOut(false);
    }
    return () => {
      if (staleTimerRef.current) {
        clearTimeout(staleTimerRef.current);
        staleTimerRef.current = null;
      }
    };
  }, [isLoading]);

  const setParams = useCallback((updates: Record<string, string | number | boolean | null | undefined>) => {
    setSearchParams(prev => {
      const sp = new URLSearchParams(prev);
      let shouldResetPage = true;
      for (const key of Object.keys(updates)) {
        if (key === "page") { shouldResetPage = false; break; }
      }
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "" || value === false) {
          sp.delete(key);
        } else {
          sp.set(key, String(value));
        }
      }
      if (shouldResetPage) sp.delete("page");
      return sp;
    }, { replace: true });
  }, [setSearchParams]);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [filterMobileOpen, setFilterMobileOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showJobAlerts, setShowJobAlerts] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSelectJob = useCallback((job: Job) => {
    setSelectedJob(job);
    setDetailPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setDetailPanelOpen(false);
    setTimeout(() => setSelectedJob(null), 300);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const hasActiveFilters = useMemo(() => {
    return !!(params.q || params.location || params.categories || params.employmentType ||
      params.locations || params.experienceLevels || params.workTypes || params.skills ||
      params.nationalities || params.datePosted || params.salaryMin || params.salaryMax ||
      params.visaSponsored || params.isRemote || params.isUrgent || params.aiMatchScore ||
      params.source);
  }, [params]);

  const clearAllFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const handleTabClick = useCallback((tabId: string) => {
    setParams({ categories: tabId || null });
  }, [setParams]);

  const activeTab = params.categories || "";

  const now = new Date();
  const qatarTime = now.toLocaleString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "Asia/Qatar",
  });

  const totalPages = pagination.totalPages;
  const currentPage = params.page;

  function renderPagination() {
    if (totalPages <= 1) return null;
    const pages: (number | "...")[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) { start = 2; end = Math.min(maxVisible - 1, totalPages - 1); }
      if (currentPage >= totalPages - 2) { start = Math.max(2, totalPages - maxVisible + 2); end = totalPages - 1; }
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return (
      <div className="flex items-center justify-center gap-1.5 mt-8">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => setParams({ page: currentPage - 1 })}
          className="rounded-full h-9 px-3"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Prev</span>
        </Button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-2 text-muted-foreground text-sm">...</span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setParams({ page: p })}
              className="rounded-full h-9 w-9 p-0"
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => setParams({ page: currentPage + 1 })}
          className="rounded-full h-9 px-3"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const loadMore = () => {
    if (pagination.hasMore) {
      setParams({ page: currentPage + 1 });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <JobsNavbar />

      <JobsHero
        q={params.q}
        onQChange={(q) => setParams({ q: q || null })}
        location={params.location}
        onLocationChange={(loc) => setParams({ location: loc || null })}
      />

      <ResumeUploadCTA />

      <FeaturedJobsCarousel />

      <div className="relative">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-heading font-black">
                  {isLoading ? "Loading jobs..." : `${pagination.total.toLocaleString()} Jobs in Qatar`}
                </h2>
                {!isLoading && pagination.total > 0 && (
                  <Badge variant="secondary" className="rounded-full text-xs px-3 py-1">
                    Updated {qatarTime}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                {params.q && <span>"{params.q}"</span>}
                {params.location && <span>in {params.location}</span>}
                {!isLoading && !isFetching && pagination.total > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" />
                    Page {currentPage} of {totalPages}
                  </span>
                )}
                {isFetching && !isLoading && (
                  <span className="flex items-center gap-1 text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating...
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SavedSearches 
                currentParams={Object.fromEntries(
                  Object.entries(params).filter(([_, v]) => v != null && v !== '').map(([k, v]) => [k, String(v)])
                )} 
                onApplySearch={(newParams) => {
                  Object.entries(newParams).forEach(([key, value]) => {
                    setParams({ [key]: value });
                  });
                }} 
              />
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
                  value={params.sort}
                  onChange={(e) => setParams({ sort: e.target.value })}
                  className="bg-transparent border-0 text-sm focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="salary">Highest Salary</option>
                  <option value="views">Most Viewed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            <JobsFilterSidebar
              params={params}
              setParams={setParams}
              isMobileOpen={filterMobileOpen}
              setIsMobileOpen={setFilterMobileOpen}
            />

            <div className="flex-1 min-w-0">
              <div className="overflow-x-auto scrollbar-thin -mx-4 px-4 mb-6">
                <div className="flex gap-1.5 min-w-max pb-1">
                  {JOB_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-card text-muted-foreground hover:text-foreground border-border/60 hover:border-primary/30"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <RecommendedJobsRail 
                currentParams={params} 
                onSelect={handleSelectJob} 
              />

              {isLoading && !loadingTimedOut ? (
                <JobListSkeleton count={5} />
              ) : error || loadingTimedOut ? (
                <div className="text-center py-20">
                  <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    {loadingTimedOut ? <WifiOff className="h-8 w-8 text-destructive" /> : <AlertCircle className="h-8 w-8 text-destructive" />}
                  </div>
                  <p className="text-destructive font-medium mb-2">
                    {loadingTimedOut ? "Taking too long to load" : "Failed to load jobs"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    {loadingTimedOut
                      ? "The server is taking longer than expected. This may be due to high demand or a temporary network issue."
                      : (error as Error)?.message || "Something went wrong while fetching jobs."
                    }
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" onClick={() => { setLoadingTimedOut(false); window.location.reload(); }} className="rounded-full gap-2">
                      <RefreshCw className="h-4 w-4" /> Try Again
                    </Button>
                    <Button variant="default" className="rounded-full gap-2" onClick={() => setShowJobAlerts(true)}>
                      <Bell className="h-4 w-4" /> Get Job Alerts
                    </Button>
                  </div>
                </div>
              ) : jobs.length === 0 ? (
                <EmptyJobState
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={clearAllFilters}
                />
              ) : (
                <>
                  <div className="space-y-3">
                    {jobs.map((job, i) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        index={i}
                        onSelect={handleSelectJob}
                        isSelected={selectedJob?.id === job.id}
                      />
                    ))}
                  </div>

                  {renderPagination()}

                  {/* Mobile Load More */}
                  {pagination.hasMore && (
                    <div className="flex justify-center mt-4 lg:hidden">
                      <Button 
                        variant="outline" 
                        onClick={loadMore}
                        className="rounded-full px-8"
                      >
                        Load More Jobs
                      </Button>
                    </div>
                  )}

                  {pagination.total > 0 && (
                    <div className="text-center py-6">
                      <div className="h-px bg-border/60 max-w-xs mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Showing page {currentPage} of {totalPages} ({pagination.total.toLocaleString()} total jobs)
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

      <JobDetailPanel job={selectedJob as any} open={detailPanelOpen} onClose={handleClosePanel} />
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
