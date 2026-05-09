import { Link, useLocation } from "wouter";
import { Menu, Sparkles, Briefcase, Users, LayoutDashboard, LogOut, Globe, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { changeLanguage } from "@/components/GoogleTranslate";

export function Navbar() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: "en", label: "English", native: "English" },
    { code: "ar", label: "Arabic", native: "العربية" },
  ];

  const handleLangChange = (code: string) => {
    setCurrentLang(code);
    setLangOpen(false);
    changeLanguage(code);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const navLinks = [
    { href: "/jobs", label: "Jobs" },
    { href: "/ai-matching", label: "AI Matching" },
    { href: "/employers", label: "For Employers" },
    { href: "/resources", label: "Resources" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#FFBF00]/95 backdrop-blur-md border-b-2 border-black py-2 shadow-lg" : "bg-[#FFBF00] py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 group">
          <img 
            src="/logo.png" 
            alt="KeFeL Media" 
            className="h-14 md:h-20 w-auto group-hover:scale-105 transition-transform invert" 
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className="text-[15px] font-bold text-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

          <div className="hidden lg:flex items-center gap-4">
            <div className="relative" ref={langRef}>
              <div
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black hover:bg-black/5 transition-colors cursor-pointer text-sm font-black uppercase italic"
              >
                <Globe className="h-4 w-4" />
                <span>{currentLang === "en" ? "English" : "العربية"}</span>
                <span className="text-[10px] opacity-50">▼</span>
              </div>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border-2 border-black rounded-xl shadow-2xl overflow-hidden z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangChange(lang.code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold transition-colors hover:bg-[#FFBF00]/10 ${
                        currentLang === lang.code ? "bg-[#FFBF00]/20 text-black" : "text-black"
                      }`}
                    >
                      <Globe className="h-4 w-4" />
                      <span>{lang.native}</span>
                      {currentLang === lang.code && <Check className="h-4 w-4 ml-auto text-[#FFBF00]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          
          {user ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
              <Button asChild className="bg-primary text-black hover:bg-primary/90 font-bold rounded-full px-6">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-[15px] font-black uppercase italic text-black hover:opacity-70 transition-opacity">
                Login
              </Link>
              <Button asChild className="bg-black text-[#FFBF00] hover:bg-zinc-900 font-black rounded-[2rem] px-8 h-12 text-base shadow-lg border-2 border-black">
                <Link href="/post-job">Post a Job</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2 rounded-full hover:bg-muted transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-[#FFBF00] border-b-2 border-black shadow-2xl p-6 flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-lg font-bold hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-border my-2" />
            <div className="flex gap-4 py-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { handleLangChange(lang.code); setOpen(false); }}
                  className={`flex items-center gap-2 text-base font-bold transition-colors ${
                    currentLang === lang.code ? "text-black" : "text-black/50"
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  {lang.native}
                </button>
              ))}
            </div>
            {!user && (
              <Link href="/login" onClick={() => setOpen(false)} className="text-lg font-bold">
                Login
              </Link>
            )}
            <Button asChild className="bg-black text-[#FFBF00] hover:bg-zinc-900 font-black rounded-full w-full py-6 text-lg">
              <Link href="/post-job" onClick={() => setOpen(false)}>Post a Job</Link>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
