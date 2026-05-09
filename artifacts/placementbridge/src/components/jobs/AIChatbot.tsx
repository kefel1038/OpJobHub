import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Sparkles, Bot, User,
  ChevronDown, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
};

const initialMessages: Message[] = [
  {
    id: "0",
    role: "bot",
    content: "Hi! I'm your AI career assistant. I can help you find jobs, optimize your resume, or answer questions about your job search. What would you like to know?",
    timestamp: new Date(),
  },
];

const quickReplies = [
  "Find jobs for React developer",
  "Optimize my resume",
  "Salary trends in tech",
  "Top skills to learn",
];

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: getBotResponse(content.trim()),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center",
          "hover:bg-primary/90 transition-all"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] sm:w-[420px] h-[560px] rounded-2xl border border-border/60 bg-background shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border/60 bg-primary/5">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">AI Career Assistant</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                  Online &middot; Powered by GPT-4
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setOpen(false)}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                  <Avatar className={cn("h-8 w-8 shrink-0", msg.role === "bot" ? "" : "")}>
                    <AvatarFallback className={cn(
                      "text-xs",
                      msg.role === "bot" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {msg.role === "bot" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-md"
                      : "bg-muted/50 text-foreground rounded-tl-md border border-border/40"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="max-w-[80%] rounded-2xl rounded-tl-md px-4 py-3 bg-muted/50 border border-border/40">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSend(reply)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-primary/10 hover:text-primary transition-all border border-border/50"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-border/60">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
                  placeholder="Ask me anything..."
                  className="flex-1 h-11 px-4 rounded-xl bg-muted/50 border border-border/60 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button
                  size="icon"
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isTyping}
                  className="h-11 w-11 rounded-xl shrink-0"
                >
                  {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
                AI responses are generated for guidance. Verify important information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("react") || lower.includes("developer") || lower.includes("frontend")) {
    return "I found 47 React developer positions matching your profile. Top matches include Senior React Developer at Google ($150K-$220K), React Engineer at Meta ($140K-$200K), and Frontend Lead at Stripe ($160K-$240K). Would you like me to show more details?";
  }
  if (lower.includes("resume") || lower.includes("optimize")) {
    return "I can help optimize your resume! Here are my top suggestions:\n\n1. Add quantifiable achievements (e.g., 'Increased revenue by 25%')\n2. Include relevant keywords from the job description\n3. Keep it to one page for <10 years experience\n4. Use action verbs like 'Led', 'Built', 'Optimized'\n5. Add a skills section tailored to each application\n\nUpload your resume for a detailed ATS analysis!";
  }
  if (lower.includes("salary") || lower.includes("trend")) {
    return "Based on current market data:\n\n• Software Engineers: $90K-$200K (avg. $145K)\n• Data Scientists: $100K-$190K (avg. $135K)\n• Product Managers: $110K-$220K (avg. $155K)\n• DevOps Engineers: $100K-$180K (avg. $135K)\n\nSalaries have increased 8-12% YoY in tech. Would you like a detailed breakdown for a specific role?";
  }
  if (lower.includes("skill") || lower.includes("learn")) {
    return "The most in-demand skills right now:\n\n1. AI/Machine Learning (+180% demand)\n2. Cloud Computing (AWS/GCP/Azure)\n3. Cybersecurity\n4. Full-Stack Development\n5. Data Engineering\n6. UI/UX Design\n\nWhich area interests you most? I can suggest specific courses and certifications.";
  }
  return "Great question! Based on your interests, I recommend exploring opportunities in high-growth tech roles. The market is particularly strong for senior engineering positions, AI/ML specialists, and cloud architects. Would you like me to help you find specific job listings, optimize your resume, or explore career paths?";
}
