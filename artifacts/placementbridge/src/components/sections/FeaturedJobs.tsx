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
      <div className="absolute inset-0 bg-grid-white opacity-20 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
              <Star className="h-3 w-3 mr-1 fill-blue-400" />
              Opportunities
            </Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-white">
              Featured Career <span className="text-gradient">Paths</span>
            </h2>
            <p className="text-gray-400 text-lg">Hand-picked roles from top employers across the Gulf. Verified and ready for your application.</p>
          </div>
          <Button variant="outline" asChild className="group rounded-full border border-[#2C2C2E] text-gray-300 hover:text-white hover:bg-white/5 font-semibold px-8 h-12">
            <Link href="/jobs">
              View All Jobs
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No featured jobs right now</p>
            <p className="text-gray-600 text-sm mt-1">Check back soon for new opportunities.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="bg-surface border-subtle card-hover h-full cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-400" />
                      </div>
                      {job.isFeatured && (
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                          <Star className="h-3 w-3 fill-amber-400 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-100 mb-1 line-clamp-1">{job.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{job.company || "Company"}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <DollarSign className="h-3.5 w-3.5" />
                          {job.salary}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#2C2C2E]">
                      <span className="text-[10px] text-gray-500">
                        {job.employmentType || "Full-Time"}
                      </span>
                      <span className="text-blue-400 text-xs font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Apply
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
