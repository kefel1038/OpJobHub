import { Link, useLocation } from "wouter";
import { Shield, Menu, Sparkles, Briefcase, Users, LayoutDashboard, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    { href: "/jobs", label: "Find Jobs", icon: <Briefcase className="h-4 w-4" /> },
    { href: "/ai-matching", label: "AI Matching", icon: <Sparkles className="h-4 w-4 text-primary" />, highlight: true },
    { href: "/candidates", label: "Candidates", icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-border py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            K
          </div>
          <span className="font-heading font-bold text-xl tracking-tight hidden sm:block">
            KeFeL <span className="text-primary">Jobs</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Button 
              key={link.href} 
              variant="ghost" 
              asChild 
              className={`gap-2 rounded-full px-5 ${link.highlight ? "text-primary hover:text-primary hover:bg-primary/5" : "text-foreground/70 hover:text-foreground"}`}
            >
              <Link href={link.href}>
                {link.icon}
                {link.label}
              </Link>
            </Button>
          ))}
          {user?.role === "admin" && (
            <Button variant="ghost" asChild className="gap-2 rounded-full px-5 text-foreground/70 hover:text-foreground">
              <Link href="/admin">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            </Button>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-muted/50 p-1 pl-4 rounded-full border border-border/50">
              <span className="text-sm font-medium hidden lg:inline">{user.email}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
              <Button asChild className="rounded-full h-8 px-4 text-xs font-semibold">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" asChild className="rounded-full px-6 font-medium">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-muted transition-colors"
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
            className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-2xl p-4 flex flex-col gap-2"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-medium transition-colors"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="h-px bg-border my-2" />
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-medium"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out ({user.email})
                </button>
              </>
            ) : (
              <>
                <div className="h-px bg-border my-2" />
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-muted text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold text-center shadow-lg shadow-primary/20"
                >
                  Get started
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
