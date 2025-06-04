import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import GameInterface from "@/components/game/GameInterface";
import StarBackground from "@/components/ui/star-background";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Game() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [gameId, setGameId] = useState<number | null>(null);

  // Get game ID from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setGameId(parseInt(id));
    }
  }, []);

  const { data: game, isLoading: gameLoading, error } = useQuery({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
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
  }, [user, isLoading, toast]);

  // Handle errors
  useEffect(() => {
    if (error) {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to load game. Returning to home.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    }
  }, [error, toast, setLocation]);

  if (isLoading || gameLoading || !user || !gameId) {
    return (
      <div className="min-h-screen bg-cosmic-900 text-cosmic-silver relative overflow-hidden flex items-center justify-center">
        <StarBackground />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cosmic-gold mx-auto mb-4"></div>
          <p className="text-xl">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-900 text-cosmic-silver relative overflow-hidden">
      <StarBackground />
      <GameInterface gameId={gameId} />
    </div>
  );
}
