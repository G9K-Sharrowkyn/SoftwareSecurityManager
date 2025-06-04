import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/ui/navigation";
import GameInterface from "@/components/game/GameInterface";
import StarBackground from "@/components/game/StarBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

interface Game {
  id: number;
  status: string;
  isAIGame: boolean;
  aiDifficulty?: string;
  currentPhase: string;
  currentTurn: number;
  player1Health: number;
  player2Health: number;
}

export default function Game() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGameModes, setShowGameModes] = useState(true);

  // Redirect to login if not authenticated
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

  // Fetch active games
  const { data: activeGames = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games/active"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Create AI game mutation
  const createAIGameMutation = useMutation({
    mutationFn: async (difficulty: string) => {
      const response = await apiRequest("POST", "/api/games/ai", { difficulty });
      return response.json();
    },
    onSuccess: (game) => {
      setSelectedGame(game);
      setShowGameModes(false);
      queryClient.invalidateQueries({ queryKey: ["/api/games/active"] });
      toast({
        title: "Game Created",
        description: `AI game started with ${game.aiDifficulty} difficulty`,
      });
    },
    onError: (error) => {
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
        description: "Failed to create AI game",
        variant: "destructive",
      });
    },
  });

  const handleStartAIGame = (difficulty: string) => {
    createAIGameMutation.mutate(difficulty);
  };

  const handleResumeGame = (game: Game) => {
    setSelectedGame(game);
    setShowGameModes(false);
  };

  const handleExitGame = () => {
    setSelectedGame(null);
    setShowGameModes(true);
    queryClient.invalidateQueries({ queryKey: ["/api/games/active"] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-space-black text-star-silver flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-mystic-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-mystic-gold font-semibold">Loading game...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (selectedGame) {
    return (
      <div className="min-h-screen starfield-background">
        <StarBackground />
        <GameInterface 
          game={selectedGame} 
          onExitGame={handleExitGame}
          user={user}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen starfield-background">
      <StarBackground />
      <Navigation />
      
      <main className="relative z-10 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mystic-gold to-amber mb-6 animate-glow">
              Command Center
            </h1>
            <p className="text-xl text-star-silver mb-8 max-w-2xl mx-auto">
              Choose your battle mode and prepare for cosmic warfare
            </p>
          </div>

          {/* Active Games */}
          {activeGames.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-mystic-gold mb-6 text-center">Active Games</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeGames.map((game: Game) => (
                  <Card key={game.id} className="card-cosmic hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => handleResumeGame(game)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-mystic-gold font-semibold">
                          {game.isAIGame ? `AI Game (${game.aiDifficulty})` : "Multiplayer"}
                        </div>
                        <div className="text-sm text-star-silver/70">
                          Turn {game.currentTurn}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-star-silver">
                          Phase: <span className="text-mystic-gold">{game.currentPhase}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Your Health: <span className="text-green-400">{game.player1Health}</span></span>
                          <span>Opponent: <span className="text-red-400">{game.player2Health}</span></span>
                        </div>
                      </div>
                      <Button className="w-full mt-4 button-cosmic-secondary">
                        <i className="fas fa-play mr-2"></i>
                        Resume Game
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Game Modes */}
          <Dialog open={showGameModes} onOpenChange={setShowGameModes}>
            <DialogContent className="max-w-4xl cosmic-gradient border border-mystic-gold/30">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold text-mystic-gold text-center mb-4">
                  Select Game Mode
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Quick Match - Easy AI */}
                <Card className="card-cosmic group hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => handleStartAIGame("Easy")}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                      <i className="fas fa-leaf text-white text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-mystic-gold mb-2">Easy AI</h3>
                    <p className="text-star-silver/80 mb-4">Perfect for beginners. Learn the basics against a forgiving AI opponent.</p>
                    <div className="flex justify-center space-x-2">
                      <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-400/30">
                        Beginner Friendly
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Medium AI */}
                <Card className="card-cosmic group hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => handleStartAIGame("Medium")}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                      <i className="fas fa-bolt text-white text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-mystic-gold mb-2">Medium AI</h3>
                    <p className="text-star-silver/80 mb-4">Balanced challenge for intermediate players. Strategic but fair gameplay.</p>
                    <div className="flex justify-center space-x-2">
                      <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full border border-yellow-400/30">
                        Recommended
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Hard AI */}
                <Card className="card-cosmic group hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => handleStartAIGame("Hard")}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse">
                      <i className="fas fa-skull text-white text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-mystic-gold mb-2">Hard AI</h3>
                    <p className="text-star-silver/80 mb-4">Ultimate challenge for experienced commanders. No mercy.</p>
                    <div className="flex justify-center space-x-2">
                      <span className="px-3 py-1 bg-red-600/20 text-red-400 text-xs rounded-full border border-red-400/30">
                        Expert Only
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Multiplayer (Coming Soon) */}
                <Card className="card-cosmic opacity-50 cursor-not-allowed">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-users text-white text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-mystic-gold mb-2">Multiplayer</h3>
                    <p className="text-star-silver/80 mb-4">Battle against other commanders in real-time matches.</p>
                    <div className="flex justify-center space-x-2">
                      <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full border border-blue-400/30">
                        Coming Soon
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Ranked (Coming Soon) */}
                <Card className="card-cosmic opacity-50 cursor-not-allowed">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-trophy text-white text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-mystic-gold mb-2">Ranked Play</h3>
                    <p className="text-star-silver/80 mb-4">Compete for glory on the galactic leaderboards.</p>
                    <div className="flex justify-center space-x-2">
                      <span className="px-3 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full border border-purple-400/30">
                        Coming Soon
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Tournament (Coming Soon) */}
                <Card className="card-cosmic opacity-50 cursor-not-allowed">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-crown text-white text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-mystic-gold mb-2">Tournaments</h3>
                    <p className="text-star-silver/80 mb-4">Enter prestigious tournaments for ultimate rewards.</p>
                    <div className="flex justify-center space-x-2">
                      <span className="px-3 py-1 bg-orange-600/20 text-orange-400 text-xs rounded-full border border-orange-400/30">
                        Coming Soon
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {createAIGameMutation.isPending && (
                <div className="text-center mt-6">
                  <div className="w-8 h-8 border-4 border-mystic-gold border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-star-silver">Preparing battle...</p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
