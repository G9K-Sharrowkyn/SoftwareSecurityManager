import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import NavigationHeader from "@/components/NavigationHeader";
import GameInterface from "@/components/GameInterface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, Users, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Game() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [gameId, setGameId] = useState<number | null>(id ? parseInt(id) : null);

  const { data: game, isLoading } = useQuery({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
  });

  const { socket, isConnected } = useWebSocket();

  const createGameMutation = useMutation({
    mutationFn: async (gameMode: string) => {
      const response = await apiRequest("POST", "/api/games", { gameMode });
      return await response.json();
    },
    onSuccess: (newGame) => {
      setGameId(newGame.id);
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  useEffect(() => {
    if (gameId && socket && isConnected) {
      socket.send(JSON.stringify({ type: 'join_game', gameId }));
    }
  }, [gameId, socket, isConnected]);

  const startAIGame = () => {
    createGameMutation.mutate("ai");
  };

  const startMultiplayerGame = () => {
    createGameMutation.mutate("multiplayer");
  };

  if (!gameId) {
    return (
      <div className="min-h-screen relative z-10">
        <NavigationHeader />
        
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <h1 className="text-4xl font-bold text-glow mb-4">
              Choose Your Battle
            </h1>
            <p className="text-xl text-muted-foreground">
              Select a game mode to begin your cosmic conquest
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-card/80 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 card-hover">
              <CardHeader>
                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="text-white text-3xl" />
                </div>
                <CardTitle className="text-center text-primary text-2xl">AI Battle</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-6 text-lg">
                  Test your skills against advanced AI commanders with varying difficulty levels. 
                  Perfect for practicing strategies and learning the game.
                </CardDescription>
                <div className="space-y-4">
                  <div className="flex justify-center space-x-2 mb-6">
                    <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">Easy</span>
                    <span className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-full">Medium</span>
                    <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">Hard</span>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full text-lg py-4"
                    onClick={startAIGame}
                    disabled={createGameMutation.isPending}
                  >
                    {createGameMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2" />
                    )}
                    Start AI Battle
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border hover:border-primary transition-all duration-300 card-hover">
              <CardHeader>
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-white text-3xl" />
                </div>
                <CardTitle className="text-center text-primary text-2xl">Multiplayer</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-6 text-lg">
                  Challenge other players in real-time battles. Climb the rankings 
                  and prove your worth as the ultimate space commander.
                </CardDescription>
                <div className="space-y-4">
                  <div className="flex justify-center mb-6">
                    <span className="px-4 py-2 bg-gradient-to-r from-primary to-yellow-600 text-black text-sm font-semibold rounded-full">
                      Ranked Mode
                    </span>
                  </div>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full text-lg py-4"
                    onClick={startMultiplayerGame}
                    disabled={createGameMutation.isPending}
                  >
                    {createGameMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="mr-2" />
                    )}
                    Find Opponent
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {createGameMutation.error && (
            <div className="text-center mt-8">
              <p className="text-destructive">
                Failed to create game. Please try again.
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative z-10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen relative z-10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive mb-4">Game not found</p>
          <Button onClick={() => setLocation("/")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      <GameInterface game={game} socket={socket} />
    </div>
  );
}
