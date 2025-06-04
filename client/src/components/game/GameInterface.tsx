import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CardDisplay from "@/components/cards/CardDisplay";
import { AIOpponent } from "./AIOpponent";
import { GameMechanics, Phases } from "./GameMechanics";

interface GameInterfaceProps {
  game: any;
  gameState: any;
  userCards: any[];
  currentUserId: string;
  onGameMove: (moveType: string, moveData: any) => void;
}

export default function GameInterface({ game, gameState, userCards, currentUserId, onGameMove }: GameInterfaceProps) {
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [playerHand, setPlayerHand] = useState<any[]>([]);
  const [gameMechanics] = useState(new GameMechanics());
  const [aiOpponent] = useState(new AIOpponent());

  const isPlayerTurn = gameState.currentPlayer === currentUserId;
  const isVsAI = game.isVsAI;
  const currentPhase = gameState.currentPhase;

  useEffect(() => {
    // Initialize player hand with some cards from their collection
    if (userCards.length > 0 && playerHand.length === 0) {
      const initialHand = userCards.slice(0, 7).map(uc => uc.card);
      setPlayerHand(initialHand);
    }
  }, [userCards, playerHand]);

  useEffect(() => {
    // Handle AI turns
    if (isVsAI && !isPlayerTurn && currentPhase) {
      const aiMove = aiOpponent.makeMove(gameState, game.aiDifficulty);
      if (aiMove) {
        setTimeout(() => {
          onGameMove(aiMove.type, aiMove.data);
        }, 1000); // Add delay for realism
      }
    }
  }, [isVsAI, isPlayerTurn, currentPhase, gameState, onGameMove, aiOpponent, game.aiDifficulty]);

  const handleEndPhase = () => {
    if (!isPlayerTurn) return;
    
    onGameMove("end_phase", {
      currentPhase,
      newPhase: gameMechanics.getNextPhase(currentPhase)
    });
  };

  const handleCardPlay = (card: any, zone: string) => {
    if (!isPlayerTurn || !selectedCard) return;

    if (gameMechanics.canPlayCardInZone(card, zone, currentPhase)) {
      onGameMove("play_card", {
        card,
        zone,
        phase: currentPhase
      });
      
      // Remove card from hand
      setPlayerHand(hand => hand.filter(c => c.id !== card.id));
      setSelectedCard(null);
    }
  };

  const handleDrawCard = () => {
    if (!isPlayerTurn || currentPhase !== Phases.COMMAND) return;
    
    // Get a random card from user's collection
    const availableCards = userCards.filter(uc => 
      !playerHand.some(ph => ph.id === uc.card.id)
    );
    
    if (availableCards.length > 0) {
      const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      setPlayerHand(hand => [...hand, randomCard.card]);
      
      onGameMove("draw_card", {
        card: randomCard.card
      });
    }
  };

  const opponentHealth = gameState.playerHealth?.[game.player2Id || "ai"] || 100;
  const playerHealth = gameState.playerHealth?.[currentUserId] || 100;
  const commandPoints = gameState.commandPoints || 0;

  return (
    <div className="flex flex-col h-screen">
      {/* Opponent Area */}
      <div className="bg-red-900/20 border-b border-red-500/30 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                <i className="fas fa-robot text-white"></i>
              </div>
              <div>
                <div className="text-red-400 font-semibold">
                  {isVsAI ? `AI Commander (${game.aiDifficulty})` : "Opponent"}
                </div>
                <div className="text-red-300">Health: {opponentHealth}/100</div>
              </div>
            </div>
          </div>

          {/* Opponent Hand (Hidden) */}
          <div className="flex justify-center space-x-2 mb-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="w-16 h-24 bg-red-800 border border-red-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-question text-red-400"></i>
              </div>
            ))}
          </div>

          {/* Opponent Zones */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-red-900/30 border-red-500/50 min-h-32">
              <CardContent className="p-4">
                <div className="text-red-400 text-sm font-semibold mb-2">Command Zone</div>
                {/* Opponent command cards would go here */}
              </CardContent>
            </Card>
            <Card className="bg-red-900/30 border-red-500/50 min-h-32">
              <CardContent className="p-4">
                <div className="text-red-400 text-sm font-semibold mb-2">Unit Zone</div>
                {/* Opponent unit cards would go here */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Battle Zone */}
      <div className="bg-cosmic-800/50 p-4 border-y border-cosmic-600 flex-shrink-0">
        <div className="container mx-auto text-center">
          <div className="text-cosmic-gold font-semibold mb-2">Battle Zone</div>
          <div className="bg-cosmic-700/50 rounded-xl p-8 border border-cosmic-gold/30">
            <i className="fas fa-crosshairs text-cosmic-gold text-4xl mb-2"></i>
            <div className="text-cosmic-silver">Combat resolution area</div>
          </div>
        </div>
      </div>

      {/* Player Area */}
      <div className="bg-blue-900/20 border-t border-blue-500/30 p-4 flex-1">
        <div className="container mx-auto">
          {/* Player Zones */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card 
              className="bg-blue-900/30 border-blue-500/50 min-h-32 cursor-pointer hover:border-cosmic-gold transition-colors"
              onClick={() => selectedCard && handleCardPlay(selectedCard, "command")}
            >
              <CardContent className="p-4">
                <div className="text-blue-400 text-sm font-semibold mb-2">Your Command Zone</div>
                {/* Player command cards would go here */}
              </CardContent>
            </Card>
            <Card 
              className="bg-blue-900/30 border-blue-500/50 min-h-32 cursor-pointer hover:border-cosmic-gold transition-colors"
              onClick={() => selectedCard && handleCardPlay(selectedCard, "unit")}
            >
              <CardContent className="p-4">
                <div className="text-blue-400 text-sm font-semibold mb-2">Your Unit Zone</div>
                {/* Player unit cards would go here */}
              </CardContent>
            </Card>
          </div>

          {/* Player Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <i className="fas fa-user text-white"></i>
              </div>
              <div>
                <div className="text-blue-400 font-semibold">You</div>
                <div className="text-blue-300">Health: {playerHealth}/100</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-cosmic-gold px-3 py-1 rounded text-cosmic-900 font-semibold">
                Command Points: {commandPoints}
              </div>
              <Button
                onClick={handleDrawCard}
                disabled={!isPlayerTurn || currentPhase !== Phases.COMMAND}
                className="bg-cosmic-blue hover:bg-cosmic-blue/80"
              >
                <i className="fas fa-plus mr-2"></i>
                Draw Card
              </Button>
              <Button
                onClick={handleEndPhase}
                disabled={!isPlayerTurn}
                className="bg-cosmic-gold hover:bg-cosmic-gold/80 text-cosmic-900"
              >
                End Phase
              </Button>
            </div>
          </div>

          {/* Player Hand */}
          <Card className="bg-cosmic-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <div className="text-sm text-cosmic-silver/70">Your Hand</div>
                {!isPlayerTurn && (
                  <div className="text-amber-400 text-sm">Waiting for opponent...</div>
                )}
              </div>
              
              <div className="flex justify-center space-x-3 overflow-x-auto pb-2">
                {playerHand.map((card, index) => (
                  <div
                    key={`${card.id}-${index}`}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedCard === card ? "transform -translate-y-2 ring-2 ring-cosmic-gold" : ""
                    } ${
                      isPlayerTurn ? "hover:transform hover:-translate-y-1" : "opacity-50"
                    }`}
                    onClick={() => isPlayerTurn && setSelectedCard(selectedCard === card ? null : card)}
                  >
                    <div className="w-24 h-36">
                      <CardDisplay card={card} />
                    </div>
                  </div>
                ))}
              </div>
              
              {playerHand.length === 0 && (
                <div className="text-center py-8 text-cosmic-silver/70">
                  <i className="fas fa-hand-paper text-2xl mb-2"></i>
                  <p>No cards in hand</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
