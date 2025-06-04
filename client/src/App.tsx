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
=======
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

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
=======
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/game/:id?" component={Game} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
