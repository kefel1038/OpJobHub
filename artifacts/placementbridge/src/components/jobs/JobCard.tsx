import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Clock, Bookmark, BookmarkCheck, Send, Building2,
  DollarSign, Sparkles, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/api";

interface ExtendedJob extends Job {
  aiMatch?: number;
  atsScore?: number;
  skills?: string[];
  workType?: string;
  salaryMin?: number;
  salaryMax?: number;
  logo?: string;
}

interface JobCardProps {
  job: ExtendedJob;
  index: number;
  onSelect: (job: ExtendedJob) => void;
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

export function JobCard({ job, index, onSelect, isSelected }: JobCardProps) {
  const [saved, setSaved] = useState(false);
  const colorClass = companyColors[job.id % companyColors.length];

  const timeAgo = (() => {
    const diff = Date.now() - new Date(job.createdAt).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  })();

  const aiMatch = job.aiMatch ?? Math.floor(Math.random() * 30) + 70;
  const skillTags = job.skills ?? ["React", "TypeScript", "Node.js", "AWS"].slice(0, Math.floor(Math.random() * 3) + 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={cn(
        "group relative rounded-2xl border p-5 cursor-pointer card-hover",
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
          {job.company.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Building2 className="h-3.5 w-3.5" />
                {job.company}
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

          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {job.location}
            </span>
            {(job.salaryMin || job.salary) && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {job.salaryMin ? `$${job.salaryMin.toLocaleString()} - $${(job.salaryMax ?? job.salaryMin + 50000).toLocaleString()}` : job.salary}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {timeAgo}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {skillTags.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md font-normal">
                {skill}
              </Badge>
            ))}
            {skillTags.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md font-normal">
                +{skillTags.length - 3}
              </Badge>
            )}
            <Badge className="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border-primary/20 font-medium">
              {job.workType ?? "Remote"}
            </Badge>
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
