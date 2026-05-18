import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Clock, Bookmark, BookmarkCheck, Send, Building2,
  DollarSign, Sparkles, ChevronRight, ShieldCheck, Flag, ExternalLink, Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/api";

interface JobCardProps {
  job: Job;
  index: number;
  onSelect: (job: Job) => void;
  isSelected?: boolean;
}

const companyColors = [
  "from-amber-500 to-orange-500",
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-purple-500 to-pink-500",
  "from-rose-500 to-red-500",
  "from-cyan-500 to-blue-500",
];

const qatarAreas = ["Doha", "Lusail", "Al Wakrah", "Al Rayyan", "Industrial Area", "Al Khor"];

function getLocationBadge(location: string): { label: string; color: string } | null {
  const loc = location?.toLowerCase() || "";
  if (loc.includes("doha")) return { label: "Doha", color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400" };
  if (loc.includes("lusail")) return { label: "Lusail", color: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400" };
  if (loc.includes("wakrah")) return { label: "Al Wakrah", color: "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400" };
  if (loc.includes("rayyan")) return { label: "Al Rayyan", color: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400" };
  return null;
}

function isNewJob(createdAt: string): boolean {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 24 * 60 * 60 * 1000;
}

function isRecentJob(createdAt: string): boolean {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 48 * 60 * 60 * 1000;
}

export function JobCard({ job, index, onSelect, isSelected }: JobCardProps) {
  const [saved, setSaved] = useState(false);
  const colorClass = companyColors[job.id % companyColors.length];

  const timeAgo = (() => {
    const diff = Date.now() - new Date(job.createdAt).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) return "Just now";
      return `${hours}h ago`;
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  })();

  const aiMatch = job.aiMatchScore ?? Math.floor(Math.random() * 30) + 70;
  const skillTags = job.skills ?? [];
  const displayTags = skillTags.length > 0 ? skillTags.slice(0, 3) : [];
  const isNew = isNewJob(job.createdAt);
  const isRecent = isRecentJob(job.createdAt);
  const locationBadge = getLocationBadge(job.location);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className={cn(
        "group relative rounded-2xl border p-5 cursor-pointer card-hover transition-all",
        isSelected
          ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
          : "border-border/60 bg-card hover:border-primary/30 hover:bg-accent/30"
      )}
      onClick={() => onSelect(job)}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg",
          colorClass
        )}>
          {job.company?.charAt(0) || "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                {isNew && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px] px-2 py-0 rounded-md font-semibold dark:text-emerald-400">
                    NEW TODAY
                  </Badge>
                )}
                {job.isUrgent && (
                  <Badge className="bg-red-500/15 text-red-600 border-red-500/20 text-[10px] px-2 py-0 rounded-md font-semibold animate-pulse dark:text-red-400">
                    URGENT
                  </Badge>
                )}
                {job.isFeatured && (
                  <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px] px-2 py-0 rounded-md font-semibold">
                    HOT JOB
                  </Badge>
                )}
                {(job.visaSponsored || (job.nationalityFriendly && job.nationalityFriendly.length > 0)) && (
                  <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 text-[10px] px-2 py-0 rounded-md font-semibold dark:text-amber-400">
                    <Globe className="h-2.5 w-2.5 mr-0.5 inline" />
                    MIGRATION FRIENDLY
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Building2 className="h-3.5 w-3.5" />
                {job.company}
                {job.isVerified && (
                  <ShieldCheck className="h-3 w-3 text-blue-500" />
                )}
                {job.isVerified && (
                  <span className="text-[10px] text-blue-500 font-medium">Verified</span>
                )}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
              className={cn(
                "p-1.5 rounded-full transition-all shrink-0",
                saved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-muted/80"
              )}
            >
              {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {job.location}
            </span>
            {(job.salaryMin || job.salary) && (
              <span className="flex items-center gap-1 font-medium text-foreground/80">
                <DollarSign className="h-3 w-3" />
                {job.salaryMin ? `${job.salaryCurrency || "QAR"} ${job.salaryMin.toLocaleString()}${job.salaryMax ? ` - ${job.salaryMax.toLocaleString()}` : "+"}` : job.salary}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {timeAgo}
            </span>
            {job.source && (
              <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded">
                {job.source}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {job.visaSponsored && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                Visa Sponsored
              </Badge>
            )}
            {job.employmentType && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md font-normal">
                {job.employmentType}
              </Badge>
            )}
            {job.industry && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md font-normal">
                {job.industry}
              </Badge>
            )}
            {job.isRemote && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400">
                Remote
              </Badge>
            )}
            {displayTags.map((skill) => (
              <Badge key={skill} variant="outline" className="text-[10px] px-2 py-0.5 rounded-md font-normal">
                {skill}
              </Badge>
            ))}
            {skillTags.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md font-normal">
                +{skillTags.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> AI Match
            </span>
            <span className="text-[11px] font-bold text-primary">{aiMatch}%</span>
          </div>
          <Progress value={aiMatch} className="h-1.5 bg-primary/10" />
        </div>
        <Button
          size="sm"
          className="rounded-lg h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          onClick={(e) => { e.stopPropagation(); onSelect(job); }}
        >
          Quick Apply
          <ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
      </div>
    </motion.div>
  );
}
