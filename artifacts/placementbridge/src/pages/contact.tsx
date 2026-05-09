import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Phone, MapPin, MessageSquare, Send, Clock,
  CheckCircle2, Globe, ArrowRight, Linkedin, Twitter,
  Building2, HeadphonesIcon
} from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Layout>
      <section className="relative min-h-[90vh] hero-gradient-employer overflow-hidden">
        <div className="absolute inset-0 bg-grid-white opacity-[0.03]" />
        <div className="absolute top-40 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse-soft" />

        <div className="container mx-auto px-4 relative z-10 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-16">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full px-5 py-1.5 text-sm mb-6 inline-flex items-center gap-2">
                <HeadphonesIcon className="h-4 w-4" />
                Get in Touch
              </Badge>
              <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-4">
                Let's build the future of{" "}
                <span className="text-gradient-electric">recruitment</span>
              </h1>
              <p className="text-xl text-blue-200/60 max-w-2xl mx-auto">
                Have a question about our platform, want to partner with us, or need help with hiring?
                We're here to help.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {submitted ? (
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-10 border border-white/10 text-center">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                    <p className="text-blue-200/60 mb-6">We'll get back to you within 24 hours.</p>
                    <Button onClick={() => setSubmitted(false)} variant="outline" className="border-blue-400/30 text-blue-300 rounded-full">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-blue-200 font-medium mb-1.5 block">Full Name</label>
                        <input required className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50" placeholder="Your name" />
                      </div>
                      <div>
                        <label className="text-sm text-blue-200 font-medium mb-1.5 block">Email</label>
                        <input required type="email" className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="you@company.com" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-blue-200 font-medium mb-1.5 block">Subject</label>
                      <select className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                        <option value="" className="bg-navy-900">I'm an employer looking to hire</option>
                        <option className="bg-navy-900">I'm a job seeker</option>
                        <option className="bg-navy-900">I want to partner with KeFeL</option>
                        <option className="bg-navy-900">I need support</option>
                        <option className="bg-navy-900">Other inquiry</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-blue-200 font-medium mb-1.5 block">Message</label>
                      <textarea rows={5} required className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" placeholder="Tell us how we can help..." />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 rounded-xl h-12 font-bold shadow-lg shadow-blue-600/25 group">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                {[
                  { icon: Mail, label: "Email", value: "kefel1038@gmail.com", href: "mailto:kefel1038@gmail.com" },
                  { icon: Phone, label: "Phone", value: "+974 5130 6916", href: "tel:+97451306916" },
                  { icon: MapPin, label: "Location", value: "Doha, Qatar", href: null },
                  { icon: Clock, label: "Response Time", value: "Within 24 hours", href: null },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-blue-300/60">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="text-white font-semibold hover:text-blue-300 transition-colors">{item.value}</a>
                      ) : (
                        <div className="text-white font-semibold">{item.value}</div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl p-6 border border-blue-500/10">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-400" />
                    Follow Us
                  </h3>
                  <div className="flex gap-3">
                    {[
                      { icon: Linkedin, label: "LinkedIn", color: "hover:bg-blue-600" },
                      { icon: Twitter, label: "Twitter", color: "hover:bg-sky-500" },
                      { icon: Mail, label: "Email", color: "hover:bg-emerald-500" },
                    ].map((s) => (
                      <button key={s.label} className={`h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-300 hover:text-white ${s.color} transition-all`}>
                        <s.icon className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                  <h3 className="text-white font-bold mb-2">Enterprise Inquiries</h3>
                  <p className="text-blue-200/60 text-sm mb-4">Looking to hire at scale? Our enterprise team is ready to help.</p>
                  <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 rounded-full h-10 px-6 font-semibold shadow-lg shadow-blue-600/25 group">
                    <a href="mailto:kefel1038@gmail.com?subject=Enterprise%20Inquiry">
                      Talk to Sales
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
