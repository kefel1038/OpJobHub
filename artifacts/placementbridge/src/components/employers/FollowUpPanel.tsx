import { useState, useEffect } from "react";
import { MessageSquare, Send, Loader2, Check, Clock, User, Briefcase, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

interface FollowUp {
  applicationId: number;
  status: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  appliedAt: string;
}

const stageLabels: Record<string, string> = {
  applied: "Application Received",
  reviewed: "Under Review",
  shortlisted: "Shortlisted",
  interviewed: "Interviewed",
  hired: "Hired",
  rejected: "Rejected",
};

export default function FollowUpPanel() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [customMode, setCustomMode] = useState<number | null>(null);
  const [customText, setCustomText] = useState("");

  useEffect(() => {
    api.getPendingFollowUps()
      .then((data) => setFollowUps(data.followUps))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (app: FollowUp, useCustom: boolean) => {
    setGenerating(app.applicationId);
    try {
      const result = await api.generateFollowUp(app.applicationId, {
        stage: app.status,
        candidateName: app.candidateName,
        jobTitle: app.jobTitle,
        companyName: app.companyName,
        ...(useCustom && customText ? { customInstructions: customText } : {}),
      });
      setMessages((prev) => ({ ...prev, [app.applicationId]: result.message }));
      setCustomMode(null);
      setCustomText("");
    } catch (e) {
      console.error("Failed to generate follow-up:", e);
    } finally {
      setGenerating(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          AI Follow-Up Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {followUps.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <Check className="h-8 w-8 text-green-500" />
            <p className="text-sm">All candidates have been followed up with.</p>
          </div>
        ) : (
          followUps.map((app) => (
            <div key={app.applicationId} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{app.candidateName}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {stageLabels[app.status] || app.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {app.jobTitle}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {messages[app.applicationId] ? (
                <div className="space-y-2">
                  <div className="bg-primary/5 border border-primary/10 rounded-md p-3 text-sm whitespace-pre-wrap">
                    {messages[app.applicationId]}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(messages[app.applicationId])}>
                      Copy Message
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setMessages((prev) => { const next = { ...prev }; delete next[app.applicationId]; return next; }); }}>
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : customMode === app.applicationId ? (
                <div className="space-y-2">
                  <Textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Add custom instructions (e.g., 'Mention the specific project they'd work on')"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleGenerate(app, true)} disabled={generating === app.applicationId}>
                      {generating === app.applicationId ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3 mr-1" />
                      )}
                      Generate with AI
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCustomMode(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleGenerate(app, false)} disabled={generating === app.applicationId}>
                    {generating === app.applicationId ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    Generate Follow-Up
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCustomMode(app.applicationId)}>
                    Customize
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
