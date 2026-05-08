import { Link, useLocation } from "wouter";
import { Shield, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            K
          </div>
          <span className="font-bold text-lg tracking-tight">
            KeFeL <span className="text-primary">Jobs</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground">
            <Link href="/">Find Jobs</Link>
          </Button>
          {user && (user.role === "employer" || user.role === "admin") && (
            <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground">
              <Link href="/post-job">Post a Job</Link>
            </Button>
          )}
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
