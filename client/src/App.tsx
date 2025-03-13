import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation";
import Home from "@/pages/home";
import UserDiary from "@/pages/user-diary";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const showNavigation = location !== '/';

  return (
    <>
      {showNavigation && <Navigation />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/:username" component={UserDiary} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;