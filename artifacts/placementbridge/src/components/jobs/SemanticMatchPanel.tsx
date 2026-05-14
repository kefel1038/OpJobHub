import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, BrainCircuit, Target, Zap, Briefcase, MapPin, DollarSign, Shield, AlertCircle, Loader2, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface MatchResult {
  jobId: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  vectorScore: number;
  skillMatchScore: number;
  exactMatchSkills: string[];
  transferableMatchSkills: string[];
  hiddenTalent: boolean;
  sponsorshipScore: number;
  skillGaps: string[];
  reasons: string[];
  visaSponsored?: boolean;
}

export default function SemanticMatchPanel() {
  const [skills, setSkills] = useState("");
  const [title, setTitle] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<{
    matches: MatchResult[];
    hiddenGems: MatchResult[];
    sponsorshipEligible: MatchResult[];
    inferredSkills: string[];
    transferableRoles: string[];
  } | null>(null);

  const handleMatch = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await api.semanticMatch({
        skills: skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        title: title || undefined,
        experience: experience || undefined,
        location: location || undefined,
        topN: 20,
      });
      setResults(result);
    } catch (e: any) {
      setError(e.message || "Failed to run semantic match");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          AI Semantic Match
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Our engine analyzes skills semantically — inferring transferable abilities and hidden talent that keyword search misses.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Your Skills (comma-separated)</Label>
              <Input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Node.js, TypeScript, AWS, Python"
              />
            </div>
            <div className="space-y-2">
              <Label>Current / Target Job Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full Stack Developer"
              />
            </div>
            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Input
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. Senior, Mid, Lead"
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Doha, Qatar, Remote"
              />
            </div>
          </div>

          <Button onClick={handleMatch} disabled={loading || (!skills.trim() && !title.trim())} className="w-full">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" /> Run Semantic Match</>
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {results.inferredSkills.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">AI-Detected Transferable Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {results.inferredSkills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                {results.transferableRoles.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">Compatible roles: </span>
                    <span className="text-xs font-medium">{results.transferableRoles.join(", ")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {results.hiddenGems.length > 0 && (
            <Card className="border-purple-500/30 bg-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Hidden Talent Matches</span>
                  <Badge className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-300 border-none">
                    {results.hiddenGems.length} found
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  These roles don't match your exact keywords but your transferable skills make you a strong candidate.
                </p>
                {results.hiddenGems.slice(0, 3).map((gem) => (
                  <div key={gem.jobId} className="flex items-center justify-between py-2 border-b border-purple-500/10 last:border-0">
                    <div>
                      <div className="text-sm font-medium">{gem.title}</div>
                      <div className="text-xs text-muted-foreground">{gem.company} &middot; {gem.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-500">{gem.matchScore}%</div>
                      <div className="text-[10px] text-muted-foreground">Match</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {results.sponsorshipEligible.length > 0 && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Visa Sponsorship Available</span>
                  <Badge className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-none">
                    {results.sponsorshipEligible.length} roles
                  </Badge>
                </div>
                {results.sponsorshipEligible.slice(0, 3).map((job) => (
                  <div key={job.jobId} className="flex items-center justify-between py-2 border-b border-emerald-500/10 last:border-0">
                    <div>
                      <div className="text-sm font-medium">{job.title}</div>
                      <div className="text-xs text-muted-foreground">{job.company} &middot; {job.location}</div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-none text-xs">
                      {job.sponsorshipScore}/100
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Ranked Matches
            </h3>
            <div className="space-y-3">
              {results.matches.slice(0, 10).map((match, i) => (
                <motion.div
                  key={match.jobId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`hover:border-primary/30 transition-colors ${match.hiddenTalent ? "border-purple-500/30 bg-purple-500/[0.02]" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{match.title}</span>
                            {match.hiddenTalent && (
                              <Badge className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-300 border-none">
                                Hidden Gem
                              </Badge>
                            )}
                            {match.visaSponsored && (
                              <Badge className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-none">
                                Visa Sponsorship
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{match.company}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{match.location}</span>
                            {match.salary && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{match.salary}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-2xl font-black ${match.matchScore >= 80 ? "text-emerald-500" : match.matchScore >= 60 ? "text-amber-500" : "text-muted-foreground"}`}>
                            {match.matchScore}%
                          </div>
                          <div className="text-[10px] text-muted-foreground">Match</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {match.exactMatchSkills.slice(0, 4).map((s, i) => (
                          <Badge key={i} className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none">{s}</Badge>
                        ))}
                        {match.transferableMatchSkills.slice(0, 3).map((s, i) => (
                          <Badge key={i} className="text-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-400 border-none italic">{s}*</Badge>
                        ))}
                        {match.skillGaps.slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground border-dashed">{s}</Badge>
                        ))}
                      </div>

                      {match.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                          {match.reasons.map((r, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <Zap className="h-3 w-3 text-primary/60" />
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
