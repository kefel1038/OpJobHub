import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "employer" | "admin" | "jobseeker";
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole = "employer", 
  redirectTo = "/employers" 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation(redirectTo);
    } else if (requiredRole && user?.role !== requiredRole) {
      // Redirect if user has wrong role
      if (user?.role === "admin") setLocation("/admin");
      else setLocation("/");
    }
  }, [isAuthenticated, user, requiredRole, redirectTo, setLocation]);

  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
