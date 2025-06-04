import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CardComponent from "@/components/CardComponent";
import StarBackground from "@/components/StarBackground";
import { GameLogic, Phase } from "@/lib/gameLogic";
import { useWebSocket } from "@/lib/websocket";
import { isUnauthorizedError } from "@/lib/authUtils";

interface GameInterfaceProps {
  game: any;
}

export default function GameInterface({ game }: GameInterfaceProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [gameState, setGameState] = useState(game.gameState || {
    phase: Phase.COMMAND,
    turn: 1,
    player1Health: 100,
    player2Health: 100,
    player1CommandPoints: 0,
    player2CommandPoints: 0,
    player1Hand: [],
    player2Hand: [],
    player1Units: [],
    player2Units: [],
    player1Commands: [],
    player2Commands: []
  });
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [gameLogic] = useState(new GameLogic());

  // WebSocket connection for real-time updates
  const { sendMessage } = useWebSocket(game.id, (message) => {
    if (message.type === 'game_update') {
      setGameState(message.game.gameState);
    } else if (message.type === 'game_action') {
      // Handle opponent actions
      handleOpponentAction(message.action);
    }
  });

  const updateGameMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PUT", `/api/games/${game.id}`, updates);
      return response.json();
    },
    onSuccess: (updatedGame) => {
      setGameState(updatedGame.gameState);
      queryClient.invalidateQueries({ queryKey: ["/api/games", game.id] });
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

  const handleOpponentAction = (action: any) => {
    // Handle AI or opponent player actions
    console.log("Opponent action:", action);
  };

  const handleCardClick = (card: any) => {
    if (selectedCard === card) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const handleEndPhase = () => {
    const newPhase = gameLogic.getNextPhase(gameState.phase);
    const newGameState = {
      ...gameState,
      phase: newPhase,
      turn: newPhase === Phase.COMMAND ? gameState.turn + 1 : gameState.turn
    };

    setGameState(newGameState);
    updateGameMutation.mutate({ gameState: newGameState, currentPhase: newPhase });
    
    // Notify other players
    sendMessage({
      type: 'game_action',
      action: { type: 'phase_ended', newPhase, gameState: newGameState }
    });
  };

  const handleDeployCard = (zone: string) => {
    if (!selectedCard) return;

    const newGameState = { ...gameState };
    
    if (zone === "player-unit-zone") {
      newGameState.player1Units = [...newGameState.player1Units, selectedCard];
      newGameState.player1Hand = newGameState.player1Hand.filter((card: any) => card !== selectedCard);
    } else if (zone === "player-command-zone") {
      newGameState.player1Commands = [...newGameState.player1Commands, selectedCard];
      newGameState.player1Hand = newGameState.player1Hand.filter((card: any) => card !== selectedCard);
      newGameState.player1CommandPoints += gameLogic.getCommandPoints(selectedCard);
    }

    setGameState(newGameState);
    setSelectedCard(null);
    updateGameMutation.mutate({ gameState: newGameState });
    
    // Notify other players
    sendMessage({
      type: 'game_action',
      action: { type: 'card_deployed', card: selectedCard, zone, gameState: newGameState }
    });
  };

  const handleExitGame = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <StarBackground />
      
      {/* Game Header */}
      <header className="relative z-50 bg-gradient-to-r from-background/90 via-card/90 to-background/90 backdrop-blur-lg border-b border-primary/30 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <Button 
                variant="outline" 
                onClick={handleExitGame}
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Exit Game
              </Button>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-card/50 text-primary border-primary/30">
                  {gameState.phase}
                </Badge>
                <Badge variant="outline" className="border-primary/30">
                  Turn: {gameState.turn}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className="bg-primary text-primary-foreground">
                <i className="fas fa-star mr-1"></i>
                Command Points: {gameState.player1CommandPoints}
              </Badge>
              <Button 
                onClick={handleEndPhase}
                className="bg-primary hover:bg-accent animate-pulse-gold"
                disabled={updateGameMutation.isPending}
              >
                <i className="fas fa-forward mr-2"></i>
                End Phase
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Game Board */}
      <main className="relative z-10 container mx-auto p-4 space-y-6">
        
        {/* Opponent Area */}
        <div className="space-y-4">
          {/* Opponent Info */}
          <div className="flex items-center justify-between bg-gradient-to-r from-destructive/20 to-destructive/10 rounded-lg p-4 border border-destructive/30">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-destructive to-red-700 overflow-hidden border-2 border-destructive">
                <div className="w-full h-full bg-destructive/20 flex items-center justify-center">
                  <i className="fas fa-robot text-white"></i>
                </div>
              </div>
              <div>
                <div className="font-semibold text-destructive">
                  {game.isAI ? `AI Commander (${game.aiDifficulty})` : "Opponent"}
                </div>
                <div className="text-sm text-muted-foreground">Enemy Fleet</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Health</div>
                <div className="font-bold text-destructive">{gameState.player2Health}/100</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Cards</div>
                <div className="font-bold text-destructive">{gameState.player2Hand?.length || 0}</div>
              </div>
            </div>
          </div>
          
          {/* Opponent Hand (Hidden) */}
          <div className="flex justify-center space-x-2">
            {Array.from({ length: gameState.player2Hand?.length || 5 }).map((_, index) => (
              <div key={index} className="w-16 h-24 bg-gradient-to-br from-card to-background rounded-lg border-2 border-primary/30 shadow-lg">
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fas fa-question text-primary/50"></i>
                </div>
              </div>
            ))}
          </div>
          
          {/* Opponent Zones */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-destructive/10 border-destructive/30 min-h-32">
              <CardContent className="p-4">
                <div className="text-center text-destructive font-semibold mb-2">
                  <i className="fas fa-chess-king mr-1"></i>
                  Opponent Command
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {gameState.player2Commands?.map((card: any, index: number) => (
                    <CardComponent key={index} card={card} size="small" />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-destructive/10 border-destructive/30 min-h-32">
              <CardContent className="p-4">
                <div className="text-center text-destructive font-semibold mb-2">
                  <i className="fas fa-sword mr-1"></i>
                  Opponent Units
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {gameState.player2Units?.map((card: any, index: number) => (
                    <CardComponent key={index} card={card} size="small" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Battle Zone */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-4 py-2 text-primary font-semibold rounded-full border border-primary/30">
              <i className="fas fa-crossed-swords mr-2"></i>
              BATTLE ZONE
            </span>
          </div>
        </div>

        {/* Player Zones */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className="bg-primary/10 border-primary/50 min-h-32 cursor-pointer hover:border-primary transition-all duration-300"
              onClick={() => handleDeployCard("player-command-zone")}
            >
              <CardContent className="p-4">
                <div className="text-center text-primary font-semibold mb-2">
                  <i className="fas fa-chess-king mr-1"></i>
                  Your Command
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {gameState.player1Commands?.map((card: any, index: number) => (
                    <CardComponent 
                      key={index} 
                      card={card} 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(card);
                      }}
                      selected={selectedCard === card}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="bg-primary/10 border-primary/50 min-h-32 cursor-pointer hover:border-primary transition-all duration-300"
              onClick={() => handleDeployCard("player-unit-zone")}
            >
              <CardContent className="p-4">
                <div className="text-center text-primary font-semibold mb-2">
                  <i className="fas fa-sword mr-1"></i>
                  Your Units
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {gameState.player1Units?.map((card: any, index: number) => (
                    <CardComponent 
                      key={index} 
                      card={card} 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(card);
                      }}
                      selected={selectedCard === card}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Player Info */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg p-4 border border-primary/30">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden border-2 border-primary">
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <i className="fas fa-user text-primary-foreground"></i>
                </div>
              </div>
              <div>
                <div className="font-semibold text-primary">Commander</div>
                <div className="text-sm text-muted-foreground">Your Fleet</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Health</div>
                <div className="font-bold text-primary">{gameState.player1Health}/100</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Deck</div>
                <div className="font-bold text-primary">23</div>
              </div>
            </div>
          </div>
          
          {/* Player Hand */}
          <Card className="bg-gradient-to-t from-card/50 to-transparent border-primary/20">
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <div className="text-sm text-muted-foreground">Your Hand</div>
              </div>
              
              <div className="flex justify-center space-x-3 overflow-x-auto pb-2">
                {gameState.player1Hand?.map((card: any, index: number) => (
                  <CardComponent 
                    key={index} 
                    card={card}
                    onClick={() => handleCardClick(card)}
                    selected={selectedCard === card}
                    className="flex-shrink-0"
                  />
                ))}
              </div>
              
              <div className="flex justify-center mt-4 space-x-4">
                <Button variant="outline" className="border-primary/30 hover:border-primary">
                  <i className="fas fa-plus mr-2"></i>
                  Draw Card
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
