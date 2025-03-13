import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation";
import Home from "@/pages/home";
import UserDiary from "@/pages/user-diary";
import NotFound from "@/pages/not-found";

function Router() {
  // Always show navigation except on home page
  const isHomePage = window.location.pathname === '/';

  return (
    <>
      {!isHomePage && <Navigation />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/:username" component={UserDiary} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;