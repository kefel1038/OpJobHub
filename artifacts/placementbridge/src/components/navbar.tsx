import { Link, useLocation } from "wouter";
import { Shield, Menu, Sparkles } from "lucide-react";
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

        <nav className="hidden lg:flex items-center gap-1">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground bg-transparent">Employers</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[220px] gap-3 p-4 bg-background border-border">
                    <li className="text-[12px] font-bold text-[#f59e0b] tracking-widest flex items-center gap-2 mb-1">
                      <span className="h-3 w-3 bg-[#f59e0b]/20 flex items-center justify-center rounded-sm">
                        <span className="h-1.5 w-1.5 bg-[#f59e0b] rounded-sm"></span>
                      </span>
                      FOR EMPLOYERS
                    </li>
                    <li><Link href="/post-job" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Employer Hub</Link></li>
                    <li><Link href="/post-job" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Post a Job</Link></li>
                    <li><Link href="/browse-candidates" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Browse Candidates</Link></li>
                    <li><Link href="/employer-dashboard" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Employer Dashboard</Link></li>
                    <li><Link href="/pricing" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Pricing</Link></li>
                    <li><Link href="/ai-matching" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">AI Matching</Link></li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground bg-transparent">Jobseekers</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[220px] gap-3 p-4 bg-background border-border">
                    <li className="text-[12px] font-bold text-[#f59e0b] tracking-widest flex items-center gap-2 mb-1">
                       <span className="h-3 w-3 bg-[#f59e0b]/20 flex items-center justify-center rounded-sm">
                        <span className="h-1.5 w-1.5 bg-[#f59e0b] rounded-sm"></span>
                      </span>
                      FOR JOBSEEKERS
                    </li>
                    <li><Link href="/" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Browse Jobs</Link></li>
                    <li><Link href="/ai-matching" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">AI Career Match</Link></li>
                    <li><Link href="/resources" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Career Resources</Link></li>
                    <li><Link href="/register" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Create Profile</Link></li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground/80 hover:text-foreground bg-transparent">Solutions</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[240px] gap-3 p-4 bg-background border-border">
                    <li className="text-[12px] font-bold text-[#f59e0b] tracking-widest flex items-center gap-2 mb-1">
                      <span className="h-3 w-3 bg-[#f59e0b]/20 flex items-center justify-center rounded-sm">
                        <span className="h-1.5 w-1.5 bg-[#f59e0b] rounded-sm"></span>
                      </span>
                      SOLUTIONS
                    </li>
                    <li><Link href="/solutions/bulk-hiring" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Bulk Hiring</Link></li>
                    <li><Link href="/solutions/international" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">International Recruitment</Link></li>
                    <li><Link href="/solutions/outsourcing" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Workforce Outsourcing</Link></li>
                    <li><Link href="/solutions/executive" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Executive Search</Link></li>
                    <li><Link href="/solutions/freelance" className="block text-sm text-foreground/80 hover:text-foreground transition-colors font-medium">Freelance Marketplace</Link></li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {user?.role === "admin" && (
            <Button variant="ghost" asChild className="gap-1.5 text-foreground/80 hover:text-foreground">
              <Link href="/admin">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            </Button>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
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
