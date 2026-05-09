import { Link, useLocation } from "wouter";
import { Menu, Sparkles, Briefcase, Users, LayoutDashboard, LogOut, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
        scrolled ? "bg-white/90 backdrop-blur-md border-b border-border py-2 shadow-sm" : "bg-white py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 group">
          <div className="flex items-center font-black text-2xl tracking-tighter uppercase italic">
            <span className="text-[#FF5722]">K</span>
            <span className="text-[#4CAF50]">E</span>
            <span className="text-[#2196F3]">F</span>
            <span className="text-[#FFEB3B]">E</span>
            <span className="text-[#9C27B0]">L</span>
          </div>
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors cursor-pointer text-sm font-medium">
            <Globe className="h-4 w-4" />
            <span>Select Language</span>
            <span className="text-[10px] opacity-50">▼</span>
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
              <Link href="/login" className="text-[15px] font-bold text-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Button asChild className="bg-[#FFBF00] text-black hover:bg-[#E6AC00] font-black rounded-[2rem] px-8 h-12 text-base shadow-sm">
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
            className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-border shadow-2xl p-6 flex flex-col gap-4"
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
            {!user && (
              <Link href="/login" onClick={() => setOpen(false)} className="text-lg font-bold">
                Login
              </Link>
            )}
            <Button asChild className="bg-[#FFBF00] text-black hover:bg-[#E6AC00] font-black rounded-full w-full py-6 text-lg">
              <Link href="/post-job" onClick={() => setOpen(false)}>Post a Job</Link>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
