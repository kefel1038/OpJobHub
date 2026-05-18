import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categories = [
  "Construction", "Oil & Gas", "Healthcare", "Hospitality", "Engineering",
  "IT", "Security", "Driving", "Logistics", "Education", "Finance", "Retail",
  "Telecom", "Manufacturing", "Government"
];

const experienceLevels = ["Entry Level", "Mid Level", "Senior", "Lead", "Executive"];
const workTypes = ["Remote", "Hybrid", "On-site", "Flexible"];
const employmentTypes = ["Full-Time", "Part-Time", "Contract", "Temporary", "Internship", "Freelance"];
const qatarLocations = ["Doha", "Lusail", "Al Wakrah", "Al Rayyan", "Industrial Area", "Al Khor", "Mesaieed", "Al Shamal"];

const skills = [
  "Driving License", "QID", "Valid Visa", "English", "Arabic", "Microsoft Office",
  "AutoCAD", "SQL", "Python", "Project Management", "Sales", "Customer Service",
  "HVAC", "Electrical", "Plumbing", "Welding"
];

const datePosted = ["Last 24 hours", "Last 3 days", "Last 7 days", "Last 14 days", "Last 30 days"];
const datePostedValues: Record<string, string> = {
  "Last 24 hours": "24h",
  "Last 3 days": "3d",
  "Last 7 days": "7d",
  "Last 14 days": "14d",
  "Last 30 days": "30d",
};

const salaryRanges = [
  { label: "QAR 1k - 3k", min: 1000, max: 3000 },
  { label: "QAR 3k - 5k", min: 3000, max: 5000 },
  { label: "QAR 5k - 8k", min: 5000, max: 8000 },
  { label: "QAR 8k - 12k", min: 8000, max: 12000 },
  { label: "QAR 12k - 20k", min: 12000, max: 20000 },
  { label: "QAR 20k+", min: 20000, max: 999999 },
];

const nationalities = [
  "Any Nationality", "Indian", "Pakistani", "Bangladeshi", "Filipino",
  "Egyptian", "Nepali", "Sri Lankan", "Kenyan", "Ugandan"
];

const jobSources = [
  "bayt", "indeed", "tanqeeb", "naukrigulf", "gulf-talent", "qatar-living"
];

function toggleCSV(current: string, value: string): string {
  const arr = current ? current.split(",") : [];
  const idx = arr.indexOf(value);
  if (idx >= 0) {
    arr.splice(idx, 1);
    return arr.join(",");
  }
  arr.push(value);
  return arr.join(",");
}

function hasCSV(current: string, value: string): boolean {
  return current ? current.split(",").includes(value) : false;
}

interface URLFilterParams {
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

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FilterSection({ title, defaultOpen = true, children }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        {title}
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-3 space-y-1.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Separator />
    </div>
  );
}

interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FilterCheckbox({ label, checked, onChange }: FilterCheckboxProps) {
  return (
    <label className="flex items-center gap-2.5 px-1 py-1.5 cursor-pointer group rounded-md hover:bg-muted/50 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 accent-primary"
      />
      <span className="text-sm flex-1 group-hover:text-foreground transition-colors text-muted-foreground">{label}</span>
    </label>
  );
}

interface JobsFilterSidebarProps {
  params: URLFilterParams;
  setParams: (updates: Record<string, string | number | boolean | null | undefined>) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (o: boolean) => void;
}

export function JobsFilterSidebar({ params, setParams, isMobileOpen, setIsMobileOpen }: JobsFilterSidebarProps) {
  const toggleFilter = useCallback((key: string, value: string, isCSV: boolean = true) => {
    if (isCSV) {
      const current = (params as any)[key] as string || "";
      setParams({ [key]: toggleCSV(current, value) || null });
    }
  }, [params, setParams]);

  const activeCount = [
    ...(params.categories ? params.categories.split(",") : []),
    ...(params.experienceLevels ? params.experienceLevels.split(",") : []),
    ...(params.workTypes ? params.workTypes.split(",") : []),
    ...(params.employmentType ? params.employmentType.split(",") : []),
    ...(params.locations ? params.locations.split(",") : []),
    ...(params.skills ? params.skills.split(",") : []),
    params.visaSponsored ? "Visa Sponsored" : null,
    params.isRemote ? "Remote" : null,
    params.isUrgent ? "Urgent" : null,
    params.datePosted || null,
    params.salaryMin ? "Salary" : null,
  ].filter(Boolean).length;

  const clearAll = useCallback(() => {
    setIsMobileOpen(false);
    setParams({
      q: null, location: null, employmentType: null, categories: null,
      locations: null, experienceLevels: null, workTypes: null, skills: null,
      nationalities: null, datePosted: null, salaryMin: null, salaryMax: null,
      visaSponsored: null, isRemote: null, isUrgent: null, aiMatchScore: null,
      sort: null, page: null,
    });
  }, [setParams, setIsMobileOpen]);

  const isSalaryActive = (min: number, max: number) =>
    Number(params.salaryMin) === min && Number(params.salaryMax) === max;

  const postedValue = datePostedValues[params.datePosted] ? params.datePosted : "";

  const sidebarContent = (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="font-semibold text-sm">Filters</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <FilterSection title="Quick Toggles" defaultOpen={true}>
        <div className="space-y-2 px-1">
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-muted-foreground">Visa Sponsored</span>
            <input
              type="checkbox"
              checked={params.visaSponsored}
              onChange={(e) => setParams({ visa: e.target.checked || null })}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-muted-foreground">Migration Friendly</span>
            <input
              type="checkbox"
              checked={params.visaSponsored}
              onChange={(e) => setParams({ visa: e.target.checked || null })}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-muted-foreground">Remote Only</span>
            <input
              type="checkbox"
              checked={params.isRemote}
              onChange={(e) => setParams({ remote: e.target.checked || null })}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-muted-foreground">Urgent Hiring</span>
            <input
              type="checkbox"
              checked={params.isUrgent}
              onChange={(e) => setParams({ urgent: e.target.checked || null })}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>
        </div>
      </FilterSection>

      <FilterSection title="Location">
        {qatarLocations.map((loc) => (
          <FilterCheckbox
            key={loc}
            label={loc}
            checked={hasCSV(params.locations, loc)}
            onChange={() => toggleFilter("locations", loc)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Industry">
        {categories.map((cat) => (
          <FilterCheckbox
            key={cat}
            label={cat}
            checked={hasCSV(params.categories, cat)}
            onChange={() => toggleFilter("categories", cat)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Salary Range">
        <div className="px-1 space-y-1">
          {salaryRanges.map((range) => (
            <label key={range.label} className="flex items-center gap-2.5 py-1.5 cursor-pointer group rounded-md hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                name="salaryRange"
                checked={isSalaryActive(range.min, range.max)}
                onChange={() => setParams({
                  salaryMin: range.min,
                  salaryMax: range.max,
                })}
                className="h-4 w-4 text-primary accent-primary"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground">{range.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Experience Level">
        {experienceLevels.map((level) => (
          <FilterCheckbox
            key={level}
            label={level}
            checked={hasCSV(params.experienceLevels, level)}
            onChange={() => toggleFilter("experienceLevels", level)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Work Type">
        {workTypes.map((type) => (
          <FilterCheckbox
            key={type}
            label={type}
            checked={hasCSV(params.workTypes, type)}
            onChange={() => toggleFilter("workTypes", type)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Employment Type">
        {employmentTypes.map((type) => (
          <FilterCheckbox
            key={type}
            label={type}
            checked={hasCSV(params.employmentType, type)}
            onChange={() => toggleFilter("employmentType", type)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Skills / Qualifications">
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleFilter("skills", skill)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                hasCSV(params.skills, skill)
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {skill}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Nationality Friendly">
        {nationalities.map((nat) => (
          <FilterCheckbox
            key={nat}
            label={nat}
            checked={hasCSV(params.nationalities, nat)}
            onChange={() => toggleFilter("nationalities", nat)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Source">
        {jobSources.map((src) => (
          <FilterCheckbox
            key={src}
            label={src.replace("-", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
            checked={hasCSV(params.source || "", src)}
            onChange={() => toggleFilter("source", src)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Date Posted">
        {datePosted.map((date) => {
          const val = datePostedValues[date];
          return (
            <label key={date} className="flex items-center gap-2.5 px-1 py-1.5 cursor-pointer group rounded-md hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                name="datePosted"
                checked={params.datePosted === val}
                onChange={() => setParams({ posted: val })}
                className="h-4 w-4 text-primary focus:ring-primary/30 accent-primary"
              />
              <span className="text-sm group-hover:text-foreground transition-colors text-muted-foreground">{date}</span>
            </label>
          );
        })}
      </FilterSection>

      <FilterSection title="AI Match Score">
        <div className="px-1 py-2">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Number(params.aiMatchScore) || 0}
            onChange={(e) => setParams({ matchScore: Number(e.target.value) || null })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">Min: {Number(params.aiMatchScore) || 0}%</span>
            <span className="text-xs text-muted-foreground">100%</span>
          </div>
        </div>
      </FilterSection>

      <Button
        className="w-full mt-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        onClick={() => setIsMobileOpen(false)}
      >
        Apply Filters
      </Button>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin pr-2">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 z-50 bg-background border-r shadow-2xl p-6 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-semibold">Filters</span>
                <button onClick={() => setIsMobileOpen(false)} className="p-1 rounded-md hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
