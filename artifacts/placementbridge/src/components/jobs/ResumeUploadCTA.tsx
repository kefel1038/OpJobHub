import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api, getToken } from "@/lib/api";
import { Upload, FileText, Sparkles, ChevronRight, CheckCircle2, AlertCircle, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

export function ResumeUploadCTA() {
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFile = async (file: File) => {
    setErrorMsg("");

    if (!ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES] && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      setErrorMsg("Invalid file type. Please upload PDF, DOCX, DOC, or TXT files.");
      setUploadState("error");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg("File is too large. Maximum size is 5MB.");
      setUploadState("error");
      return;
    }

    if (!isAuthenticated) {
      setErrorMsg("Please sign in to upload your resume.");
      setUploadState("error");
      return;
    }

    try {
      setUploadState("loading");
      const result = await api.analyzeResume(file);
      if (result?.analysis?.parsed?.skills?.length) {
        localStorage.setItem("resume_skills", JSON.stringify(result.analysis.parsed.skills));
      }
      setUploadState("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setErrorMsg(message);
      setUploadState("error");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
              onClick={() => uploadState === "idle" && fileInputRef.current?.click()}
              className={cn(
                "relative z-10 w-full lg:w-72 h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-300",
                uploadState === "success"
                  ? "border-emerald-500/50 bg-emerald-500/5 cursor-default"
                  : uploadState === "error"
                    ? "border-red-500/50 bg-red-500/5"
                    : uploadState === "loading"
                      ? "border-primary/50 bg-primary/5 cursor-default"
                      : isDragging
                        ? "border-primary bg-primary/5 scale-[1.02] cursor-pointer"
                        : "border-border/60 hover:border-primary/40 hover:bg-muted/30 cursor-pointer"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              {uploadState === "loading" ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Uploading & Analyzing...</p>
                    <p className="text-xs text-muted-foreground mt-1">Processing your resume</p>
                  </div>
                </>
              ) : uploadState === "success" ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-emerald-500">Resume Uploaded!</p>
                    <p className="text-xs text-muted-foreground mt-1">Analysis complete</p>
                  </div>
                  <a href="/ai-matching">
                    <Button size="sm" variant="outline" className="rounded-full text-xs h-8 mt-1">
                      View Analysis <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                </>
              ) : uploadState === "error" ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-red-500">{errorMsg.includes("sign in") ? "Sign In Required" : "Upload Failed"}</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">{errorMsg}</p>
                  </div>
                  {errorMsg.includes("sign in") ? (
                    <a href="/login">
                      <Button size="sm" className="rounded-full text-xs h-8 mt-1 gap-1">
                        <LogIn className="h-3 w-3" /> Sign In
                      </Button>
                    </a>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-full text-xs h-8 mt-1" onClick={() => setUploadState("idle")}>
                      Try Again
                    </Button>
                  )}
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
