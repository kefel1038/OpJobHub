import { Share2, Linkedin, Twitter, MessageCircle, Send, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Job } from "@/lib/api";

interface SocialShareButtonsProps {
  job: Job;
  compact?: boolean;
}

export default function SocialShareButtons({ job, compact = false }: SocialShareButtonsProps) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/jobs/${job.id}` : "";
  const title = `Hiring: ${job.title} at ${job.company}`;
  const hashtags = ["Hiring", "Jobs", "QatarJobs", "GulfJobs"];

  const shareText = `${title}\n📍 ${job.location}\n💰 ${job.salary || "Competitive"}\n\nApply here: ${url}`;

  const linkedInText = encodeURIComponent(
    `🚀 We're hiring! 🚀\n\n${title}\n📍 Location: ${job.location}\n💰 Salary: ${job.salary || "Competitive"}\n\n${job.description?.slice(0, 300)}...\n\nApply now: ${url}\n\n#Hiring #${job.title?.replace(/\s+/g, "") || "Jobs"} #GulfJobs`
  );

  const whatsAppText = encodeURIComponent(
    `🚨 *NEW JOB ALERT* 🚨\n\n*${title}*\n📍 ${job.location}\n💰 ${job.salary || "Competitive"}\n\n${url}`
  );

  const telegramText = encodeURIComponent(
    `📢 *New Job Opportunity*\n\n**${title}**\n📍 ${job.location}\n💰 ${job.salary || "Competitive"}\n\n${url}\n\n#Jobs #${job.title?.replace(/\s+/g, "") || "Hiring"}`
  );

  const twitterText = encodeURIComponent(
    `${title} in ${job.location}${job.salary ? ` - ${job.salary}` : ""}\n\nApply: ${url}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`
  );

  const facebookText = encodeURIComponent(`${title}\n\n📍 ${job.location}\n💰 ${job.salary || "Competitive"}\n\n${url}`);

  return (
    <div className={`flex ${compact ? "gap-1" : "flex-wrap gap-2"}`}>
      <Button
        variant="outline"
        size={compact ? "icon" : "sm"}
        className={compact ? "h-8 w-8" : "gap-1.5"}
        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${linkedInText}`, "_blank")}
        title="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4 text-[#0A66C2]" />
        {!compact && <span className="hidden sm:inline">LinkedIn</span>}
      </Button>
      <Button
        variant="outline"
        size={compact ? "icon" : "sm"}
        className={compact ? "h-8 w-8" : "gap-1.5"}
        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${twitterText}`, "_blank")}
        title="Share on X / Twitter"
      >
        <Twitter className="h-4 w-4" />
        {!compact && <span className="hidden sm:inline">X</span>}
      </Button>
      <Button
        variant="outline"
        size={compact ? "icon" : "sm"}
        className={compact ? "h-8 w-8" : "gap-1.5"}
        onClick={() => window.open(`https://api.whatsapp.com/send?text=${whatsAppText}`, "_blank")}
        title="Share on WhatsApp"
      >
        <MessageCircle className="h-4 w-4 text-[#25D366]" />
        {!compact && <span className="hidden sm:inline">WhatsApp</span>}
      </Button>
      <Button
        variant="outline"
        size={compact ? "icon" : "sm"}
        className={compact ? "h-8 w-8" : "gap-1.5"}
        onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${telegramText}`, "_blank")}
        title="Share on Telegram"
      >
        <Send className="h-4 w-4 text-[#0088cc]" />
        {!compact && <span className="hidden sm:inline">Telegram</span>}
      </Button>
      <Button
        variant="outline"
        size={compact ? "icon" : "sm"}
        className={compact ? "h-8 w-8" : "gap-1.5"}
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${facebookText}`, "_blank")}
        title="Share on Facebook"
      >
        <Facebook className="h-4 w-4 text-[#1877F2]" />
        {!compact && <span className="hidden sm:inline">Facebook</span>}
      </Button>
    </div>
  );
}
