import { changeLanguage } from "@/components/GoogleTranslate";
import { Mail, Phone, MapPin, Building2, Briefcase, Users, Sparkles, Globe } from "lucide-react";
import { Link } from "wouter";
import { KefelJobsLogo } from "@/components/ui/KefelJobsLogo";

export function Footer() {
  return (
    <footer className="bg-black text-white py-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-24 city-silhouette opacity-20 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-6 gap-12 mb-20">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center mb-8">
              <KefelJobsLogo variant="full" height={48} className="text-white fill-current" />
            </div>
            <p className="text-white/60 font-bold max-w-sm leading-relaxed mb-8">
              Africa-to-Gulf AI-powered workforce recruitment platform. Connecting top talent with leading companies across the Middle East.
            </p>
            <div className="space-y-3 text-white/60 font-bold mb-8">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#FFBF00]" />
                <a href="mailto:kefel1038@gmail.com" className="hover:text-white transition-colors">kefel1038@gmail.com</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#FFBF00]" />
                <a href="tel:+97451306916" className="hover:text-white transition-colors">+974 5130 6916</a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#FFBF00]" />
                <span>Doha, Qatar</span>
              </div>
            </div>
            <div className="flex gap-6">
              <a href="#" className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#FFBF00] hover:text-black transition-all">FB</a>
              <a href="#" className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#FFBF00] hover:text-black transition-all">TW</a>
              <a href="#" className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#FFBF00] hover:text-black transition-all">LI</a>
            </div>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="text-[#FFBF00] font-black uppercase italic mb-8 tracking-widest">For Employers</h4>
            <ul className="space-y-4 font-bold text-white/60">
              <li><Link href="/employers" className="hover:text-white transition-colors">Employer Hub</Link></li>
              <li><Link href="/post-job" className="hover:text-white transition-colors">Post a Job</Link></li>
              <li><a href="/jobs?type=candidates" className="hover:text-white transition-colors">Browse Candidates</a></li>
              <li><Link href="/employer/dashboard" className="hover:text-white transition-colors">Employer Dashboard</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/ai-matching" className="hover:text-white transition-colors">Workforce Intel</Link></li>
            </ul>
          </div>

          {/* For Jobseekers */}
          <div>
            <h4 className="text-[#FFBF00] font-black uppercase italic mb-8 tracking-widest">For Jobseekers</h4>
            <ul className="space-y-4 font-bold text-white/60">
              <li><Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
              <li><Link href="/ai-matching" className="hover:text-white transition-colors">Workforce Matching</Link></li>
              <li><Link href="/resources" className="hover:text-white transition-colors">Career Resources</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Create Profile</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-[#FFBF00] font-black uppercase italic mb-8 tracking-widest">Solutions</h4>
            <ul className="space-y-4 font-bold text-white/60">
              <li><Link href="/employers" className="hover:text-white transition-colors">Bulk Hiring</Link></li>
              <li><Link href="/employers" className="hover:text-white transition-colors">International Recruitment</Link></li>
              <li><Link href="/employers" className="hover:text-white transition-colors">Workforce Outsourcing</Link></li>
              <li><Link href="/employers" className="hover:text-white transition-colors">Executive Search</Link></li>
              <li><Link href="/freelance" className="hover:text-white transition-colors">Freelance Marketplace</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[#FFBF00] font-black uppercase italic mb-8 tracking-widest">Company</h4>
            <ul className="space-y-4 font-bold text-white/60">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/10">
          <div className="grid md:grid-cols-3 items-center gap-6 text-sm font-bold text-white/40 uppercase tracking-widest">
            <p>© {new Date().getFullYear()} KeFeL Jobs. Built in Qatar.</p>
            <div className="flex items-center justify-center gap-6 text-center">
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Africa-to-Gulf Recruitment</span>
              <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI-Powered</span>
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Enterprise Ready</span>
            </div>
            <div className="flex justify-end gap-8">
              <span onClick={() => changeLanguage("en")} className="hover:text-white cursor-pointer transition-colors">English</span>
              <span onClick={() => changeLanguage("ar")} className="hover:text-white cursor-pointer transition-colors">Arabic</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
