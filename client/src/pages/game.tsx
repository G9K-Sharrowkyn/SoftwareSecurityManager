import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/ui/navigation";
import GameBoard from "@/components/game/GameBoard";
import GameStatus from "@/components/game/GameStatus";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useGameState } from "@/hooks/useGameState";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Game() {
  const { gameId } = useParams();
  const [selectedCard, setSelectedCard] = useState<any>(null);

  const { data: game, isLoading } = useQuery({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });

  const { gameState, updateGameState } = useGameState(game);
  const { sendMessage, isConnected } = useWebSocket(parseInt(gameId || "0"), updateGameState);

  useEffect(() => {
    if (gameId && isConnected) {
      sendMessage({
        type: 'join_game',
        gameId: parseInt(gameId),
        userId: 'current-user',
        payload: {}
      });
    }
  }, [gameId, isConnected, sendMessage]);

  const handleCardSelect = (card: any) => {
    setSelectedCard(selectedCard?.id === card.id ? null : card);
  };

  const handleCardPlay = (zone: string) => {
    if (!selectedCard || !gameId) return;

    sendMessage({
      type: 'game_move',
      gameId: parseInt(gameId),
      userId: 'current-user',
      payload: {
        type: 'play_card',
        cardIndex: selectedCard.handIndex,
        zone
      }
    });

    setSelectedCard(null);
  };

  const handleEndPhase = () => {
    if (!gameId) return;

    sendMessage({
      type: 'game_move',
      gameId: parseInt(gameId),
      userId: 'current-user',
      payload: {
        type: 'end_phase'
      }
    });
  };

  const handleDrawCard = () => {
    if (!gameId) return;

    sendMessage({
      type: 'game_move',
      gameId: parseInt(gameId),
      userId: 'current-user',
      payload: {
        type: 'draw_card'
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="flex items-center space-x-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>Loading game...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent>Game not found</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto p-4 space-y-6">
        <GameStatus 
          gameState={gameState}
          onEndPhase={handleEndPhase}
          onDrawCard={handleDrawCard}
          isConnected={isConnected}
        />
        
        <GameBoard
          gameState={gameState}
          selectedCard={selectedCard}
          onCardSelect={handleCardSelect}
          onCardPlay={handleCardPlay}
        />
      </main>
    </div>
  );
}
