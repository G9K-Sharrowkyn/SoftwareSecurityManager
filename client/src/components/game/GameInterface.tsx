import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { GameMechanics, Phases } from './GameMechanics';
import { cardsSpecifics } from './CardsSpecifics';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useWebSocket } from "@/components/ui/websocket";

interface GameCard {
  id: number;
  name: string;
  type: string[];
  commandCost: number;
  attack: number;
  defense: number;
  unitMembers: number;
  redCounters: number;
  blueCounters: number;
  specialAbility: string;
  imageUrl?: string;
  instanceId: string;
}

interface PlayerState {
  health: number;
  deck: GameCard[];
  hand: GameCard[];
  commandZone: GameCard[];
  unitZone: GameCard[];
  graveyard: GameCard[];
  commandPoints: number;
  hasDrawnCard: boolean;
  hasPlayedCommandCard: boolean;
}

interface GameState {
  gameId?: number;
  currentPhase: string;
  currentPlayer: string;
  turnNumber: number;
  playerStates: {
    [playerId: string]: PlayerState;
  };
  battleQueue: any[];
  isGameOver: boolean;
  winner?: string;
}

interface GameInterfaceProps {
  gameId?: number;
  isAIGame?: boolean;
  onGameEnd?: (winner: string) => void;
}

export const GameInterface: React.FC<GameInterfaceProps> = ({ 
  gameId, 
  isAIGame = true, 
  onGameEnd 
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const websocket = useWebSocket();

  useEffect(() => {
    if (gameId) {
      loadGame();
    }
  }, [gameId]);

  useEffect(() => {
    if (!isAIGame && websocket) {
      websocket.send(JSON.stringify({
        type: 'joinGame',
        gameId: gameId
      }));

      const handleMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'gameUpdate') {
          setGameState(data.game.gameState);
        }
      };

      websocket.addEventListener('message', handleMessage);

      return () => {
        websocket.removeEventListener('message', handleMessage);
        websocket.send(JSON.stringify({
          type: 'leaveGame'
        }));
      };
    }
  }, [websocket, isAIGame, gameId]);

  const loadGame = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load game');
      }
      
      const game = await response.json();
      setGameState(game.gameState);
      setLoading(false);
    } catch (error) {
      console.error('Error loading game:', error);
      toast({
        title: "Error",
        description: "Failed to load game",
        variant: "destructive"
      });
    }
  };

  const performAction = async (action: string, data: any = {}) => {
    if (!gameState || !gameId) return;

    try {
      const response = await fetch(`/api/games/${gameId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action, data })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const updatedGame = await response.json();
      setGameState(updatedGame.gameState);

      if (updatedGame.gameState.isGameOver) {
        onGameEnd?.(updatedGame.gameState.winner);
        toast({
          title: updatedGame.gameState.winner === 'player1' ? "Victory!" : "Defeat!",
          description: `Game Over - ${updatedGame.gameState.winner === 'player1' ? 'You won!' : 'You lost!'}`,
          variant: updatedGame.gameState.winner === 'player1' ? "default" : "destructive"
        });
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to perform action",
        variant: "destructive"
      });
    }
  };

  const handleCardClick = (card: GameCard) => {
    if (selectedCard?.instanceId === card.instanceId) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const handleZoneClick = (zone: string) => {
    if (!selectedCard || !gameState) return;

    if (gameState.currentPlayer !== 'player1') {
      toast({
        title: "Not your turn",
        description: "Wait for your turn to play cards",
        variant: "destructive"
      });
      return;
    }

    performAction('playCard', {
      cardInstanceId: selectedCard.instanceId,
      targetZone: zone
    });
    setSelectedCard(null);
  };

  const handleDrawCard = () => {
    if (!gameState) return;
    performAction('drawCard');
  };

  const handleEndPhase = () => {
    if (!gameState) return;
    performAction('endPhase');
  };

  const handleAttack = (attackerInstanceId: string, targetInstanceId?: string) => {
    if (!gameState || gameState.currentPhase !== Phases.BATTLE) return;
    
    performAction('attack', {
      attackerInstanceId,
      targetInstanceId
    });
  };

  const getCardImageUrl = (card: GameCard): string => {
    return card.imageUrl || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=360`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-cosmic-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-mystic-gold"></div>
          <p className="text-mystic-gold mt-4">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-screen bg-cosmic-900">
        <Card className="p-8 bg-cosmic-800 border-red-500">
          <h2 className="text-xl font-bold text-red-400 mb-4">Game Not Found</h2>
          <p className="text-star-silver">The requested game could not be loaded.</p>
        </Card>
      </div>
    );
  }

  const playerState = gameState.playerStates.player1;
  const opponentState = gameState.playerStates.ai;
  const isPlayerTurn = gameState.currentPlayer === 'player1';

  return (
    <div className="min-h-screen bg-cosmic-900 text-star-silver relative overflow-hidden">
      {/* Starfield Background */}
      <div className="fixed inset-0 z-0">
        <div className="stars-layer absolute inset-0" style={{
          background: 'radial-gradient(ellipse at bottom, #16213E 0%, #0A0A0F 100%)'
        }}>
          {Array.from({ length: 200 }, (_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-80"
              style={{
                width: Math.random() * 3 + 'px',
                height: Math.random() * 3 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animation: `starfield ${Math.random() * 10 + 10}s linear infinite`,
                animationDelay: Math.random() * 20 + 's'
              }}
            />
          ))}
        </div>
      </div>

      {/* Game Header */}
      <div className="relative z-10 bg-cosmic-800/90 backdrop-blur-md border-b border-mystic-gold/30 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-cosmic-900/60 rounded-lg px-4 py-2 border border-mystic-gold/50">
                <div className="text-center">
                  <div className="text-xs text-star-silver/70">Current Phase</div>
                  <div className="font-bold text-mystic-gold">{gameState.currentPhase}</div>
                </div>
              </div>

              <div className="bg-cosmic-900/60 rounded-lg px-4 py-2 border border-amber/50">
                <div className="text-center">
                  <div className="text-xs text-star-silver/70">Command Points</div>
                  <div className="font-bold text-amber">{playerState.commandPoints}</div>
                </div>
              </div>

              <div className="bg-cosmic-900/60 rounded-lg px-4 py-2 border border-mystic-gold/50">
                <div className="text-center">
                  <div className="text-xs text-star-silver/70">Turn</div>
                  <div className="font-bold text-mystic-gold">{gameState.turnNumber}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isPlayerTurn && (
                <Button
                  onClick={handleEndPhase}
                  className="bg-gradient-to-r from-nebula-purple to-cosmic-blue hover:from-nebula-purple/80 hover:to-cosmic-blue/80 text-white border border-mystic-gold/30 animate-pulse"
                >
                  End Phase
                </Button>
              )}
              <div className={`px-3 py-1 rounded-lg ${isPlayerTurn ? 'bg-green-600' : 'bg-red-600'}`}>
                {isPlayerTurn ? 'Your Turn' : 'Opponent Turn'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative z-10 container mx-auto p-4 space-y-6">
        
        {/* Opponent Section */}
        <div className="space-y-4">
          {/* Opponent Info */}
          <div className="flex items-center justify-between bg-gradient-to-r from-red-900/30 to-red-800/30 rounded-lg p-4 border border-red-500/30">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border-2 border-red-400">
                <i className="fas fa-robot text-red-200"></i>
              </div>
              <div>
                <div className="font-semibold text-red-200">AI Commander</div>
                <div className="text-sm text-red-300/70">Difficulty: Hard</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-xs text-red-300/70">Health</div>
                <div className="font-bold text-red-200">{opponentState.health}/100</div>
                <Progress value={opponentState.health} className="w-20 mt-1" />
              </div>
              <div className="text-center">
                <div className="text-xs text-red-300/70">Cards</div>
                <div className="font-bold text-red-200">{opponentState.hand.length}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-red-300/70">Deck</div>
                <div className="font-bold text-red-200">{opponentState.deck.length}</div>
              </div>
            </div>
          </div>

          {/* Opponent Hand (Hidden Cards) */}
          <div className="flex justify-center space-x-2">
            {opponentState.hand.map((_, index) => (
              <div
                key={index}
                className="w-16 h-24 bg-gradient-to-br from-cosmic-blue to-midnight rounded-lg border-2 border-mystic-gold/30 shadow-lg transform hover:scale-105 transition-transform"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fas fa-question text-mystic-gold/50"></i>
                </div>
              </div>
            ))}
          </div>

          {/* Opponent Zones */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 rounded-xl p-6 border-2 border-red-500/30 min-h-32">
              <div className="text-center text-red-400 font-semibold mb-2">
                <i className="fas fa-chess-king mr-1"></i>
                Command Zone
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {opponentState.commandZone.map((card) => (
                  <div key={card.instanceId} className="relative">
                    <img
                      src={getCardImageUrl(card)}
                      alt={card.name}
                      className="w-20 h-28 rounded object-cover border border-red-400"
                    />
                    <div className="absolute bottom-1 right-1 bg-red-600 text-white text-xs px-1 rounded">
                      +{card.type.includes("Shipyard") ? 2 : 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 rounded-xl p-6 border-2 border-red-500/30 min-h-32">
              <div className="text-center text-red-400 font-semibold mb-2">
                <i className="fas fa-sword mr-1"></i>
                Unit Zone
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {opponentState.unitZone.map((card) => (
                  <div key={card.instanceId} className="relative">
                    <img
                      src={getCardImageUrl(card)}
                      alt={card.name}
                      className="w-20 h-28 rounded object-cover border border-red-400"
                    />
                    <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1 rounded">
                      {card.attack}
                    </div>
                    <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 rounded">
                      {card.defense}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Battle Zone Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full border-mystic-gold/30" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-cosmic-900 px-4 py-2 text-mystic-gold font-semibold rounded-full border border-mystic-gold/30">
              <i className="fas fa-crossed-swords mr-2"></i>
              BATTLE ZONE
            </span>
          </div>
        </div>

        {/* Player Zones */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`bg-gradient-to-br from-green-900/40 to-green-800/40 rounded-xl p-6 border-2 min-h-32 relative cursor-pointer transition-all duration-300 ${
                selectedCard ? 'border-mystic-gold hover:border-mystic-gold' : 'border-green-400/50'
              }`}
              onClick={() => selectedCard && handleZoneClick('command')}
            >
              <div className="text-center text-green-300 font-semibold mb-2">
                <i className="fas fa-chess-king mr-1"></i>
                Your Command Zone
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {playerState.commandZone.map((card) => (
                  <div
                    key={card.instanceId}
                    className="relative cursor-pointer hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(card);
                    }}
                  >
                    <img
                      src={getCardImageUrl(card)}
                      alt={card.name}
                      className={`w-20 h-28 rounded object-cover border-2 ${
                        selectedCard?.instanceId === card.instanceId
                          ? 'border-mystic-gold'
                          : 'border-green-400'
                      }`}
                    />
                    <div className="absolute bottom-1 right-1 bg-green-600 text-white text-xs px-1 rounded">
                      +{card.type.includes("Shipyard") ? 2 : 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-xl p-6 border-2 min-h-32 relative cursor-pointer transition-all duration-300 ${
                selectedCard ? 'border-mystic-gold hover:border-mystic-gold' : 'border-blue-400/50'
              }`}
              onClick={() => selectedCard && handleZoneClick('unit')}
            >
              <div className="text-center text-blue-300 font-semibold mb-2">
                <i className="fas fa-sword mr-1"></i>
                Your Unit Zone
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {playerState.unitZone.map((card) => (
                  <div
                    key={card.instanceId}
                    className="relative cursor-pointer hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (gameState.currentPhase === Phases.BATTLE && isPlayerTurn) {
                        // Attack mode
                        if (opponentState.unitZone.length > 0) {
                          // Attack first enemy unit
                          handleAttack(card.instanceId, opponentState.unitZone[0].instanceId);
                        } else {
                          // Direct attack
                          handleAttack(card.instanceId);
                        }
                      } else {
                        handleCardClick(card);
                      }
                    }}
                  >
                    <img
                      src={getCardImageUrl(card)}
                      alt={card.name}
                      className={`w-20 h-28 rounded object-cover border-2 ${
                        selectedCard?.instanceId === card.instanceId
                          ? 'border-mystic-gold'
                          : 'border-blue-400'
                      }`}
                    />
                    <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1 rounded">
                      {card.attack}
                    </div>
                    <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 rounded">
                      {card.defense}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Player Info */}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 rounded-lg p-4 border border-emerald-500/30">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center border-2 border-emerald-400">
                <i className="fas fa-user text-emerald-200"></i>
              </div>
              <div>
                <div className="font-semibold text-emerald-200">You</div>
                <div className="text-sm text-emerald-300/70">Rank: Captain</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-xs text-emerald-300/70">Health</div>
                <div className="font-bold text-emerald-200">{playerState.health}/100</div>
                <Progress value={playerState.health} className="w-20 mt-1" />
              </div>
              <div className="text-center">
                <div className="text-xs text-emerald-300/70">Deck</div>
                <div className="font-bold text-emerald-200">{playerState.deck.length}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-emerald-300/70">Graveyard</div>
                <div className="font-bold text-emerald-200">{playerState.graveyard.length}</div>
              </div>
              {gameState.currentPhase === Phases.COMMAND && !playerState.hasDrawnCard && isPlayerTurn && (
                <Button onClick={handleDrawCard} className="bg-cosmic-blue hover:bg-cosmic-blue/80">
                  <i className="fas fa-plus mr-2"></i>
                  Draw Card
                </Button>
              )}
            </div>
          </div>

          {/* Player Hand */}
          <div className="bg-gradient-to-t from-cosmic-blue/30 to-transparent rounded-xl p-4 border border-mystic-gold/20">
            <div className="text-center mb-4">
              <div className="text-sm text-star-silver/70">Your Hand ({playerState.hand.length} cards)</div>
            </div>

            <div className="flex justify-center space-x-3 overflow-x-auto pb-2">
              {playerState.hand.map((card) => (
                <div
                  key={card.instanceId}
                  className="flex-shrink-0 cursor-pointer"
                  onClick={() => handleCardClick(card)}
                >
                  <div className="relative">
                    <div
                      className={`w-24 h-36 bg-gradient-to-br from-cosmic-blue to-midnight rounded-lg border-2 shadow-lg hover:border-mystic-gold hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-2 ${
                        selectedCard?.instanceId === card.instanceId
                          ? 'border-mystic-gold ring-2 ring-mystic-gold'
                          : 'border-mystic-gold/50'
                      }`}
                    >
                      <img
                        src={getCardImageUrl(card)}
                        alt={card.name}
                        className="w-full h-full object-cover rounded-lg"
                      />

                      {/* Card Info Overlay */}
                      <div className="absolute top-1 left-1 right-1 bg-black/80 rounded text-xs text-center">
                        <div className="text-mystic-gold font-semibold truncate px-1">
                          {card.name}
                        </div>
                      </div>
                      <div className="absolute bottom-1 left-1 right-1 bg-black/80 rounded text-xs">
                        <div className="flex justify-between items-center text-white px-1">
                          <span className="text-amber-400">{card.commandCost}</span>
                          {!card.type.includes("Shipyard") && (
                            <>
                              <span className="text-red-400">{card.attack}</span>
                              <span className="text-blue-400">{card.defense}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInterface;
