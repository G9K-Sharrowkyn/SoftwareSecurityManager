import PlayerArea from "./PlayerArea";
import OpponentArea from "./OpponentArea";
import { Card } from "@/components/ui/card";
import { Swords } from "lucide-react";

interface GameBoardProps {
  gameState: any;
  selectedCard: any;
  onCardSelect: (card: any) => void;
  onCardPlay: (zone: string) => void;
}

export default function GameBoard({ gameState, selectedCard, onCardSelect, onCardPlay }: GameBoardProps) {
  if (!gameState) return null;

  return (
    <div className="space-y-6">
      {/* Opponent Area */}
      <OpponentArea opponent={gameState.player2 || { id: 'ai', health: 85, hand: [], unitZone: [], commandZone: [] }} />
      
      {/* Battle Zone */}
      <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 p-8">
        <div className="text-center">
          <Swords className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-400 mb-2">Battle Zone</h3>
          <p className="text-muted-foreground">Combat will be resolved here during the Battle Phase</p>
        </div>
      </Card>

      {/* Player Area */}
      <PlayerArea 
        player={gameState.player1}
        selectedCard={selectedCard}
        onCardSelect={onCardSelect}
        onCardPlay={onCardPlay}
      />
    </div>
  );
}
