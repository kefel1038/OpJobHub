import { useEffect, useState } from "react";
import { Link } from "wouter";
import { MapPin, Building2, DollarSign, Star, ArrowRight, Loader2, Search, Briefcase } from "lucide-react";
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
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-[#FFBF00] text-black font-black uppercase italic border-0">Opportunities</Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-black uppercase italic mb-4">Featured Career <span className="text-[#FFBF00]">Paths</span></h2>
            <p className="text-muted-foreground text-lg font-bold">Hand-picked roles from top employers across the Gulf. Verified and ready for your application.</p>
          </div>
          <Button variant="outline" asChild className="group rounded-full border-2 border-black text-black font-black uppercase italic px-8 h-12">
            <Link href="/jobs">
              View all 1,200+ jobs
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#FFBF00]" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
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
      <Card className="group h-full transition-all border-2 border-black hover:bg-black hover:text-white cursor-pointer rounded-[2.5rem] overflow-hidden bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
        <CardContent className="p-10">
          <div className="flex items-start justify-between mb-8">
            <div className="h-16 w-16 rounded-2xl bg-[#FFBF00] flex items-center justify-center text-2xl font-black text-black">
              {job.company.charAt(0)}
            </div>
            {job.isFeatured && (
              <Badge className="bg-black text-[#FFBF00] border-0 rounded-full px-4 py-1 font-black uppercase italic text-xs">
                <Star className="h-3 w-3 fill-current mr-1.5" />
                Featured
              </Badge>
            )}
          </div>
          
          <h3 className="text-2xl font-black uppercase italic mb-3 group-hover:text-[#FFBF00] transition-colors leading-tight">
            {job.title}
          </h3>
          <p className="flex items-center gap-2 text-base font-bold opacity-70 mb-8">
            <Building2 className="h-5 w-5" /> {job.company}
          </p>

          <div className="flex flex-wrap gap-4 text-sm font-black border-t-2 border-black/10 group-hover:border-white/20 pt-8">
            <div className="flex items-center gap-1.5 bg-zinc-100 text-black px-4 py-2 rounded-full">
              <MapPin className="h-4 w-4" /> {job.location}
            </div>
            {job.salary && (
              <div className="flex items-center gap-1.5 bg-[#FFBF00] text-black px-4 py-2 rounded-full">
                <DollarSign className="h-4 w-4" /> {job.salary}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
