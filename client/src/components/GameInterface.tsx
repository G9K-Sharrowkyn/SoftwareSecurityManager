import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CardComponent from "./CardComponent";
import { GameEngine, GamePhase } from "@/lib/gameEngine";
import { AIEngine } from "@/lib/aiEngine";

interface GameInterfaceProps {
  game: any;
  gameState: any;
  onGameMove: (move: any) => void;
  currentUser: any;
}

export default function GameInterface({ game, gameState, onGameMove, currentUser }: GameInterfaceProps) {
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [gameEngine] = useState(new GameEngine());
  const [aiEngine] = useState(new AIEngine());
  const [localGameState, setLocalGameState] = useState(gameState);

  useEffect(() => {
    setLocalGameState(gameState);
  }, [gameState]);

  useEffect(() => {
    // Initialize game if needed
    if (!localGameState?.player1?.hand?.length && !localGameState?.player2?.hand?.length) {
      const initializedState = gameEngine.initializeGame(game);
      setLocalGameState(initializedState);
      onGameMove(initializedState);
    }
  }, []);

  useEffect(() => {
    // AI turn logic
    if (game.isAIGame && localGameState?.currentTurn !== currentUser?.id && localGameState?.currentPhase) {
      setTimeout(() => {
        const aiMove = aiEngine.makeMove(localGameState, game.aiDifficulty || 'Medium');
        if (aiMove) {
          const newState = gameEngine.applyMove(localGameState, aiMove);
          setLocalGameState(newState);
          onGameMove(newState);
        }
      }, 1000);
    }
  }, [localGameState?.currentTurn, localGameState?.currentPhase]);

  const isPlayerTurn = localGameState?.currentTurn === currentUser?.id;
  const playerState = game.player1Id === currentUser?.id ? localGameState?.player1 : localGameState?.player2;
  const opponentState = game.player1Id === currentUser?.id ? localGameState?.player2 : localGameState?.player1;
  const opponentName = game.isAIGame ? `AI Commander (${game.aiDifficulty})` : "Opponent";

  const handleCardClick = (card: any) => {
    if (!isPlayerTurn) return;
    setSelectedCard(selectedCard?.id === card.id ? null : card);
  };

  const handleEndPhase = () => {
    if (!isPlayerTurn) return;
    
    const newState = gameEngine.endPhase(localGameState);
    setLocalGameState(newState);
    onGameMove(newState);
  };

  const handleDrawCard = () => {
    if (!isPlayerTurn || localGameState?.currentPhase !== GamePhase.COMMAND) return;
    
    const newState = gameEngine.drawCard(localGameState, currentUser.id);
    setLocalGameState(newState);
    onGameMove(newState);
  };

  const handleDeployCard = (zone: 'command' | 'unit') => {
    if (!selectedCard || !isPlayerTurn) return;
    
    const move = {
      type: 'deploy_card',
      playerId: currentUser.id,
      cardId: selectedCard.id,
      zone
    };
    
    const newState = gameEngine.applyMove(localGameState, move);
    if (newState) {
      setLocalGameState(newState);
      onGameMove(newState);
      setSelectedCard(null);
    }
  };

  const getPhaseButtonText = () => {
    switch (localGameState?.currentPhase) {
      case GamePhase.COMMAND:
        return "End Command Phase";
      case GamePhase.DEPLOYMENT:
        return "End Deployment Phase";
      case GamePhase.BATTLE:
        return "End Battle Phase";
      default:
        return "End Phase";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Game Header */}
      <div className="bg-cosmic-blue/90 backdrop-blur-md border-b border-cosmic-gold/30 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <Button variant="ghost" onClick={() => window.location.href = '/'}>
              <i className="fas fa-arrow-left mr-2"></i>Exit Game
            </Button>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-cosmic-gold text-cosmic-gold">
                {localGameState?.currentPhase || "Command Phase"}
              </Badge>
              <Badge variant="outline">
                Turn: {localGameState?.turnNumber || 1}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge className="bg-cosmic-gold text-cosmic-black">
              <i className="fas fa-star mr-1"></i>
              Command Points: {playerState?.commandPoints || 0}
            </Badge>
            <Button 
              onClick={handleEndPhase}
              disabled={!isPlayerTurn}
              className="bg-green-600 hover:bg-green-700"
            >
              {getPhaseButtonText()}
            </Button>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 overflow-hidden">
        {/* Opponent Area */}
        <div className="bg-red-900/20 border-b border-red-500/30 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <i className="fas fa-robot text-red-400"></i>
                </div>
                <div>
                  <div className="text-red-400 font-semibold">{opponentName}</div>
                  <div className="text-red-300">Health: {opponentState?.health || 100}/100</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-red-400">Cards in Hand: {opponentState?.hand?.length || 0}</div>
              </div>
            </div>

            {/* Opponent Hand (Hidden Cards) */}
            <div className="flex justify-center space-x-2 mb-4">
              {(opponentState?.hand || []).map((_: any, index: number) => (
                <div key={index} className="w-16 h-24 bg-red-800 border border-red-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-question text-red-400"></i>
                </div>
              ))}
            </div>

            {/* Opponent Zones */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 min-h-32">
                <div className="text-red-400 text-sm font-semibold mb-2">Command Zone</div>
                <div className="flex flex-wrap gap-2">
                  {(opponentState?.commands || []).map((card: any, index: number) => (
                    <CardComponent key={index} card={card} size="small" />
                  ))}
                </div>
              </div>
              <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 min-h-32">
                <div className="text-red-400 text-sm font-semibold mb-2">Unit Zone</div>
                <div className="flex flex-wrap gap-2">
                  {(opponentState?.units || []).map((card: any, index: number) => (
                    <CardComponent key={index} card={card} size="small" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Zone */}
        <div className="bg-cosmic-gold/10 p-4 border-y border-cosmic-gold/30">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-cosmic-gold font-semibold mb-2">Battle Zone</div>
            <div className="bg-cosmic-black/30 rounded-xl p-8 border border-cosmic-gold/30">
              <i className="fas fa-crosshairs text-cosmic-gold text-4xl mb-2"></i>
              <div className="text-cosmic-silver">Combat resolution area</div>
            </div>
          </div>
        </div>

        {/* Player Area */}
        <div className="bg-blue-900/20 border-t border-blue-500/30 p-4">
          <div className="max-w-7xl mx-auto">
            {/* Player Zones */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div 
                className="bg-blue-900/30 border border-blue-500/50 rounded-xl p-4 min-h-32 cursor-pointer hover:border-cosmic-gold transition-colors"
                onClick={() => handleDeployCard('command')}
              >
                <div className="text-blue-400 text-sm font-semibold mb-2">Your Command Zone</div>
                <div className="flex flex-wrap gap-2">
                  {(playerState?.commands || []).map((card: any, index: number) => (
                    <CardComponent 
                      key={index} 
                      card={card} 
                      size="small"
                      onClick={() => handleCardClick(card)}
                      isSelected={selectedCard?.id === card.id}
                    />
                  ))}
                </div>
              </div>
              <div 
                className="bg-blue-900/30 border border-blue-500/50 rounded-xl p-4 min-h-32 cursor-pointer hover:border-cosmic-gold transition-colors"
                onClick={() => handleDeployCard('unit')}
              >
                <div className="text-blue-400 text-sm font-semibold mb-2">Your Unit Zone</div>
                <div className="flex flex-wrap gap-2">
                  {(playerState?.units || []).map((card: any, index: number) => (
                    <CardComponent 
                      key={index} 
                      card={card} 
                      size="small"
                      onClick={() => handleCardClick(card)}
                      isSelected={selectedCard?.id === card.id}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Player Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <i className="fas fa-user text-blue-400"></i>
                </div>
                <div>
                  <div className="text-blue-400 font-semibold">{currentUser?.username}</div>
                  <div className="text-blue-300">Health: {playerState?.health || 100}/100</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleDrawCard}
                  disabled={!isPlayerTurn || localGameState?.currentPhase !== GamePhase.COMMAND}
                  variant="outline"
                >
                  <i className="fas fa-plus mr-2"></i>Draw Card
                </Button>
              </div>
            </div>
            
            {/* Player Hand */}
            <div className="bg-cosmic-blue/20 rounded-lg p-4">
              <div className="text-center text-cosmic-silver mb-3">Your Hand</div>
              <div className="flex justify-center space-x-3 overflow-x-auto pb-2">
                {(playerState?.hand || []).map((card: any, index: number) => (
                  <CardComponent 
                    key={index} 
                    card={card}
                    onClick={() => handleCardClick(card)}
                    isSelected={selectedCard?.id === card.id}
                    disabled={!isPlayerTurn}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
