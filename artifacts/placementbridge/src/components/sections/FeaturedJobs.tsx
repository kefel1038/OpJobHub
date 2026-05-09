import { useEffect, useState } from "react";
import { Link } from "wouter";
import { MapPin, Building2, DollarSign, Star, ArrowRight, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type Job } from "@/lib/api";

export function FeaturedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listJobs().then(res => {
      setJobs(res.slice(0, 4));
      setLoading(false);
    });
  }, []);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-0">Opportunities</Badge>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">Featured Career <span className="text-primary">Paths</span></h2>
            <p className="text-muted-foreground text-lg">Hand-picked roles from top employers across the Gulf. Verified and ready for your application.</p>
          </div>
          <Button variant="ghost" asChild className="group rounded-full text-primary font-bold">
            <Link href="/jobs">
              View all 1,200+ jobs
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="group h-full transition-all border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 cursor-pointer rounded-[2rem] overflow-hidden bg-background">
        <CardContent className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              {job.company.charAt(0)}
            </div>
            {job.isFeatured && (
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-full px-3">
                <Star className="h-3 w-3 fill-current mr-1.5" />
                Featured
              </Badge>
            )}
          </div>
          
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{job.title}</h3>
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-6">
            <Building2 className="h-4 w-4" /> {job.company}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t border-border/50 pt-6">
            <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
              <MapPin className="h-4 w-4" /> {job.location}
            </div>
            {job.salary && (
              <div className="flex items-center gap-1.5 bg-emerald-500/5 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-500/10">
                <DollarSign className="h-4 w-4" /> {job.salary}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
