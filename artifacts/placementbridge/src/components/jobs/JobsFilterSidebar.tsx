import { useState } from "react";
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

const companySizes = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const datePosted = ["Last 24 hours", "Last 3 days", "Last 7 days", "Last 14 days", "Last 30 days"];
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
  count?: number;
}

function FilterCheckbox({ label, checked, onChange, count }: FilterCheckboxProps) {
  return (
    <label className="flex items-center gap-2.5 px-1 py-1.5 cursor-pointer group rounded-md hover:bg-muted/50 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 accent-primary"
      />
      <span className="text-sm flex-1 group-hover:text-foreground transition-colors text-muted-foreground">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground/60">({count})</span>
      )}
    </label>
  );
}

export interface FilterState {
  categories: string[];
  experienceLevels: string[];
  workTypes: string[];
  employmentTypes: string[];
  locations: string[];
  skills: string[];
  companySizes: string[];
  nationalities: string[];
  salaryRange: [number, number];
  datePosted: string;
  visaSponsored: boolean;
  isRemote: boolean;
  isUrgent: boolean;
  aiMatchScore: number;
}

interface JobsFilterSidebarProps {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (o: boolean) => void;
}

export function JobsFilterSidebar({ filters, setFilters, isMobileOpen, setIsMobileOpen }: JobsFilterSidebarProps) {
  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const arr = filters[key] as string[];
    setFilters({
      ...filters,
      [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    });
  };

  const clearAll = () => {
    setFilters({
      categories: [],
      experienceLevels: [],
      workTypes: [],
      employmentTypes: [],
      locations: [],
      skills: [],
      companySizes: [],
      nationalities: [],
      salaryRange: [0, 999999],
      datePosted: "Anytime",
      visaSponsored: false,
      isRemote: false,
      isUrgent: false,
      aiMatchScore: 0,
    });
  };

  const activeCount = [
    ...filters.categories,
    ...filters.experienceLevels,
    ...filters.workTypes,
    ...filters.employmentTypes,
    ...filters.locations,
    ...filters.skills,
    ...filters.companySizes,
    ...filters.nationalities,
    filters.visaSonsored ? "Visa Sponsored" : null,
    filters.isRemote ? "Remote" : null,
    filters.isUrgent ? "Urgent" : null,
    filters.datePosted !== "Anytime" ? filters.datePosted : null,
  ].filter(Boolean).length;

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
              checked={filters.visaSonsored}
              onChange={(e) => setFilters({ ...filters, visaSponsored: e.target.checked })}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-muted-foreground">Remote Only</span>
            <input
              type="checkbox"
              checked={filters.isRemote}
              onChange={(e) => setFilters({ ...filters, isRemote: e.target.checked })}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-muted-foreground">Urgent Hiring</span>
            <input
              type="checkbox"
              checked={filters.isUrgent}
              onChange={(e) => setFilters({ ...filters, isUrgent: e.target.checked })}
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
            checked={filters.locations.includes(loc)}
            onChange={() => toggleArrayFilter("locations", loc)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Industry">
        {categories.map((cat) => (
          <FilterCheckbox
            key={cat}
            label={cat}
            checked={filters.categories.includes(cat)}
            onChange={() => toggleArrayFilter("categories", cat)}
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
                checked={filters.salaryRange[0] === range.min && filters.salaryRange[1] === range.max}
                onChange={() => setFilters({ ...filters, salaryRange: [range.min, range.max] })}
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
            checked={filters.experienceLevels.includes(level)}
            onChange={() => toggleArrayFilter("experienceLevels", level)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Work Type">
        {workTypes.map((type) => (
          <FilterCheckbox
            key={type}
            label={type}
            checked={filters.workTypes.includes(type)}
            onChange={() => toggleArrayFilter("workTypes", type)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Employment Type">
        {employmentTypes.map((type) => (
          <FilterCheckbox
            key={type}
            label={type}
            checked={filters.employmentTypes.includes(type)}
            onChange={() => toggleArrayFilter("employmentTypes", type)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Skills / Qualifications">
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleArrayFilter("skills", skill)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                filters.skills.includes(skill)
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
            checked={filters.nationalities.includes(nat)}
            onChange={() => toggleArrayFilter("nationalities", nat)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Date Posted">
        {datePosted.map((date) => (
          <label key={date} className="flex items-center gap-2.5 px-1 py-1.5 cursor-pointer group rounded-md hover:bg-muted/50 transition-colors">
            <input
              type="radio"
              name="datePosted"
              checked={filters.datePosted === date}
              onChange={() => setFilters({ ...filters, datePosted: date })}
              className="h-4 w-4 text-primary focus:ring-primary/30 accent-primary"
            />
            <span className="text-sm group-hover:text-foreground transition-colors text-muted-foreground">{date}</span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="AI Match Score">
        <div className="px-1 py-2">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.aiMatchScore}
            onChange={(e) => setFilters({ ...filters, aiMatchScore: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">Min: {filters.aiMatchScore}%</span>
            <span className="text-xs text-muted-foreground">100%</span>
          </div>
        </div>
      </FilterSection>

      <Button className="w-full mt-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
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

export const defaultFilterState: FilterState = {
  categories: [],
  experienceLevels: [],
  workTypes: [],
  employmentTypes: [],
  locations: [],
  skills: [],
  companySizes: [],
  nationalities: [],
  salaryRange: [0, 999999],
  datePosted: "Anytime",
  visaSponsored: false,
  isRemote: false,
  isUrgent: false,
  aiMatchScore: 0,
};
