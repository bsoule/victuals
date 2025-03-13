import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation";
import Home from "@/pages/home";
import UserDiary from "@/pages/user-diary";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/:username">
          {(params) => (
            <>
              <Navigation />
              <UserDiary username={params.username} />
            </>
          )}
        </Route>
        <Route>
          {() => (
            <>
              <Navigation />
              <NotFound />
            </>
          )}
        </Route>
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