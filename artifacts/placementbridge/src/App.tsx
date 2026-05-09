import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import PostJob from "@/pages/post-job";
import JobDetail from "@/pages/job-detail";
import Jobs from "@/pages/jobs";
import Admin from "@/pages/admin";
import AdminSignup from "@/pages/admin-signup";
import AIMatching from "@/pages/ai-matching";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/post-job" component={PostJob} />
      <Route path="/jobs/:id" component={JobDetail} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/signup" component={AdminSignup} />
      <Route path="/ai-matching" component={AIMatching} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
