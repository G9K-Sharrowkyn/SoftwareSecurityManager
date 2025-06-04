import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import GameInterface from "@/components/GameInterface";
import ChatWindow from "@/components/ChatWindow";
import StarBackground from "@/components/StarBackground";
import { GameEngine, Phases } from "@/lib/gameEngine";
import { AIOpponent } from "@/lib/aiOpponent";
import { useWebSocket } from "@/lib/websocket";

interface Game {
  id: number;
  player1Id: string;
  player2Id: string | null;
  winnerId: string | null;
  gameType: string;
  currentPhase: string;
  currentTurn: number;
  isPlayerOneTurn: boolean;
  gameState: any;
  status: string;
}

export default function GamePage() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [aiOpponent, setAiOpponent] = useState<AIOpponent | null>(null);
  const [localGameState, setLocalGameState] = useState<any>(null);

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
    retry: false,
  });

  const { data: userCards } = useQuery({
    queryKey: ["/api/collection"],
    retry: false,
  });

  const updateGameMutation = useMutation({
    mutationFn: async (updates: Partial<Game>) => {
      const response = await apiRequest("PUT", `/api/games/${gameId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
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

  const { sendMessage, lastMessage } = useWebSocket(`/ws`, {
    onOpen: () => {
      if (gameId && user?.id) {
        sendMessage({
          type: 'joinGame',
          gameId: parseInt(gameId),
          userId: user.id,
        });
      }
    },
  });

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        
        switch (data.type) {
          case 'gameUpdate':
            queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
            break;
          case 'gameAction':
            if (gameEngine) {
              gameEngine.processAction(data.data);
              setLocalGameState({ ...gameEngine.getGameState() });
            }
            break;
          case 'playerJoined':
            toast({
              title: "Player Joined",
              description: "Another player has joined the game",
            });
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    }
  }, [lastMessage, gameEngine, gameId, queryClient, toast]);

  useEffect(() => {
    if (game && user && userCards) {
      // Initialize game engine
      const engine = new GameEngine(game, user.id);
      setGameEngine(engine);
      setLocalGameState(engine.getGameState());

      // Initialize AI opponent if it's an AI game
      if (game.gameType === 'ai' && !game.player2Id) {
        const ai = new AIOpponent('hard');
        setAiOpponent(ai);
      }
    }
  }, [game, user, userCards]);

  const handleGameAction = (action: any) => {
    if (!gameEngine) return;

    try {
      const result = gameEngine.processAction(action);
      setLocalGameState({ ...gameEngine.getGameState() });

      // Send action to other players via WebSocket
      if (game?.gameType === 'multiplayer') {
        sendMessage({
          type: 'gameAction',
          gameId: parseInt(gameId!),
          data: action,
        });
      }

      // Update game state in database
      updateGameMutation.mutate({
        gameState: gameEngine.getGameState(),
        currentPhase: gameEngine.getCurrentPhase(),
        currentTurn: gameEngine.getCurrentTurn(),
        isPlayerOneTurn: gameEngine.isPlayerOneTurn(),
      });

      // Process AI turn if it's an AI game and it's AI's turn
      if (aiOpponent && game?.gameType === 'ai' && !gameEngine.isPlayerTurn(user?.id || '')) {
        setTimeout(() => {
          const aiAction = aiOpponent.getNextAction(gameEngine.getGameState());
          if (aiAction) {
            handleGameAction(aiAction);
          }
        }, 1000);
      }

      return result;
    } catch (error) {
      console.error('Game action error:', error);
      toast({
        title: "Invalid Action",
        description: error instanceof Error ? error.message : "Action could not be performed",
        variant: "destructive",
      });
    }
  };

  const handleEndPhase = () => {
    handleGameAction({ type: 'endPhase' });
  };

  const handlePlayCard = (cardId: number, targetZone: string) => {
    handleGameAction({
      type: 'playCard',
      cardId,
      targetZone,
      playerId: user?.id,
    });
  };

  const handleDrawCard = () => {
    handleGameAction({
      type: 'drawCard',
      playerId: user?.id,
    });
  };

  const handleExitGame = () => {
    window.location.href = "/";
  };

  if (isLoading || !game || !gameEngine || !localGameState) {
    return (
      <div className="min-h-screen bg-cosmic-900 flex items-center justify-center">
        <StarBackground />
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-cosmic-gold text-4xl mb-4"></i>
          <p className="text-cosmic-silver">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-900 relative overflow-hidden">
      <StarBackground />
      
      <GameInterface
        game={game}
        gameState={localGameState}
        userCards={userCards || []}
        onEndPhase={handleEndPhase}
        onPlayCard={handlePlayCard}
        onDrawCard={handleDrawCard}
        onExitGame={handleExitGame}
        isPlayerTurn={gameEngine.isPlayerTurn(user?.id || '')}
      />

      <ChatWindow
        gameId={parseInt(gameId!)}
        onSendMessage={(message) => {
          sendMessage({
            type: 'chat',
            gameId: parseInt(gameId!),
            data: {
              userId: user?.id,
              username: user?.firstName || 'Player',
              message,
              timestamp: new Date().toISOString(),
            },
          });
        }}
      />
    </div>
  );
}
