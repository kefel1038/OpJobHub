import { Link, useLocation } from "wouter";
import { Shield, Menu, Sparkles, Building2, Briefcase, Globe } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex flex-col items-center gap-0.5 group mr-6">
          <div className="bg-[#0f172a] h-10 w-11 flex items-center justify-center rounded-sm border border-slate-700 shadow-sm transition-transform group-hover:scale-105">
            <span className="font-serif text-white text-2xl font-bold leading-none tracking-tighter drop-shadow-sm" style={{ fontFamily: "Georgia, serif" }}>KF</span>
          </div>
          <span className="text-[9px] font-bold tracking-widest text-foreground uppercase">KeFeL Media</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Find Jobs
          </Link>
          <Link href="/post-job" className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            <Building2 className="h-4 w-4 text-primary" />
            For Employers
          </Link>
          <Link href="/ai-matching" className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Matching
          </Link>
          <Link href="/solutions/freelance" className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            <Briefcase className="h-4 w-4 text-primary" />
            Freelance
          </Link>

          {user?.role === "admin" && (
            <Link href="/admin" className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors ml-2 border-l border-border pl-6">
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" className="text-foreground/80 hover:text-foreground hidden lg:flex items-center gap-1.5 font-medium">
            <Globe className="h-4 w-4" />
            English
          </Button>
          {user ? (
            <>
              <Badge variant="secondary" className="capitalize font-medium">
                {user.role}
              </Badge>
              <span className="text-sm text-muted-foreground hidden lg:inline">{user.email}</span>
              <Button variant="ghost" onClick={handleLogout} className="text-foreground/80">
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-foreground/80">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="rounded-full px-5">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-md hover:bg-muted"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-muted text-sm"
            >
              Find Jobs
            </Link>
            <Link
              href="/ai-matching"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-muted text-sm flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              AI Matching
            </Link>
            {user && (user.role === "employer" || user.role === "admin") && (
              <Link
                href="/post-job"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-muted text-sm"
              >
                Post a Job
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-muted text-sm flex items-center gap-1.5"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            <div className="border-t border-border my-2" />
            {user ? (
              <button
                onClick={handleLogout}
                className="text-left px-3 py-2 rounded-md hover:bg-muted text-sm"
              >
                Sign out ({user.email})
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-muted text-sm"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium text-center"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
