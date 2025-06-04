import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Plus, Wifi, WifiOff } from "lucide-react";

interface GameStatusProps {
  gameState: any;
  onEndPhase: () => void;
  onDrawCard: () => void;
  isConnected: boolean;
}

export default function GameStatus({ gameState, onEndPhase, onDrawCard, isConnected }: GameStatusProps) {
  if (!gameState) return null;

  const canDrawCard = gameState.currentPhase === 'Command Phase' && !gameState.player1?.hasDrawnCard;
  const canEndPhase = true; // Always allow ending phase

  return (
    <Card className="bg-gradient-to-r from-card/50 to-primary/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Current Phase */}
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              <Clock className="h-3 w-3 mr-1" />
              {gameState.currentPhase}
            </Badge>

            {/* Command Points */}
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
              <Zap className="h-3 w-3 mr-1" />
              CP: {gameState.player1?.commandPoints || 0}
            </Badge>

            {/* Turn */}
            <Badge variant="secondary">
              Turn: {gameState.currentTurn}
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            {/* Draw Card Button */}
            {canDrawCard && (
              <Button
                onClick={onDrawCard}
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Draw Card
              </Button>
            )}

            {/* End Phase Button */}
            <Button
              onClick={onEndPhase}
              disabled={!canEndPhase}
              className="btn-cosmic"
            >
              {gameState.currentPhase === 'Battle Phase' ? 'End Turn' : 'End Phase'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
