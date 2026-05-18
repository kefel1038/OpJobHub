import { Switch, Route, Router as WouterRouter } from "wouter";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { GoogleTranslateInit } from "@/components/GoogleTranslate";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import PostJob from "@/pages/post-job";
import EditJob from "@/pages/edit-job";

const JobDetail = lazy(() => import("@/pages/job-detail"));
const Jobs = lazy(() => import("@/pages/jobs"));
const Admin = lazy(() => import("@/pages/admin"));
const AdminSignup = lazy(() => import("@/pages/admin-signup"));
const AIMatching = lazy(() => import("@/pages/ai-matching"));
const Resources = lazy(() => import("@/pages/resources"));
const Pricing = lazy(() => import("@/pages/pricing"));
const Employers = lazy(() => import("@/pages/employers"));
const EmployerDashboard = lazy(() => import("@/pages/employer-dashboard"));
const EmployerOnboarding = lazy(() => import("@/pages/employer-onboarding"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Freelance = lazy(() => import("@/pages/freelance"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));

function SuspendedPage({ Component }: { Component: React.LazyExoticComponent<React.ComponentType> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <Component />
    </Suspense>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/post-job" component={PostJob} />
      <Route path="/jobs/:id/edit" component={EditJob} />
      <Route path="/jobs/:id">{() => <SuspendedPage Component={JobDetail} />}</Route>
      <Route path="/jobs">{() => <SuspendedPage Component={Jobs} />}</Route>
      <Route path="/admin">{() => <SuspendedPage Component={Admin} />}</Route>
      <Route path="/admin/signup">{() => <SuspendedPage Component={AdminSignup} />}</Route>
      <Route path="/ai-matching">{() => <SuspendedPage Component={AIMatching} />}</Route>
      <Route path="/resources">{() => <SuspendedPage Component={Resources} />}</Route>
      <Route path="/pricing">{() => <SuspendedPage Component={Pricing} />}</Route>
      <Route path="/employers">{() => <SuspendedPage Component={Employers} />}</Route>
      <Route path="/employer/dashboard">
        <ProtectedRoute requiredRole="employer">
          <SuspendedPage Component={EmployerDashboard} />
        </ProtectedRoute>
      </Route>
      <Route path="/employer/onboarding">
        <ProtectedRoute requiredRole="employer">
          <SuspendedPage Component={EmployerOnboarding} />
        </ProtectedRoute>
      </Route>
      <Route path="/about">{() => <SuspendedPage Component={About} />}</Route>
      <Route path="/contact">{() => <SuspendedPage Component={Contact} />}</Route>
      <Route path="/freelance">{() => <SuspendedPage Component={Freelance} />}</Route>
      <Route path="/privacy">{() => <SuspendedPage Component={Privacy} />}</Route>
      <Route path="/terms">{() => <SuspendedPage Component={Terms} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <TooltipProvider>
        <GoogleTranslateInit />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
