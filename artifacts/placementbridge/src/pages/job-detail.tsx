import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { MapPin, DollarSign, Calendar, ArrowLeft, Star, Loader2, Trash2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type Job } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export default function JobDetail() {
  const [, params] = useRoute("/jobs/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params ? Number(params.id) : NaN;

  useEffect(() => {
    if (Number.isNaN(id)) return;
    api
      .getJob(id)
      .then(setJob)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!job) return;
    if (!confirm("Delete this job listing?")) return;
    try {
      await api.deleteJob(job.id);
      navigate("/");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete.");
    }
  };

  const canDelete = !!user && !!job && (user.role === "admin" || user.id === job.createdBy);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to jobs
          </Link>
        </Button>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-4">
            {error}
          </div>
        )}

        {job && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                    {job.isFeatured && (
                      <Badge className="gap-1 bg-amber-500 hover:bg-amber-500 text-white">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground">{job.company}</p>
                </div>
                {canDelete && (
                  <Button variant="outline" size="sm" onClick={handleDelete} className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
                {job.salary && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    {job.salary}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                {job.description}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
