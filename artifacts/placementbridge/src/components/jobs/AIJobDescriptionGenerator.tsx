import { useState } from "react";
import { Sparkles, Loader2, Wand2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

interface AIJobDescriptionGeneratorProps {
  onGenerate: (result: {
    description: string;
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
  }) => void;
  initialValues?: {
    title?: string;
    company?: string;
    location?: string;
  };
}

export default function AIJobDescriptionGenerator({ onGenerate, initialValues }: AIJobDescriptionGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({
    title: initialValues?.title || "",
    industry: "",
    location: initialValues?.location || "",
    experienceLevel: "",
    employmentType: "Full-Time",
    skills: "",
    salaryRange: "",
    companyName: initialValues?.company || "",
    companyOverview: "",
    aboutRole: "",
  });

  const handleGenerate = async () => {
    if (!fields.title.trim()) return;
    setLoading(true);
    try {
      const result = await api.generateJobDescription({
        title: fields.title,
        industry: fields.industry || undefined,
        location: fields.location || undefined,
        experienceLevel: fields.experienceLevel || undefined,
        employmentType: fields.employmentType || undefined,
        skills: fields.skills ? fields.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
        salaryRange: fields.salaryRange || undefined,
        companyName: fields.companyName || undefined,
        companyOverview: fields.companyOverview || undefined,
        aboutRole: fields.aboutRole || undefined,
      });
      onGenerate({
        description: result.description,
        responsibilities: result.responsibilities,
        requirements: result.requirements,
        benefits: result.benefits,
      });
    } catch (e) {
      console.error("Failed to generate JD:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">Generate with AI</span>
          </div>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Job Title *</Label>
                <Input
                  value={fields.title}
                  onChange={(e) => setFields({ ...fields, title: e.target.value })}
                  placeholder="e.g. Senior React Developer"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Industry</Label>
                <Input
                  value={fields.industry}
                  onChange={(e) => setFields({ ...fields, industry: e.target.value })}
                  placeholder="e.g. Technology, Healthcare"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <Input
                  value={fields.location}
                  onChange={(e) => setFields({ ...fields, location: e.target.value })}
                  placeholder="e.g. Doha, Qatar"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Experience Level</Label>
                <Input
                  value={fields.experienceLevel}
                  onChange={(e) => setFields({ ...fields, experienceLevel: e.target.value })}
                  placeholder="e.g. Senior, Mid-Level"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Employment Type</Label>
                <Input
                  value={fields.employmentType}
                  onChange={(e) => setFields({ ...fields, employmentType: e.target.value })}
                  placeholder="Full-Time, Contract, Part-Time"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Salary Range</Label>
                <Input
                  value={fields.salaryRange}
                  onChange={(e) => setFields({ ...fields, salaryRange: e.target.value })}
                  placeholder="e.g. $80k - $120k"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Company Name</Label>
                <Input
                  value={fields.companyName}
                  onChange={(e) => setFields({ ...fields, companyName: e.target.value })}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Key Skills (comma-separated)</Label>
                <Input
                  value={fields.skills}
                  onChange={(e) => setFields({ ...fields, skills: e.target.value })}
                  placeholder="React, Node.js, TypeScript"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Company Overview</Label>
              <Textarea
                value={fields.companyOverview}
                onChange={(e) => setFields({ ...fields, companyOverview: e.target.value })}
                placeholder="Brief description of the company..."
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Additional Context</Label>
              <Textarea
                value={fields.aboutRole}
                onChange={(e) => setFields({ ...fields, aboutRole: e.target.value })}
                placeholder="Any extra details about the role, team, or requirements..."
                rows={2}
              />
            </div>

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !fields.title.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Job Description
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
