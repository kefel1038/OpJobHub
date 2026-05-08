import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  MapPin,
  Briefcase,
  Star,
  Loader2,
  DollarSign,
  ArrowRight,
  Search,
  Building2,
  Users,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type Job } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

const HERO_AVATARS = [
  { src: "https://randomuser.me/api/portraits/women/68.jpg", size: "h-16 w-16", pos: "top-8 left-[6%]" },
  { src: "https://randomuser.me/api/portraits/men/32.jpg", size: "h-24 w-24", pos: "top-1/3 left-[2%]" },
  { src: "https://randomuser.me/api/portraits/women/44.jpg", size: "h-14 w-14", pos: "bottom-12 left-[14%]" },
  { src: "https://randomuser.me/api/portraits/women/65.jpg", size: "h-16 w-16", pos: "top-10 right-[7%]" },
  { src: "https://randomuser.me/api/portraits/men/45.jpg", size: "h-24 w-24", pos: "top-1/3 right-[3%]" },
  { src: "https://randomuser.me/api/portraits/women/22.jpg", size: "h-14 w-14", pos: "bottom-14 right-[12%]" },
];

const COMPANIES = [
  "FLUITRONICS",
  "ALPSALPINE",
  "FENIX",
  "DPS",
  "WEBESAN",
  "PORTICO",
];

const STEPS = [
  {
    n: "1",
    title: "Create your profile",
    desc: "Set up your account in minutes — whether you're searching for talent or your next opportunity.",
  },
  {
    n: "2",
    title: "Discover & connect",
    desc: "Browse curated job postings or candidate profiles matched to your needs.",
  },
  {
    n: "3",
    title: "Smart matching",
    desc: "Our platform highlights the best fit so you spend less time filtering and more time interviewing.",
  },
  {
    n: "4",
    title: "Hire or get hired",
    desc: "Manage everything from one dashboard, from first contact to signed offer.",
  },
];

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    api
      .listJobs()
      .then(setJobs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const featuredCount = jobs.filter((j) => j.isFeatured).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="relative max-w-3xl mx-auto text-center">
            {HERO_AVATARS.map((a, i) => (
              <img
                key={i}
                src={a.src}
                alt=""
                className={`hidden md:block absolute ${a.pos} ${a.size} rounded-full object-cover ring-4 ring-background shadow-lg`}
                loading="lazy"
              />
            ))}

            <Badge
              variant="secondary"
              className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium gap-1.5"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              Smarter hiring, better careers
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
              Start your <br className="hidden sm:block" />
              <span className="text-primary">recruitment</span> now
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
              We turn your hiring into a success story — high reach, excellent service,
              and smart technology, all on one platform.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-full px-7 h-12 text-base">
                <Link href="#jobs">
                  Discover job postings
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              {!user && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-7 h-12 text-base"
                >
                  <Link href="/register">I'm hiring</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Company logos band */}
        <div className="border-y border-border bg-muted/40">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              These employers rely on us
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {COMPANIES.map((c) => (
                <span
                  key={c}
                  className="text-base md:text-lg font-bold tracking-tight text-foreground/40 hover:text-foreground/70 transition-colors"
                >
                  {c}
                </span>
              ))}
              <span className="text-sm text-muted-foreground">+ 66,000 more companies</span>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOM RECRUITMENT FEATURE STRIP */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-5">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Custom recruitment <br />
              for <span className="text-primary">smarter hiring</span>
            </h2>
            <p className="mt-5 text-muted-foreground">
              Our platform adapts to your needs — whether you're an employer searching for
              top talent or a candidate looking for your next role. Data-driven matching,
              measurable results, ongoing improvements.
            </p>
            <div className="mt-6 flex items-center gap-1.5">
              <span className="h-1 w-12 rounded-full bg-primary" />
              <span className="h-1 w-3 rounded-full bg-primary/30" />
              <span className="h-1 w-3 rounded-full bg-primary/30" />
            </div>
          </div>

          <div className="md:col-span-7 grid sm:grid-cols-2 gap-4">
            <FeatureCard
              icon={<Search className="h-5 w-5" />}
              title="All-in-One"
              text="From posting jobs to managing applications, do it all from a single, focused dashboard."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Individual Collaboration"
              text="We adapt to you — not the other way around. Reliable partner for individual roles or whole teams."
            />
            <FeatureCard
              icon={<TrendingUp className="h-5 w-5" />}
              title="Featured Listings"
              text="Boost a posting for $20 to land at the top of search and get qualified applicants faster."
              highlight
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Verified Roles"
              text="Every employer is reviewed, so candidates can trust what they see and apply with confidence."
            />
          </div>
        </div>
      </section>

      {/* JOBS SECTION */}
      <section id="jobs" className="bg-muted/40 border-y border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-10">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary mb-2">
                Open positions
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {loading
                  ? "Loading opportunities..."
                  : `${jobs.length} role${jobs.length === 1 ? "" : "s"} ready for you`}
              </h2>
              {!loading && featuredCount > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Including {featuredCount} featured posting{featuredCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
            {user?.role === "employer" || user?.role === "admin" ? (
              <Button asChild className="rounded-full px-6">
                <Link href="/post-job">
                  Post a job <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            ) : !user ? (
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href="/register">Become an employer</Link>
              </Button>
            ) : null}
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4">
              {error}
            </div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-muted-foreground">
                <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No jobs posted yet. Be the first to post one.</p>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card
                  className={`group h-full transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                    job.isFeatured ? "border-primary/30 bg-primary/[0.02]" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          {job.isFeatured && (
                            <Badge className="gap-1 rounded-full bg-primary/10 text-primary hover:bg-primary/10 border-0">
                              <Star className="h-3 w-3 fill-current" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {job.company}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {job.salary}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / NUMBERED STEPS */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-medium uppercase tracking-widest text-primary mb-2">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Four steps to your next great hire — or job
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <Card key={s.n} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl font-bold text-foreground/30">{s.n}</span>
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10 border-0 text-[10px] font-medium">
                    fast
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* DARK CTA STRIP */}
      <section className="bg-foreground text-background">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Intensive and individual collaboration with every partner — from consulting to perfection.
            </h2>
            <div className="space-y-5">
              <p className="text-background/70">
                Arrange a free consultation and see how KeFeL Jobs can work as an extension of your
                hiring team. Smarter sourcing, faster placements, measurable outcomes.
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-full px-7 bg-background text-foreground hover:bg-background/90"
              >
                <Link href={user ? "/post-job" : "/register"}>
                  Get to know the strategy
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <Stat value="66K+" label="Companies trust us" />
          <Stat value="120K+" label="Active candidates" />
          <Stat value="4.9★" label="Employer satisfaction" />
          <Stat value="$20" label="To feature a posting" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              K
            </div>
            <span className="font-semibold">
              KeFeL <span className="text-primary">Jobs</span>
            </span>
          </div>
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} KeFeL Jobs. Smarter hiring, better careers.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`border-border h-full transition-all hover:shadow-md ${
        highlight ? "bg-primary/[0.04] border-primary/20" : ""
      }`}
    >
      <CardContent className="p-5">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${
            highlight ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
        >
          {icon}
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
      </CardContent>
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
