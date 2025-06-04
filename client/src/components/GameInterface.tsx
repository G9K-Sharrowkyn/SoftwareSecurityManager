import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import CardComponent from "./CardComponent";
import GameZone from "./GameZone";
import type { Game } from "@/types/game";

interface GameInterfaceProps {
  game: Game;
  onGameAction: (action: any) => void;
  lastMessage: any;
}

export default function GameInterface({ game, onGameAction, lastMessage }: GameInterfaceProps) {
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [gameState, setGameState] = useState(game.gameState || {});
  const [currentPhase, setCurrentPhase] = useState(game.currentPhase || "Command");

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'game-update':
          setGameState(lastMessage.gameState);
          break;
        case 'chat-message':
          toast({
            title: `${lastMessage.sender}:`,
            description: lastMessage.message,
          });
          break;
      }
    }
  }, [lastMessage, toast]);

  const handleEndPhase = () => {
    const phases = ["Command", "Deployment", "Battle", "End"];
    const currentIndex = phases.indexOf(currentPhase);
    const nextPhase = phases[(currentIndex + 1) % phases.length];
    
    setCurrentPhase(nextPhase);
    
    onGameAction({
      type: 'end-phase',
      newPhase: nextPhase,
      gameId: game.id,
    });

    toast({
      title: "Phase Ended",
      description: `Moving to ${nextPhase} Phase`,
    });
  };

  const handleCardPlay = (card: any, zone: string) => {
    if (!selectedCard) {
      toast({
        title: "No Card Selected",
        description: "Please select a card first",
        variant: "destructive",
      });
      return;
    }

    onGameAction({
      type: 'play-card',
      card: selectedCard,
      zone,
      gameId: game.id,
    });

    setSelectedCard(null);
    
    toast({
      title: "Card Played",
      description: `${selectedCard.name} deployed to ${zone}`,
    });
  };

  const handleDrawCard = () => {
    if (currentPhase !== "Command") {
      toast({
        title: "Invalid Action",
        description: "You can only draw cards in the Command Phase",
        variant: "destructive",
      });
      return;
    }

    onGameAction({
      type: 'draw-card',
      gameId: game.id,
    });

    toast({
      title: "Card Drawn",
      description: "You drew a card from your deck",
    });
  };

  // Mock data for demonstration - in real app this would come from game state
  const playerHand = [
    { id: 1, name: "Star Destroyer", type: "Unit", cost: 8, attack: 6, defense: 8 },
    { id: 2, name: "Fighter Squadron", type: "Unit", cost: 3, attack: 4, defense: 2 },
    { id: 3, name: "Command Center", type: "Shipyard", cost: 4, attack: 0, defense: 6 },
    { id: 4, name: "Plasma Cannon", type: "Command", cost: 2, attack: 4, defense: 0 },
    { id: 5, name: "Shield Generator", type: "Command", cost: 1, attack: 0, defense: 0 },
  ];

  const playerUnits = [
    { id: 6, name: "Cruiser", type: "Unit", cost: 5, attack: 4, defense: 5 },
  ];

  const playerCommands = [
    { id: 7, name: "Star Forge", type: "Shipyard", cost: 6, attack: 0, defense: 8 },
  ];

  const opponentUnits = [
    { id: 8, name: "Alien Destroyer", type: "Unit", cost: 7, attack: 5, defense: 6 },
    { id: 9, name: "Fighter Wing", type: "Unit", cost: 4, attack: 3, defense: 3 },
  ];

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Game Controls */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-b border-yellow-500/30 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <div className="bg-gray-800 rounded-lg px-4 py-2 border border-yellow-500/50">
              <div className="text-center">
                <div className="text-xs text-gray-300">Current Phase</div>
                <div className="font-bold text-yellow-400">{currentPhase}</div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg px-4 py-2 border border-yellow-500/50">
              <div className="text-center">
                <div className="text-xs text-gray-300">Command Points</div>
                <div className="font-bold text-yellow-400">5</div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg px-4 py-2 border border-yellow-500/50">
              <div className="text-center">
                <div className="text-xs text-gray-300">Turn</div>
                <div className="font-bold text-yellow-400">{game.currentTurn || 1}</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleEndPhase}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold animate-pulse"
            >
              <i className="fas fa-forward mr-2"></i>
              End Phase
            </Button>
            
            <Button
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              <i className="fas fa-flag mr-2"></i>
              Surrender
            </Button>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 overflow-hidden">
        {/* Opponent Area */}
        <div className="bg-red-900/20 border-b border-red-500/30 p-4">
          <div className="max-w-7xl mx-auto">
            {/* Opponent Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                  <i className="fas fa-robot text-white"></i>
                </div>
                <div>
                  <div className="font-semibold text-red-200">AI Commander</div>
                  <div className="text-sm text-red-300/70">Hard Difficulty</div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-xs text-red-300/70">Health</div>
                  <div className="font-bold text-red-200">85/100</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-red-300/70">Cards</div>
                  <div className="font-bold text-red-200">6</div>
                </div>
              </div>
            </div>

            {/* Opponent Hand (Hidden) */}
            <div className="flex justify-center space-x-2 mb-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="w-16 h-24 bg-gradient-to-br from-red-800 to-red-900 rounded-lg border border-red-500/50 flex items-center justify-center"
                >
                  <i className="fas fa-question text-red-400"></i>
                </div>
              ))}
            </div>

            {/* Opponent Zones */}
            <div className="grid grid-cols-2 gap-4">
              <GameZone
                title="Opponent Command Zone"
                cards={[]}
                className="bg-red-900/30 border-red-500/50"
                onCardDrop={() => {}}
                readOnly
              />
              <GameZone
                title="Opponent Unit Zone"
                cards={opponentUnits}
                className="bg-red-900/30 border-red-500/50"
                onCardDrop={() => {}}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Battle Zone */}
        <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-y border-orange-500/30 p-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-orange-400 font-bold text-lg mb-2">
              <i className="fas fa-crosshairs mr-2"></i>
              Battle Zone
            </div>
            <div className="text-gray-300">Combat resolution area</div>
          </div>
        </div>

        {/* Player Area */}
        <div className="bg-blue-900/20 border-t border-blue-500/30 p-4 flex-1">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {/* Player Zones */}
            <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
              <GameZone
                title="Your Command Zone"
                cards={playerCommands}
                className="bg-blue-900/30 border-blue-500/50"
                onCardDrop={(card) => handleCardPlay(card, "command")}
                selectedCard={selectedCard}
              />
              <GameZone
                title="Your Unit Zone"
                cards={playerUnits}
                className="bg-blue-900/30 border-blue-500/50"
                onCardDrop={(card) => handleCardPlay(card, "unit")}
                selectedCard={selectedCard}
              />
            </div>

            {/* Player Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <i className="fas fa-user text-white"></i>
                </div>
                <div>
                  <div className="font-semibold text-blue-200">You</div>
                  <div className="text-sm text-blue-300/70">Rank: Captain</div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-xs text-blue-300/70">Health</div>
                  <div className="font-bold text-blue-200">100/100</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-blue-300/70">Deck</div>
                  <div className="font-bold text-blue-200">23</div>
                </div>
                <Button
                  onClick={handleDrawCard}
                  disabled={currentPhase !== "Command"}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Draw Card
                </Button>
              </div>
            </div>

            {/* Player Hand */}
            <Card className="bg-gray-900/50 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="text-center mb-3 text-gray-300">Your Hand</div>
                <div className="flex justify-center space-x-3 overflow-x-auto">
                  {playerHand.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className={`cursor-pointer transition-all duration-200 hover:scale-110 hover:-translate-y-2 ${
                        selectedCard?.id === card.id
                          ? "scale-110 -translate-y-2 ring-2 ring-yellow-400"
                          : ""
                      }`}
                    >
                      <CardComponent card={card} compact />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
