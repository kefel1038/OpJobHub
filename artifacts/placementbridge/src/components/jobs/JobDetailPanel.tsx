import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, DollarSign, Building2, Clock, Calendar,
  Sparkles, Send, Bookmark, BookmarkCheck, Briefcase,
  CheckCircle2, GraduationCap, TrendingUp, ChevronRight,
  ExternalLink, Share2, Flag, Mail, Phone, MessageCircle, ChevronDown, Loader2, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Job } from "@/lib/api";
import { toast } from "sonner";
import { Twitter, Linkedin, MessageSquare, Copy, Check } from "lucide-react";

/** Detect applyUrl type and build the correct href */
function buildApplyHref(applyUrl?: string | null): { href: string; type: "email" | "whatsapp" | "phone" | "url" | null } {
  if (!applyUrl) return { href: "", type: null };
  const u = applyUrl.trim();
  // Email address
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return { href: `mailto:${u}`, type: "email" };
  // Already a mailto:
  if (u.startsWith("mailto:")) return { href: u, type: "email" };
  // Phone / WhatsApp number (+, digits, spaces, dashes)
  if (/^[\+\d][\d\s\-]{6,}$/.test(u)) {
    const digits = u.replace(/[^\d+]/g, "");
    return { href: `https://wa.me/${digits}`, type: "whatsapp" };
  }
  // WhatsApp link
  if (u.includes("wa.me") || u.includes("whatsapp")) return { href: u, type: "whatsapp" };
  // tel:
  if (u.startsWith("tel:")) return { href: u, type: "phone" };
  return { href: u.startsWith("http") ? u : `https://${u}`, type: "url" };
}

function ApplyButton({ applyUrl, title, company, className }: { applyUrl?: string | null; title: string; company: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const { href, type } = buildApplyHref(applyUrl);

  if (!href) {
    // No applyUrl — show a dropdown with fallback options
    return (
      <div className="relative">
        <Button
          className={cn("flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base gap-2", className)}
          onClick={() => setOpen(!open)}
        >
          <Send className="h-4 w-4" /> Apply Now <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              className="absolute bottom-14 left-0 right-0 z-50 bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden"
            >
              <a
                href={`mailto:?subject=Application for ${encodeURIComponent(title)} at ${encodeURIComponent(company)}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-sm"
              >
                <Mail className="h-4 w-4 text-primary" /> Apply via Email
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hi, I'm interested in the ${title} position at ${company}. I found this listing on KeFeL Jobs.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-sm border-t border-border/40"
              >
                <MessageCircle className="h-4 w-4 text-emerald-500" /> Apply via WhatsApp
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const icon = type === "email" ? <Mail className="h-4 w-4" />
    : type === "whatsapp" ? <MessageCircle className="h-4 w-4" />
    : type === "phone" ? <Phone className="h-4 w-4" />
    : <Send className="h-4 w-4" />;

  const label = type === "email" ? "Apply via Email"
    : type === "whatsapp" ? "Apply via WhatsApp"
    : type === "phone" ? "Call to Apply"
    : "Apply Now";

  return (
    <Button
      className={cn("flex-1 h-12 rounded-xl font-semibold text-base gap-2",
        type === "whatsapp" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      asChild
    >
      <a href={href} target={type === "url" ? "_blank" : undefined} rel="noopener noreferrer">
        {icon} {label}
      </a>
    </Button>
  );
}

interface ExtendedJob extends Omit<Job, "description"> {
  aiMatch?: number;
  atsScore?: number;
  skills?: string[];
  workType?: string;
  salaryMin?: number;
  salaryMax?: number;
  logo?: string;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  companySize?: string;
  industry?: string;
  description?: string;
  aiResumeOptimization?: string[];
}

interface JobDetailPanelProps {
  job: ExtendedJob | null;
  open: boolean;
  onClose: () => void;
}

const defaultSuggestions = [
  "Add more quantified achievements to your resume",
  "Highlight your experience with relevant technologies",
  "Include relevant certifications",
  "Optimize your summary section for ATS scanning",
];

function MarketingAgent({ jobId }: { jobId: number }) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<{ linkedin: string; twitter: string; whatsapp: string; instagram: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.generateSocialContent(jobId);
      setContent(res);
      toast.success("Social content generated!");
    } catch (err) {
      toast.error("Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${platform} content copied!`);
  };

  return (
    <section className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-foreground">AI Marketing Agent</h3>
        </div>
        {!content && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={generate} 
            disabled={loading}
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Posts
          </Button>
        )}
      </div>

      {!content && !loading && (
        <p className="text-sm text-muted-foreground">
          Let our AI Agent create high-engagement social media posts to help you promote this job.
        </p>
      )}

      {loading && (
        <div className="space-y-3 py-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {content && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-4 w-4 text-blue-600" />, text: content.linkedin },
              { id: "twitter", label: "X / Twitter", icon: <Twitter className="h-4 w-4 text-sky-500" />, text: content.twitter },
              { id: "whatsapp", label: "WhatsApp", icon: <MessageSquare className="h-4 w-4 text-emerald-500" />, text: content.whatsapp },
            ].map((p) => (
              <div key={p.id} className="p-3 rounded-xl bg-background/60 border border-border/40 relative group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {p.icon} {p.label}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => copyToClipboard(p.text, p.label)}
                  >
                    {copied === p.label ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-sm text-foreground line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                  {p.text}
                </p>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setContent(null)} className="text-xs text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
          </Button>
        </div>
      )}
    </section>
  );
}

export function JobDetailPanel({ job, open, onClose }: JobDetailPanelProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && job && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[520px] lg:w-[600px] z-50 bg-background border-l shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold">Job Details</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSaved(!saved)}>
                  {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                    {job.company.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-foreground leading-tight">{job.title}</h2>
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Building2 className="h-4 w-4" /> {job.company}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {job.salary ?? "$80K - $150K"}</span>
                      <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {job.workType ?? "Full-Time"}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {(job.skills ?? ["React", "TypeScript", "Node.js", "AWS", "Docker"]).map((skill) => (
                    <Badge key={skill} variant="secondary" className="rounded-lg text-xs px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary" /> AI Match
                      </span>
                      <span className="text-sm font-bold text-primary">{job.aiMatch ?? 94}%</span>
                    </div>
                    <Progress value={job.aiMatch ?? 94} className="h-1.5 bg-primary/10" />
                    <p className="text-[11px] text-muted-foreground mt-2">Excellent match based on your profile</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> ATS Score
                      </span>
                      <span className="text-sm font-bold text-emerald-500">{job.atsScore ?? 88}/100</span>
                    </div>
                    <Progress value={job.atsScore ?? 88} className="h-1.5 bg-emerald-500/10" />
                    <p className="text-[11px] text-muted-foreground mt-2">Strong ATS compatibility</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" /> Job Description
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {job.description || (
                        <span className="italic">No description available. {job.applyUrl && <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">View on employer website</a>}</span>
                      )}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold mb-3">Key Responsibilities</h3>
                    {job.responsibilities && job.responsibilities.length > 0 ? (
                      <ul className="space-y-2">
                        {job.responsibilities.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Not specified. {job.applyUrl && <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">View on employer website</a>}</p>
                    )}
                  </section>

                  <section>
                    <h3 className="text-lg font-bold mb-3">Requirements</h3>
                    {job.requirements && job.requirements.length > 0 ? (
                      <ul className="space-y-2">
                        {job.requirements.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <GraduationCap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Not specified. {job.applyUrl && <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">View on employer website</a>}</p>
                    )}
                  </section>

                  <section>
                    <h3 className="text-lg font-bold mb-3">Benefits</h3>
                    {job.benefits && job.benefits.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {job.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-muted/30">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Not specified. {job.applyUrl && <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">View on employer website</a>}</p>
                    )}
                  </section>
                </div>

                <Separator className="my-6" />

                <section>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> AI Resume Optimization
                  </h3>
                  <div className="space-y-3">
                    {((job.aiResumeOptimization && job.aiResumeOptimization.length > 0) ? job.aiResumeOptimization : defaultSuggestions).map((suggestion, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{suggestion}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">This will improve your match score by approximately 5-10%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <Separator className="my-6" />

                <section className="mb-6">
                  <h3 className="text-lg font-bold mb-3">Company Overview</h3>
                  <div className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                        {job.company.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{job.company}</p>
                        <p className="text-xs text-muted-foreground">{job.industry ?? "Technology"} &middot; {job.companySize || "51-200 employees"}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {job.companyOverview || `Leading technology company focused on building innovative solutions that transform industries. 
With a team of passionate professionals, we're committed to excellence and continuous innovation.`}
                    </p>
                  </div>
                </section>

                <MarketingAgent jobId={job.id} />
              </div>
            </ScrollArea>

            <div className="border-t border-border/60 p-4 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <ApplyButton applyUrl={job.applyUrl} title={job.title} company={job.company} />
                <Button variant="outline" className="h-12 rounded-xl gap-2" asChild>
                  <a href={job.applyUrl && (job.applyUrl.startsWith("http") || job.applyUrl.startsWith("www")) ? job.applyUrl : "#"} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> Company Site
                  </a>
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
