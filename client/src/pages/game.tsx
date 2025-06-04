import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import GameInterface from "@/components/game/GameInterface";

export default function Game() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const gameId = params.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch game data if gameId exists
  const { data: game, isLoading: gameLoading, error } = useQuery({
    queryKey: ["/api/games", gameId],
    enabled: isAuthenticated && !!gameId,
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  const handleExitGame = () => {
    setLocation("/");
  };

  if (isLoading || gameLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-cosmic-gold text-xl">Loading game...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (gameId && !game) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-xl">Game not found</div>
          <button 
            onClick={handleExitGame}
            className="bg-cosmic-gold text-cosmic-900 px-6 py-2 rounded-lg font-semibold hover:bg-cosmic-gold/80 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      <GameInterface 
        game={game}
        onExitGame={handleExitGame}
      />
    </div>
  );
}
