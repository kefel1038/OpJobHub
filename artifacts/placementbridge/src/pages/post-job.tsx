import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { CreditCard, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export default function PostJob() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  const params = new URLSearchParams(search);
  const status = params.get("status");

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role === "jobseeker") {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isFeatured) {
        const { url } = await api.createCheckoutSession();
        sessionStorage.setItem(
          "pending_job",
          JSON.stringify({ title, company, location, salary, description, isFeatured: true }),
        );
        window.location.href = url;
        return;
      }

      const job = await api.createJob({ title, company, location, salary, description, isFeatured: false });
      navigate(`/jobs/${job.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post job.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "success") return;
    const pendingRaw = sessionStorage.getItem("pending_job");
    if (!pendingRaw) return;
    const pending = JSON.parse(pendingRaw);
    sessionStorage.removeItem("pending_job");
    api
      .createJob(pending)
      .then((job) => navigate(`/jobs/${job.id}`))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to post paid job."));
  }, [status, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        {status === "cancel" && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-4">
            <XCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Payment cancelled</p>
              <p className="text-sm">You can finish posting below or try the featured upgrade again.</p>
            </div>
          </div>
        )}
        {status === "success" && (
          <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 text-green-900 rounded-md p-4">
            <CheckCircle2 className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Payment received</p>
              <p className="text-sm">Publishing your featured job now...</p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Post a Job</CardTitle>
            <CardDescription>
              Free standard listings. Add the Featured upgrade for $20 to pin it to the top.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Senior Frontend Engineer"
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
                    placeholder="Acme Inc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Doha, Qatar"
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
                  placeholder="$80,000 - $120,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the role, requirements, and benefits..."
                  rows={6}
                  required
                />
              </div>

              <label className="flex items-start gap-3 border rounded-md p-4 cursor-pointer hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <Checkbox
                  checked={isFeatured}
                  onCheckedChange={(v) => setIsFeatured(v === true)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Make this a Featured Job — $20
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pinned to the top of the jobs list with a Featured badge. Paid via Stripe.
                  </p>
                </div>
              </label>

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading
                    ? "Working..."
                    : isFeatured
                      ? "Pay $20 & Post"
                      : "Post Job (Free)"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
