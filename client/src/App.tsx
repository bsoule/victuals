import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation";
import Home from "@/pages/home";
import UserDiary from "@/pages/user-diary";
import NotFound from "@/pages/not-found";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

function Router() {
  const storedUsername = localStorage.getItem('food-diary-username')?.toLowerCase();

  // Query to validate stored username
  const { data: validUser, isLoading } = useQuery({
    queryKey: ['/api/users/validate', storedUsername],
    queryFn: async () => {
      if (!storedUsername) return null;
      const res = await apiRequest('POST', '/api/users', { username: storedUsername });
      if (!res.ok) {
        localStorage.removeItem('food-diary-username');
        return null;
      }
      return res.json();
    },
    enabled: !!storedUsername
  });

  return (
    <>
      {validUser && <Navigation />}
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