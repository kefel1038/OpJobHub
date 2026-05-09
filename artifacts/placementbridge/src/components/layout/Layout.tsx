import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { motion } from "framer-motion";
import { changeLanguage } from "@/components/GoogleTranslate";
import { Mail, Phone, MapPin } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

export function Layout({ children, showNavbar = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white selection:bg-primary selection:text-black">
      {showNavbar && <Navbar />}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.main>
      
      {/* Footer */}
      <footer className="bg-black text-white py-20 relative overflow-hidden">
        {/* Graphics */}
        <div className="absolute top-0 left-0 right-0 h-24 city-silhouette opacity-20 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <img src="/logo.png" alt="KeFeL Media" className="h-12 w-auto" />
              </div>
              <p className="text-white/60 font-bold max-w-sm leading-relaxed mb-8">
                Empowering careers in the Gulf through AI-driven matching and recruitment intelligence. 
                Connecting top talent with the region's leading companies.
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
            <div>
              <h4 className="text-[#FFBF00] font-black uppercase italic mb-8 tracking-widest">Platform</h4>
              <ul className="space-y-4 font-bold text-white/60">
                <li><a href="/jobs" className="hover:text-white transition-colors">Browse Jobs</a></li>
                <li><a href="/ai-matching" className="hover:text-white transition-colors">AI Matching</a></li>
                <li><a href="/employers" className="hover:text-white transition-colors">For Employers</a></li>
                <li><a href="/career-tools" className="hover:text-white transition-colors">Career Tools</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#FFBF00] font-black uppercase italic mb-8 tracking-widest">Company</h4>
              <ul className="space-y-4 font-bold text-white/60">
                <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-bold text-white/40 uppercase tracking-widest">
            <p>© {new Date().getFullYear()} KeFeL Jobs. Built in Qatar.</p>
            <div className="flex gap-8">
              <span onClick={() => changeLanguage("en")} className="hover:text-white cursor-pointer transition-colors">English</span>
              <span onClick={() => changeLanguage("ar")} className="hover:text-white cursor-pointer transition-colors">Arabic</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
