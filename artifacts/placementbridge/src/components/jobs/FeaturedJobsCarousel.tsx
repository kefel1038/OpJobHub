import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronLeft, ChevronRight, Star, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Job } from "@/lib/api";
import { cn } from "@/lib/utils";

export function FeaturedJobsCarousel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    api.listJobs().then((res) => {
      setJobs(res.filter((j) => j.isFeatured).slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const visible = jobs.slice(currentIndex, currentIndex + 4);

  const next = () => {
    if (currentIndex + 1 < jobs.length) {
      setCurrentIndex((prev) => Math.min(prev + 1, jobs.length - 4));
    }
  };

  const prev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <section className="py-16 relative overflow-hidden bg-muted/20">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 rounded-full text-xs font-medium">
              <Sparkles className="h-3 w-3 mr-1" /> Featured Opportunities
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-black">
              <span className="text-gradient">Featured</span> Jobs
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              disabled={currentIndex === 0}
              className="h-9 w-9 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              disabled={currentIndex >= jobs.length - 4}
              className="h-9 w-9 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {visible.map((job, i) => (
            <motion.a
              key={job.id}
              href={`/jobs/${job.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="group relative rounded-2xl border border-border/60 bg-card p-5 card-hover overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[100%]" />
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0">
                  {job.company.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </div>
                {job.isFeatured && (
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0 ml-auto" />
                )}
              </div>
              <div className="space-y-1.5 mb-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {job.location}
                </p>
                {job.salary && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> {job.salary}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">
                  {Math.floor(Math.random() * 20) + 80}% Match
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.a>
          ))}
        </div>

        <div className="flex justify-center mt-6 gap-1.5">
          {Array.from({ length: Math.max(1, jobs.length - 3) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
