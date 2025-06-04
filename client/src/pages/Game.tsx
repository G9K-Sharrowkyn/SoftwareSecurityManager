import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import GameInterface from "@/components/GameInterface";
import StarBackground from "@/components/StarBackground";
import Chat from "@/components/Chat";

export default function Game() {
  const { id: gameId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);

  const { data: game, isLoading } = useQuery({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
    retry: false,
  });

  // Initialize WebSocket connection
  useEffect(() => {
    if (!gameId || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({
        type: 'join_game',
        gameId,
        userId: user.id
      }));
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket message:', message);
      
      switch (message.type) {
        case 'opponent_move':
          // Handle opponent's move
          setGameState((prev: any) => ({
            ...prev,
            ...message.move
          }));
          break;
        case 'chat_message':
          // Handle chat message
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, [gameId, user]);

  // Initialize game state
  useEffect(() => {
    if (game) {
      setGameState(game.gameState || {
        player1: { health: 100, hand: [], units: [], commands: [], commandPoints: 0 },
        player2: { health: 100, hand: [], units: [], commands: [], commandPoints: 0 },
        currentPhase: "Command Phase",
        turnNumber: 1
      });
    }
  }, [game]);

  const updateGameMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PUT", `/api/games/${gameId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
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

  const handleGameMove = (move: any) => {
    // Update local game state
    const newGameState = { ...gameState, ...move };
    setGameState(newGameState);

    // Send move to server
    updateGameMutation.mutate({ gameState: newGameState });

    // Send move to other players via WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'game_move',
        gameId,
        move
      }));
    }
  };

  const handleChatMessage = (message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'chat_message',
        gameId,
        message,
        sender: user?.username || 'Anonymous'
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cosmic-black flex items-center justify-center">
        <StarBackground />
        <div className="relative z-10 text-cosmic-gold">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-cosmic-black flex items-center justify-center">
        <StarBackground />
        <div className="relative z-10 text-cosmic-silver">Game not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-black text-cosmic-silver relative">
      <StarBackground />
      
      <div className="relative z-10">
        <GameInterface
          game={game}
          gameState={gameState}
          onGameMove={handleGameMove}
          currentUser={user}
        />
        
        {/* Chat Toggle */}
        <button
          className="fixed bottom-4 right-4 bg-cosmic-gold text-cosmic-black p-3 rounded-full shadow-lg hover:bg-cosmic-gold/80 transition-colors z-50"
          onClick={() => setShowChat(!showChat)}
        >
          <i className="fas fa-comments"></i>
        </button>
        
        {/* Chat Component */}
        {showChat && (
          <Chat
            gameId={gameId}
            socket={socket}
            onSendMessage={handleChatMessage}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </div>
  );
}
