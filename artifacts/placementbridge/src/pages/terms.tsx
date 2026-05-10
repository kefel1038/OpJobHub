import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, ArrowRight, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "Acceptance of Terms",
      content: "By accessing or using KeFeL Job Hub, you agree to be bound by these Terms of Service. If you do not agree, do not use our platform. We may update these terms at any time, and continued use constitutes acceptance of changes. It is your responsibility to review these terms periodically.",
    },
    {
      title: "Account Registration",
      content: "You must be at least 18 years old to create an account. You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.",
    },
    {
      title: "Job Seeker Obligations",
      content: "Job seekers agree to provide truthful information in their profiles, resumes, and applications. Misrepresentation of qualifications, experience, or identity may result in immediate account suspension. You agree not to apply for positions for which you are not qualified or to submit fraudulent applications.",
    },
    {
      title: "Employer Obligations",
      content: "Employers agree to post genuine job opportunities with accurate descriptions, salary ranges, and requirements. Discriminatory job postings are strictly prohibited. Employers must respond to applications in a timely manner and maintain professional conduct. Misuse of the platform may result in account termination.",
    },
    {
      title: "Prohibited Conduct",
      content: "Users may not: post false or misleading information, harass other users, attempt to bypass security systems, scrape or mine platform data, use the platform for spam or unsolicited communications, impersonate others, engage in fraudulent activities, or violate any applicable laws. Violations will result in immediate account termination.",
    },
    {
      title: "Intellectual Property",
      content: "The KeFeL Job Hub platform, including its design, code, trademarks, and content, is owned by KeFeL Media. Users retain ownership of content they post but grant KeFeL a license to display and distribute that content on the platform. You may not copy, modify, or distribute platform content without written permission.",
    },
    {
      title: "Fees & Payments",
      content: "Basic job seeker accounts are free. Employer services, featured job postings, and premium features are subject to fees as described on our pricing page. All fees are non-refundable unless specified otherwise. Payments are processed securely through our third-party payment processor. Subscription terms are specified at checkout.",
    },
    {
      title: "Limitation of Liability",
      content: "KeFeL Job Hub acts as a platform connecting job seekers and employers. We are not responsible for the accuracy of job postings, the quality of candidates, hiring decisions, or any disputes between users. Our liability is limited to the maximum extent permitted by law. We do not guarantee employment or successful hiring outcomes.",
    },
    {
      title: "Termination",
      content: "We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or negatively impact the platform experience. Users may terminate their account at any time through account settings. Upon termination, your right to use the platform ceases immediately.",
    },
    {
      title: "Dispute Resolution",
      content: "Any disputes arising from these terms or platform use shall be governed by the laws of Qatar. Users agree to attempt informal resolution before pursuing legal action. If unresolved, disputes will be settled through binding arbitration in Doha, Qatar. Both parties bear their own legal costs unless otherwise determined.",
    },
  ];

  return (
    <Layout>
      <section className="relative min-h-[40vh] hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-grid-white opacity-[0.03] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 pt-32 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge className="bg-white/5 text-blue-300 border-white/10 rounded-full px-5 py-1.5 text-sm mb-6">
              <Scale className="h-4 w-4 mr-1" />
              Legal
            </Badge>
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-4">
              Terms of{" "}
              <span className="text-gradient">Service</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl">
              Last updated: May 2026. Please read these terms carefully before using KeFeL Job Hub.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      </section>

      <section className="py-16 bg-default relative">
        <div className="absolute inset-0 bg-grid-white opacity-[0.02]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid sm:grid-cols-3 gap-4 mb-10">
                {[
                  { icon: CheckCircle2, label: "Last Updated", value: "May 2026", color: "text-blue-400" },
                  { icon: AlertCircle, label: "Jurisdiction", value: "Qatar", color: "text-amber-400" },
                  { icon: Scale, label: "Governing Law", value: "Qatar Law", color: "text-emerald-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-elevated rounded-2xl p-4 border border-subtle text-center">
                    <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
                    <div className="text-xs text-gray-500">{stat.label}</div>
                    <div className={`font-bold text-sm ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {sections.map((section, i) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i + 0.3 }}
                  className="mb-10"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-amber-400">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-100 mb-3">{section.title}</h2>
                      <p className="text-gray-400 leading-relaxed">{section.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              <div className="mt-12 pt-8 border-t border-subtle">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-sm text-gray-500">
                    Questions about these terms? Contact our legal team.
                  </p>
                  <div className="flex gap-3">
                    <Button asChild variant="outline" className="rounded-full border-blue-400/30 text-blue-400">
                      <Link href="/privacy">
                        View Privacy Policy
                      </Link>
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full">
                      <Link href="/contact">
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Us
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
