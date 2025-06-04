import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import GameInterface from "@/components/game/GameInterface";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function GameRoom() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<any>(null);

  const { data: game, isLoading } = useQuery({
    queryKey: ["/api/games", gameId],
    retry: false,
  });

  const { data: userCards } = useQuery({
    queryKey: ["/api/cards/user"],
    retry: false,
  });

  const { sendMessage, lastMessage } = useWebSocket(`/ws`);

  useEffect(() => {
    if (game && !gameState) {
      // Initialize game state
      setGameState(game.gameState || {
        currentPhase: "Command Phase",
        currentPlayer: game.player1Id,
        turnNumber: 1,
        commandPoints: 0,
        playerHealth: { [game.player1Id]: 100, [game.player2Id || "ai"]: 100 },
        playerHands: { [game.player1Id]: [], [game.player2Id || "ai"]: [] },
        playerUnits: { [game.player1Id]: [], [game.player2Id || "ai"]: [] },
        playerCommands: { [game.player1Id]: [], [game.player2Id || "ai"]: [] },
      });

      // Join the game via WebSocket
      sendMessage({
        type: "join_game",
        payload: { gameId, userId: user?.id }
      });
    }
  }, [game, gameState, gameId, user?.id, sendMessage]);

  useEffect(() => {
    if (lastMessage) {
      const { type, payload } = lastMessage;
      
      switch (type) {
        case "move_received":
          // Update game state with opponent's move
          setGameState((prev: any) => {
            // Apply the move to the game state
            return { ...prev, ...payload.newState };
          });
          break;
        case "game_ended":
          toast({
            title: payload.winnerId === user?.id ? "Victory!" : "Defeat",
            description: payload.winnerId === user?.id 
              ? "Congratulations on your victory!" 
              : "Better luck next time, Commander.",
          });
          setTimeout(() => setLocation("/"), 3000);
          break;
      }
    }
  }, [lastMessage, user?.id, toast, setLocation]);

  const updateGameMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PUT", `/api/games/${gameId}`, updates);
      return response.json();
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
        description: "Failed to update game",
        variant: "destructive",
      });
    },
  });

  const handleGameMove = (moveType: string, moveData: any) => {
    // Send move via WebSocket
    sendMessage({
      type: "game_move",
      payload: {
        gameId,
        playerId: user?.id,
        moveType,
        moveData
      }
    });

    // Update local game state immediately for responsive UI
    setGameState((prev: any) => {
      const newState = { ...prev };
      
      switch (moveType) {
        case "end_phase":
          const phases = ["Command Phase", "Deployment Phase", "Battle Phase", "End Turn"];
          const currentIndex = phases.indexOf(newState.currentPhase);
          newState.currentPhase = phases[(currentIndex + 1) % phases.length];
          
          if (newState.currentPhase === "Command Phase") {
            newState.turnNumber += 1;
            newState.currentPlayer = newState.currentPlayer === game?.player1Id 
              ? (game?.player2Id || "ai") 
              : game?.player1Id;
          }
          break;
          
        case "play_card":
          // Handle card playing logic
          break;
          
        case "draw_card":
          // Handle card drawing logic
          break;
      }
      
      return newState;
    });
  };

  const handleSurrender = () => {
    updateGameMutation.mutate({
      status: "finished",
      winnerId: game?.isVsAI ? "ai" : (game?.player1Id === user?.id ? game?.player2Id : game?.player1Id),
      finishedAt: new Date().toISOString()
    });
    
    toast({
      title: "Game Surrendered",
      description: "Returning to lobby...",
    });
    
    setTimeout(() => setLocation("/"), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosmic-gold text-xl">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading game...
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-cosmic-800 border-red-500/30">
          <CardContent className="p-8 text-center">
            <i className="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
            <h2 className="text-xl font-bold text-cosmic-silver mb-2">Game Not Found</h2>
            <p className="text-cosmic-silver/70 mb-4">
              The requested game could not be found or you don't have access to it.
            </p>
            <Button onClick={() => setLocation("/")} className="bg-cosmic-gold text-cosmic-900">
              Return to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosmic-gold text-xl">
          <i className="fas fa-cog fa-spin mr-2"></i>
          Initializing game...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-900 relative">
      {/* Game Header */}
      <div className="bg-cosmic-800/90 backdrop-blur-md border-b border-cosmic-600 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="border-cosmic-gold/30 text-cosmic-silver hover:bg-cosmic-gold/20"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Exit Game
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="bg-cosmic-700 px-4 py-2 rounded-lg">
                <span className="text-cosmic-gold font-semibold">
                  {gameState.currentPhase}
                </span>
              </div>
              <div className="bg-cosmic-700 px-4 py-2 rounded-lg">
                <span className="text-cosmic-silver">Turn: </span>
                <span className="text-cosmic-gold font-semibold">
                  {gameState.turnNumber}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-cosmic-gold px-4 py-2 rounded-lg">
              <span className="text-cosmic-900 font-semibold">
                <i className="fas fa-star mr-1"></i>
                Command Points: {gameState.commandPoints}
              </span>
            </div>
            
            <Button
              onClick={handleSurrender}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <i className="fas fa-flag mr-2"></i>
              Surrender
            </Button>
          </div>
        </div>
      </div>

      {/* Game Interface */}
      <GameInterface
        game={game}
        gameState={gameState}
        userCards={userCards || []}
        currentUserId={user?.id || ""}
        onGameMove={handleGameMove}
      />
    </div>
  );
}
