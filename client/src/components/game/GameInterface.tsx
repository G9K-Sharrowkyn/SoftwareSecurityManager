import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import GameMechanics, { Phases } from './GameMechanics';
import cardsSpecifics from './CardsSpecifics';
import BoosterAnimation from './BoosterAnimation';
import ChatWindow from '@/components/ui/chat-window';

interface GameInterfaceProps {
  gameId: number;
}

interface GameCard {
  id: number;
  name: string;
  image?: string;
}

export default function GameInterface({ gameId }: GameInterfaceProps) {
  const [graveyard, setGraveyard] = useState<GameCard[]>([]);
  const [hand, setHand] = useState<GameCard[]>([]);
  const [playerUnits, setPlayerUnits] = useState<GameCard[]>([]);
  const [playerCommands, setPlayerCommands] = useState<GameCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [gameMechanics] = useState(new GameMechanics());
  const [currentPhase, setCurrentPhase] = useState(gameMechanics.getCurrentPhase());
  const [playerHP, setPlayerHP] = useState(100);
  const [shouldAnimateButton, setShouldAnimateButton] = useState(false);
  const [commandPoints, setCommandPoints] = useState(0);
  const [hasPlayedCommandCard, setHasPlayedCommandCard] = useState(false);
  const [hasDrawnCard, setHasDrawnCard] = useState(false);
  const [shouldAnimateDeckButton, setShouldAnimateDeckButton] = useState(false);
  const [opponentHand, setOpponentHand] = useState<GameCard[]>([]);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [opponentGraveyard, setOpponentGraveyard] = useState<GameCard[]>([]);
  const [deck, setDeck] = useState<GameCard[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Join the game room
      ws.send(JSON.stringify({
        type: 'join_game',
        gameId,
        userId: 'current_user' // This would be the actual user ID
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [gameId]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'game_update':
        // Handle game state updates from other players
        console.log('Game update received:', data);
        break;
      case 'player_joined':
        console.log('Player joined:', data.userId);
        break;
      case 'player_left':
        console.log('Player left:', data.userId);
        break;
    }
  };

  const sendGameAction = (action: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'game_action',
        gameId,
        action,
        payload
      }));
    }
  };

  useEffect(() => {
    drawInitialHand();
    drawInitialOpponentHand();
  }, []);

  useEffect(() => {
    if (currentPhase === Phases.COMMAND && !hasDrawnCard) {
      setShouldAnimateDeckButton(true);
    } else {
      setShouldAnimateDeckButton(false);
    }
  }, [currentPhase, hasDrawnCard]);

  useEffect(() => {
    if (currentPhase === Phases.COMMAND) {
      setHasPlayedCommandCard(false);
      setHasDrawnCard(false);
    }
  }, [currentPhase]);

  useEffect(() => {
    if (currentPhase === Phases.COMMAND) {
      setCommandPoints(calculateTotalCommandPoints());
    }
  }, [playerCommands]);

  const drawInitialHand = () => {
    // Initialize with some mock cards for now
    const mockCards: GameCard[] = [
      { id: 1, name: 'Stellar Destroyer', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=360' },
      { id: 2, name: 'Cyber Elite', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=360' },
      { id: 3, name: 'Star Forge', image: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=360' },
      { id: 4, name: 'Plasma Strike', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=360' },
      { id: 5, name: 'Fighter Wing', image: 'https://images.unsplash.com/photo-1495344517868-8ebaf0a2044a?ixlib=rb-4.0.3&auto=format&fit=crop&w=240&h=360' },
    ];
    setHand(mockCards);
    setDeck(mockCards.slice(5)); // Remaining cards in deck
  };

  const drawInitialOpponentHand = () => {
    const mockOpponentHand = Array(5).fill(null).map((_, index) => ({
      id: 100 + index,
      name: `Opponent Card ${index + 1}`,
    }));
    setOpponentHand(mockOpponentHand);
  };

  const calculateTotalCommandPoints = () => {
    return playerCommands.reduce((total, card) => {
      const cardDetails = cardsSpecifics.find(c => c.name === card.name);
      return total + (cardDetails?.type.includes("Shipyard") ? 2 : 1);
    }, 0);
  };

  const handleCardClick = (card: GameCard) => {
    if (selectedCard === card) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const drawCardFromDeck = () => {
    if (currentPhase !== Phases.COMMAND || hasDrawnCard || deck.length === 0) {
      console.error("Cannot draw a card now");
      return;
    }

    const newDeck = [...deck];
    const drawnCard = newDeck.shift();
    if (drawnCard) {
      setDeck(newDeck);
      setHand([...hand, drawnCard]);
      setHasDrawnCard(true);
      
      sendGameAction('draw_card', { cardId: drawnCard.id });
    }
  };

  const handleEndPhase = () => {
    gameMechanics.endCurrentPhase();
    setCurrentPhase(gameMechanics.getCurrentPhase());
    setShouldAnimateButton(false);
    
    sendGameAction('end_phase', { phase: currentPhase });
  };

  const deployCardToPlayerZone = (zone: string) => {
    if (!selectedCard) {
      console.error("No card selected");
      return;
    }

    const cardDetails = cardsSpecifics.find(card => card.name === selectedCard.name);
    if (!cardDetails) {
      console.error("Card details not found");
      return;
    }

    if (!gameMechanics.canPlayCardInZone(selectedCard.name, zone)) {
      console.error("Cannot play this card in the selected zone");
      return;
    }

    if (gameMechanics.getCurrentPhase() === Phases.BATTLE) {
      console.error("No card deployment is allowed during the Battle Phase");
      return;
    }

    if (gameMechanics.getCurrentPhase() === Phases.DEPLOYMENT) {
      if (zone === "player-unit-zone") {
        if (cardDetails.commandCost > commandPoints) {
          console.error("Not enough command points to play this card");
          return;
        }
        setPlayerUnits([...playerUnits, selectedCard]);
        setCommandPoints(current => Math.max(0, current - cardDetails.commandCost));
        setHand(hand.filter(item => item !== selectedCard));
        setSelectedCard(null);
        
        sendGameAction('deploy_card', { 
          cardId: selectedCard.id, 
          zone: 'unit',
          cost: cardDetails.commandCost 
        });
      }
      return;
    }

    if (gameMechanics.getCurrentPhase() === Phases.COMMAND) {
      if (zone === "player-command-zone") {
        if (hasPlayedCommandCard) {
          console.error("Can only play one card in the Command Phase into the command zone");
          return;
        }

        const pointsToAdd = cardDetails.type.includes("Shipyard") ? 2 : 1;
        setPlayerCommands([...playerCommands, selectedCard]);
        setCommandPoints(current => current + pointsToAdd);
        setShouldAnimateButton(true);
        setHasPlayedCommandCard(true);
        setHand(hand.filter(item => item !== selectedCard));
        setSelectedCard(null);
        
        sendGameAction('deploy_card', { 
          cardId: selectedCard.id, 
          zone: 'command',
          pointsGained: pointsToAdd 
        });
      }
    }
  };

  const exitGame = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col h-screen justify-between relative">
      {/* Game Header */}
      <div className="bg-cosmic-800/90 backdrop-blur-md border-b border-cosmic-600 p-4 relative z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              onClick={exitGame}
              className="text-cosmic-silver hover:text-cosmic-gold"
            >
              <i className="fas fa-arrow-left mr-2"></i>Exit Game
            </Button>
            <div className="flex items-center space-x-4">
              <div className="bg-cosmic-700 px-4 py-2 rounded-lg">
                <span className="text-cosmic-gold font-semibold">{currentPhase}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-cosmic-gold px-4 py-2 rounded-lg">
              <span className="text-cosmic-900 font-semibold">
                <i className="fas fa-star mr-1"></i>
                Command Points: {commandPoints}
              </span>
            </div>
            <Button 
              onClick={handleEndPhase}
              className={`bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg ${shouldAnimateButton ? 'animate-pulse' : ''}`}
            >
              End Phase
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
                <img 
                  src="https://images.unsplash.com/photo-1535223289827-42f1e9919769?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64" 
                  alt="AI Opponent" 
                  className="w-12 h-12 rounded-full border-2 border-red-500 object-cover" 
                />
                <div>
                  <div className="text-red-400 font-semibold">AI Commander Zyx</div>
                  <div className="text-red-300">Health: {opponentHealth}/100</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-red-400">Cards in Hand: {opponentHand.length}</div>
              </div>
            </div>

            {/* Opponent Hand (Hidden Cards) */}
            <div className="flex justify-center space-x-2 mb-4">
              {opponentHand.map((_, index) => (
                <div key={index} className="w-16 h-24 bg-red-800 border border-red-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-question text-red-400"></i>
                </div>
              ))}
            </div>

            {/* Opponent Zones */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 min-h-32">
                <div className="text-red-400 text-sm font-semibold mb-2">Command Zone</div>
              </div>
              <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 min-h-32">
                <div className="text-red-400 text-sm font-semibold mb-2">Unit Zone</div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Zone */}
        <div className="bg-cosmic-800/50 p-4 border-y border-cosmic-600">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-cosmic-gold font-semibold mb-2">Battle Zone</div>
            <div className="bg-cosmic-700/50 rounded-xl p-8 border border-cosmic-gold/30">
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
              <Card 
                className="bg-nebula-gold/20 border-nebula-gold/50 cursor-pointer hover:border-cosmic-gold transition-colors duration-200 min-h-32"
                onClick={() => deployCardToPlayerZone("player-command-zone")}
              >
                <CardContent className="p-4">
                  <div className="text-center text-nebula-gold font-semibold mb-2">Your Command Zone</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {playerCommands.map((card, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={card.image} 
                          alt={card.name} 
                          className="w-20 h-28 rounded object-cover border border-nebula-gold"
                        />
                        <div className="absolute bottom-1 right-1 bg-nebula-gold text-cosmic-900 text-xs px-1 rounded">+2</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-green-500/20 border-green-500/50 cursor-pointer hover:border-cosmic-gold transition-colors duration-200 min-h-32"
                onClick={() => deployCardToPlayerZone("player-unit-zone")}
              >
                <CardContent className="p-4">
                  <div className="text-center text-green-400 font-semibold mb-2">Your Unit Zone</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {playerUnits.map((card, index) => (
                      <div 
                        key={index} 
                        className="relative cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={(e) => { e.stopPropagation(); handleCardClick(card); }}
                      >
                        <img 
                          src={card.image} 
                          alt={card.name} 
                          className="w-20 h-28 rounded object-cover border border-green-500"
                        />
                        <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1 rounded">3</div>
                        <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 rounded">4</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Player Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <img 
                  src="https://images.unsplash.com/photo-1614728263952-84ea256f9679?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64" 
                  alt="Player" 
                  className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover" 
                />
                <div>
                  <div className="text-blue-400 font-semibold">You</div>
                  <div className="text-blue-300">Health: {playerHP}/100</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={drawCardFromDeck}
                  disabled={currentPhase !== Phases.COMMAND || hasDrawnCard || deck.length === 0}
                  className={`bg-cosmic-700 hover:bg-cosmic-600 text-cosmic-silver ${shouldAnimateDeckButton ? 'animate-pulse' : ''}`}
                >
                  <i className="fas fa-plus mr-2"></i>Draw Card
                </Button>
                <div className="text-blue-400">Deck: {deck.length}</div>
              </div>
            </div>

            {/* Player Hand */}
            <Card className="bg-dark-gray/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center text-light-gray mb-3">Your Hand</div>
                <div className="flex justify-center space-x-3 overflow-x-auto pb-2">
                  {hand.map((card, index) => (
                    <div 
                      key={index}
                      className={`flex-shrink-0 cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 ${
                        selectedCard === card ? 'scale-110 -translate-y-2 ring-2 ring-cosmic-gold' : ''
                      }`}
                      onClick={() => handleCardClick(card)}
                    >
                      <div className="w-24 h-36 bg-gradient-to-br from-cosmic-800 to-cosmic-700 border border-cosmic-gold rounded-lg overflow-hidden">
                        <img 
                          src={card.image} 
                          alt={card.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BoosterAnimation />
      <ChatWindow />
    </div>
  );
}
