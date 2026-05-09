import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowRight, Mail, Lock, Eye, Fingerprint } from "lucide-react";

export default function Privacy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "Information We Collect",
      content: "We collect information you provide directly when creating an account, posting a job, applying for positions, or communicating with us. This includes your name, email address, phone number, professional history, education, skills, and resume documents. We also collect usage data such as page views, searches, applications submitted, and interactions with our platform features.",
    },
    {
      title: "How We Use Your Information",
      content: "Your information is used to provide and improve our recruitment services, match candidates with job opportunities, facilitate communication between job seekers and employers, process applications, send relevant job alerts, personalize your experience, and comply with legal obligations. We do not sell your personal data to third parties.",
    },
    {
      title: "Data Sharing & Disclosure",
      content: "We share your information with employers when you apply for a job, with service providers who help us operate the platform (analytics, hosting, customer support), and when required by law. Job seekers' profiles are visible to registered employers on our platform. We never share sensitive personal data without explicit consent.",
    },
    {
      title: "Data Security",
      content: "We implement industry-standard security measures including 256-bit SSL/TLS encryption for all data in transit, encrypted storage at rest, regular security audits, and strict access controls. Our infrastructure is hosted on secure cloud servers with 99.9% uptime guarantees. However, no method of transmission over the Internet is 100% secure.",
    },
    {
      title: "Your Rights",
      content: "You have the right to access, correct, update, or delete your personal data at any time through your account settings. You can export your data, withdraw consent for marketing communications, and request permanent account deletion. We respond to all data requests within 30 days as required by applicable data protection laws.",
    },
    {
      title: "Cookies & Tracking",
      content: "We use essential cookies for platform functionality, analytics cookies to understand usage patterns, and preference cookies to remember your settings. You can control cookie preferences through your browser settings. Third-party services integrated with our platform may also use cookies subject to their own privacy policies.",
    },
    {
      title: "International Data Transfers",
      content: "As a platform connecting talent across Africa and the Gulf, your data may be transferred to and processed in countries including Qatar, United Arab Emirates, Saudi Arabia, Kenya, Nigeria, Ghana, and South Africa. We ensure appropriate safeguards are in place for all international data transfers in compliance with GDPR and relevant data protection regulations.",
    },
    {
      title: "Third-Party Services",
      content: "Our platform integrates with third-party services including Google Analytics for usage analytics, Stripe for payment processing, SendGrid for email communications, and cloud infrastructure providers. Each third party has its own privacy policy governing data handling. We review all third-party data processing agreements to ensure compliance.",
    },
    {
      title: "Changes to This Policy",
      content: "We may update this privacy policy from time to time. Changes will be posted on this page with an updated effective date. We will notify users of material changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the updated policy.",
    },
    {
      title: "Contact Us",
      content: "For questions about this privacy policy or to exercise your data rights, contact our Data Protection Officer at kefel1038@gmail.com or write to: KeFeL Media, Doha, Qatar. We aim to respond to all inquiries within 48 hours.",
    },
  ];

  return (
    <Layout>
      <section className="relative min-h-[40vh] hero-gradient-employer overflow-hidden">
        <div className="absolute inset-0 bg-grid-white opacity-[0.03] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 pt-32 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge className="bg-white/10 text-blue-300 border-white/20 rounded-full px-5 py-1.5 text-sm mb-6">
              <Shield className="h-4 w-4 mr-1" />
              Legal
            </Badge>
            <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-4">
              Privacy{" "}
              <span className="text-gradient-electric">Policy</span>
            </h1>
            <p className="text-lg text-blue-200/60 max-w-2xl">
              Last updated: May 2026. Learn how KeFeL Job Hub collects, uses, and protects your personal data.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      </section>

      <section className="py-16 bg-white dark:bg-[#070B2E] relative">
        <div className="absolute inset-0 bg-grid-blue opacity-30 dark:opacity-[0.03]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="prose prose-lg dark:prose-invert max-w-none"
            >
              <div className="bg-blue-50 dark:bg-blue-500/5 rounded-2xl p-6 border border-blue-100 dark:border-blue-500/10 mb-10">
                <p className="text-gray-700 dark:text-blue-200/80 leading-relaxed m-0">
                  At KeFeL Job Hub, we take your privacy seriously. This policy describes how we collect, 
                  use, and protect your personal information when you use our recruitment platform. 
                  By using our services, you consent to the practices described in this policy.
                </p>
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
                    <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{section.title}</h2>
                      <p className="text-gray-600 dark:text-blue-200/70 leading-relaxed">{section.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-blue-300/60">
                    <Fingerprint className="h-4 w-4" />
                    GDPR Compliant · Data Protection Registered
                  </div>
                  <Button asChild variant="outline" className="rounded-full border-blue-400/30 text-blue-600 dark:text-blue-400">
                    <Link href="/contact">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact DPO
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
