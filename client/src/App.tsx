import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Game from "@/pages/Game";
import Collection from "@/pages/Collection";
import DeckBuilder from "@/pages/DeckBuilder";
import Rankings from "@/pages/Rankings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-space-black text-star-silver flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-mystic-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-mystic-gold font-semibold">Loading Proteus Nebula...</div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Game} />
          <Route path="/game" component={Game} />
          <Route path="/collection" component={Collection} />
          <Route path="/deck-builder" component={DeckBuilder} />
          <Route path="/rankings" component={Rankings} />
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
        <div className="min-h-screen bg-space-black">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
