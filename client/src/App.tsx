import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import GameLobby from "@/pages/GameLobby";
import GameRoom from "@/pages/GameRoom";
import Collection from "@/pages/Collection";
import DeckBuilder from "@/pages/DeckBuilder";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/layout/Navigation";
import StarBackground from "@/components/layout/StarBackground";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cosmic-900 flex items-center justify-center">
        <div className="text-cosmic-gold text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-900 text-cosmic-silver relative">
      <StarBackground />
      {isAuthenticated && <Navigation />}
      
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={GameLobby} />
            <Route path="/game/:gameId" component={GameRoom} />
            <Route path="/collection" component={Collection} />
            <Route path="/deck-builder" component={DeckBuilder} />
            <Route path="/profile" component={Profile} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
