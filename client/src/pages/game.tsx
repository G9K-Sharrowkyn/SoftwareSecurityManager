import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import GameInterface from "@/components/game/GameInterface";
import { useWebSocket } from "@/lib/websocket";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, MessageCircle, Flag } from "lucide-react";

interface GameParams {
  id?: string;
}

export default function Game() {
  const { id } = useParams<GameParams>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [gameId, setGameId] = useState<number | null>(id ? parseInt(id) : null);
  
  // WebSocket connection for real-time game updates
  const { sendMessage, lastMessage, readyState } = useWebSocket('/ws');

  // Fetch game data if gameId exists
  const { data: gameData, isLoading } = useQuery({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
  });

  // Create new AI game mutation
  const createGameMutation = useMutation({
    mutationFn: async (difficulty: string) => {
      const response = await apiRequest("POST", "/api/games", {
        gameType: "ai",
        aiDifficulty: difficulty,
        player2Id: null, // AI game
      });
      return response.json();
    },
    onSuccess: (newGame) => {
      setGameId(newGame.id);
      toast({
        title: "Game Created",
        description: `Starting AI battle on ${selectedDifficulty} difficulty`,
      });
      
      // Join the game room via WebSocket
      if (readyState === WebSocket.OPEN) {
        sendMessage({
          type: 'join_game',
          gameId: newGame.id,
          userId: user?.id,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
    },
  });

  // End game mutation
  const endGameMutation = useMutation({
    mutationFn: async () => {
      if (!gameId) return;
      const response = await apiRequest("PUT", `/api/games/${gameId}`, {
        isCompleted: true,
        completedAt: new Date(),
      });
      return response.json();
    },
    onSuccess: () => {
      if (readyState === WebSocket.OPEN && gameId) {
        sendMessage({
          type: 'leave_game',
          gameId,
          userId: user?.id,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      
      switch (data.type) {
        case 'game_action':
          // Update game state based on action
          queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
          break;
        case 'game_ended':
          toast({
            title: data.winner === user?.id ? "Victory!" : "Defeat",
            description: data.winner === user?.id ? "You won the battle!" : "Better luck next time",
          });
          break;
        case 'player_joined':
          toast({
            title: "Player Joined",
            description: "A player has joined the game",
          });
          break;
      }
    }
  }, [lastMessage, gameId, user?.id, queryClient, toast]);

  // Authenticate with WebSocket when connection is ready
  useEffect(() => {
    if (readyState === WebSocket.OPEN && user?.id) {
      sendMessage({
        type: 'authenticate',
        userId: user.id,
      });
    }
  }, [readyState, user?.id, sendMessage]);

  const handleStartGame = () => {
    createGameMutation.mutate(selectedDifficulty);
  };

  const handleExitGame = () => {
    endGameMutation.mutate();
    setGameId(null);
    window.history.pushState({}, '', '/');
  };

  const handleGameAction = (action: string, actionData: any) => {
    if (readyState === WebSocket.OPEN && gameId && user?.id) {
      sendMessage({
        type: 'game_action',
        gameId,
        userId: user.id,
        action,
        actionData,
      });
    }
  };

  // Show game setup if no active game
  if (!gameId) {
    return (
      <div className="min-h-screen relative">
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-primary hover:text-primary/80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-primary">New Battle</h1>
            <div></div>
          </div>

          {/* Game Setup */}
          <div className="max-w-2xl mx-auto">
            <Card className="cosmic-card p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-primary mb-4">Choose Your Challenge</h2>
                <p className="text-muted-foreground">
                  Select the AI difficulty level for your battle
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedDifficulty === 'easy' 
                      ? 'ring-2 ring-primary bg-primary/10' 
                      : 'cosmic-card hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedDifficulty('easy')}
                >
                  <div className="p-6 text-center">
                    <Badge className="mb-3 bg-green-600">Easy</Badge>
                    <h3 className="font-semibold mb-2">Rookie AI</h3>
                    <p className="text-sm text-muted-foreground">
                      Perfect for learning the game mechanics
                    </p>
                  </div>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedDifficulty === 'medium' 
                      ? 'ring-2 ring-primary bg-primary/10' 
                      : 'cosmic-card hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedDifficulty('medium')}
                >
                  <div className="p-6 text-center">
                    <Badge className="mb-3 bg-yellow-600">Medium</Badge>
                    <h3 className="font-semibold mb-2">Veteran AI</h3>
                    <p className="text-sm text-muted-foreground">
                      A balanced challenge for most players
                    </p>
                  </div>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedDifficulty === 'hard' 
                      ? 'ring-2 ring-primary bg-primary/10' 
                      : 'cosmic-card hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedDifficulty('hard')}
                >
                  <div className="p-6 text-center">
                    <Badge className="mb-3 bg-red-600">Hard</Badge>
                    <h3 className="font-semibold mb-2">Elite AI</h3>
                    <p className="text-sm text-muted-foreground">
                      For experienced commanders only
                    </p>
                  </div>
                </Card>
              </div>

              <Button 
                onClick={handleStartGame}
                disabled={createGameMutation.isPending}
                className="w-full cosmic-button text-lg py-4"
              >
                {createGameMutation.isPending ? "Initializing Battle..." : "Start Battle"}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading battle...</p>
        </div>
      </div>
    );
  }

  // Show game interface
  return (
    <div className="min-h-screen bg-background">
      {/* Game Header */}
      <div className="cosmic-nav sticky top-0 z-50 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={handleExitGame}
              className="text-primary hover:text-primary/80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit Game
            </Button>
            
            <div className="flex items-center space-x-4">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {gameData?.gameType === 'ai' ? 'AI Battle' : 'PvP Match'}
              </Badge>
              {gameData?.aiDifficulty && (
                <Badge variant="outline">
                  {gameData.aiDifficulty.charAt(0).toUpperCase() + gameData.aiDifficulty.slice(1)} AI
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleExitGame}
            >
              <Flag className="w-4 h-4 mr-2" />
              Surrender
            </Button>
          </div>
        </div>
      </div>

      {/* Game Interface */}
      <GameInterface 
        gameData={gameData}
        onGameAction={handleGameAction}
        onGameEnd={() => handleExitGame()}
      />
    </div>
  );
}
