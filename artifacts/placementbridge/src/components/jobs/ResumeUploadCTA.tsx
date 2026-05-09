import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ResumeUploadCTA() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploaded(true);
  };

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 rounded-3xl border border-border/60 bg-card p-8 lg:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />

            <div className="flex-1 relative z-10">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 rounded-full text-xs font-medium w-fit">
                <Sparkles className="h-3 w-3 mr-1" /> AI-Powered Analysis
              </Badge>
              <h2 className="text-3xl md:text-4xl font-heading font-black mb-3">
                Upload Your <span className="text-gradient">Resume</span>
              </h2>
              <p className="text-muted-foreground mb-2 max-w-md">
                Get instant AI-powered analysis, ATS compatibility score, and personalized job matches tailored to your skills.
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                {["ATS Score Analysis", "Skill Gap Detection", "Smart Job Matching", "Salary Insights"].map((feature) => (
                  <div key={feature} className="flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "relative z-10 w-full lg:w-72 h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-300 cursor-pointer",
                uploaded
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              {uploaded ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-emerald-500">Resume Uploaded!</p>
                    <p className="text-xs text-muted-foreground mt-1">Analysis in progress...</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full text-xs h-8 mt-1">
                    View Analysis <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Drop your resume here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse (PDF, DOCX, TXT)</p>
                  </div>
                  <Button size="sm" className="rounded-full text-xs h-8 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 gap-1">
                    <FileText className="h-3 w-3" /> Choose File
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
