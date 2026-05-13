import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { AlertCircle, ArrowLeft, Loader2, Pencil } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export default function EditJob() {
  const [, params] = useRoute<{ id: string }>("/jobs/:id/edit");
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const id = params ? Number(params.id) : NaN;

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyOverview, setCompanyOverview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(id)) return;
    api
      .getJob(id)
      .then((job) => {
        const canEdit = user && (user.role === "admin" || user.id === job.createdBy);
        if (!canEdit) {
          navigate(`/jobs/${id}`);
          return;
        }
        setTitle(job.title);
        setCompany(job.company);
        setLocation(job.location);
        setSalary(job.salary ?? "");
        setDescription(job.description);
        setResponsibilities((job.responsibilities ?? []).join("\n"));
        setRequirements((job.requirements ?? []).join("\n"));
        setBenefits((job.benefits ?? []).join("\n"));
        setCompanySize(job.companySize ?? "");
        setCompanyOverview(job.companyOverview ?? "");
      })
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await api.updateJob(id, {
        title,
        company,
        location,
        salary: salary || null,
        description,
        responsibilities: responsibilities.split("\n").map((s) => s.trim()).filter(Boolean),
        requirements: requirements.split("\n").map((s) => s.trim()).filter(Boolean),
        benefits: benefits.split("\n").map((s) => s.trim()).filter(Boolean),
        companySize,
        companyOverview,
      });
      navigate(`/jobs/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update job.");
      setSaving(false);
    }
  };

  if (Number.isNaN(id)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-10 max-w-2xl text-center">
          <p className="text-muted-foreground">Invalid job ID.</p>
          <Button asChild className="mt-4"><Link href="/">Back to Jobs</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link href={`/jobs/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to job
          </Link>
        </Button>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {fetchError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-4">
            {fetchError}
          </div>
        )}

        {!loading && !fetchError && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Edit Job
              </CardTitle>
              <CardDescription>Update the job listing details below.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (optional)</Label>
                  <Input
                    id="salary"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsibilities">Key Responsibilities (one per line)</Label>
                  <Textarea
                    id="responsibilities"
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements (one per line)</Label>
                  <Textarea
                    id="requirements"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="benefits">Benefits (one per line)</Label>
                  <Textarea
                    id="benefits"
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size (e.g. 51-200 employees)</Label>
                    <Input
                      id="companySize"
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyOverview">Company Overview</Label>
                  <Textarea
                    id="companyOverview"
                    value={companyOverview}
                    onChange={(e) => setCompanyOverview(e.target.value)}
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/jobs/${id}`}>Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
