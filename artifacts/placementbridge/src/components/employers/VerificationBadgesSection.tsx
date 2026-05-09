import { motion } from "framer-motion";
import {
  ShieldCheck, Passport, Fingerprint, Briefcase,
  FileCheck, HeartPulse, Plane, Languages,
  CheckCircle2, Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const verificationBadges = [
  {
    icon: ShieldCheck,
    title: "Passport Verified",
    description: "International passport authenticated and verified against government databases.",
    color: "from-blue-600 to-blue-400",
    bgColor: "bg-blue-50",
  },
  {
    icon: Fingerprint,
    title: "Identity Verified",
    description: "Biometric and national ID verification with liveness detection.",
    color: "from-indigo-600 to-indigo-400",
    bgColor: "bg-indigo-50",
  },
  {
    icon: Briefcase,
    title: "Experience Verified",
    description: "Work history and references confirmed with previous employers.",
    color: "from-emerald-600 to-emerald-400",
    bgColor: "bg-emerald-50",
  },
  {
    icon: FileCheck,
    title: "Police Clearance",
    description: "Certificate of good conduct from relevant authorities.",
    color: "from-purple-600 to-purple-400",
    bgColor: "bg-purple-50",
  },
  {
    icon: HeartPulse,
    title: "Medical Cleared",
    description: "Comprehensive medical examination passed for Gulf country requirements.",
    color: "from-rose-600 to-rose-400",
    bgColor: "bg-rose-50",
  },
  {
    icon: Plane,
    title: "Visa Ready",
    description: "Documentation complete and ready for visa application process.",
    color: "from-cyan-600 to-cyan-400",
    bgColor: "bg-cyan-50",
  },
  {
    icon: Languages,
    title: "Language Certified",
    description: "Arabic, English proficiency verified through standardized testing.",
    color: "from-amber-600 to-amber-400",
    bgColor: "bg-amber-50",
  },
];

const candidateExample = {
  name: "Joseph Okello",
  role: "Construction Foreman",
  location: "Kampala, Uganda",
  experience: "8 years",
  availability: "Immediate",
  visaStatus: "Visa Ready",
  matchScore: 96,
};

export function VerificationBadgesSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-blue opacity-30 pointer-events-none" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-blue-600 font-bold text-sm tracking-widest uppercase mb-4 block">
            Trust & Verification
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">
            Every candidate is{" "}
            <span className="text-gradient-blue">verified</span>
          </h2>
          <p className="text-gray-500 max-w-3xl mx-auto text-lg">
            Our 7-point verification system ensures every candidate is who they say they are.
            Hire with complete confidence.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Badge List */}
          <div className="grid sm:grid-cols-2 gap-4">
            {verificationBadges.map((badge, i) => (
              <motion.div
                key={badge.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-blue-200 transition-all duration-300 card-hover"
              >
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl ${badge.bgColor} flex items-center justify-center shrink-0`}>
                    <badge.icon className={`h-6 w-6 ${badge.color.replace("from-", "text-").split(" ")[0].replace("to-", "")}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800 text-sm">{badge.title}</h3>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{badge.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Candidate Preview Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="sticky top-28"
          >
            <div className="bg-gradient-to-br from-navy-900 to-blue-900 rounded-3xl p-8 border border-blue-500/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 rounded-full px-3 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Available Now
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full px-3 py-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Score: {candidateExample.matchScore}%
                </Badge>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-xl">
                  {candidateExample.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{candidateExample.name}</h3>
                  <p className="text-blue-200/70">{candidateExample.role}</p>
                  <p className="text-xs text-blue-300/50">{candidateExample.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Experience", value: candidateExample.experience },
                  { label: "Availability", value: candidateExample.availability },
                  { label: "Visa Status", value: candidateExample.visaStatus },
                  { label: "Language", value: "English, Swahili" },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="text-xs text-blue-300/50">{item.label}</div>
                    <div className="text-sm font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Verification Badges Row */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="text-xs text-blue-300/50 font-medium mb-3 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  All 7 verifications passed
                </div>
                <div className="flex flex-wrap gap-2">
                  {verificationBadges.map((badge) => (
                    <div
                      key={badge.title}
                      className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 border border-white/5"
                    >
                      <badge.icon className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] text-blue-200 font-medium">{badge.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
