import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GameMechanics, { Phases } from './GameMechanics';
import cardsSpecifics from './CardsSpecifics';
import BoosterAnimation from './BoosterAnimation';

interface GameInterfaceProps {
  game: any;
  cards: any[];
  user: any;
}

const GameInterface: React.FC<GameInterfaceProps> = ({ game, cards, user }) => {
  const [graveyard, setGraveyard] = useState([]);
  const [hand, setHand] = useState([]);
  const [playerUnits, setPlayerUnits] = useState([]);
  const [playerCommands, setPlayerCommands] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [gameMechanics] = useState(new GameMechanics());
  const [currentPhase, setCurrentPhase] = useState(gameMechanics.getCurrentPhase());
  const [playerHP, setPlayerHP] = useState(100);
  const [commandPoints, setCommandPoints] = useState(0);
  const [hasPlayedCommandCard, setHasPlayedCommandCard] = useState(false);
  const [hasDrawnCard, setHasDrawnCard] = useState(false);
  const [opponentHand, setOpponentHand] = useState([]);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [opponentGraveyard, setOpponentGraveyard] = useState([]);

  useEffect(() => {
    drawInitialHand();
    drawInitialOpponentHand();
  }, [cards]);

  useEffect(() => {
    if (currentPhase === Phases.COMMAND) {
      setHasPlayedCommandCard(false);
      setHasDrawnCard(false);
      setCommandPoints(calculateTotalCommandPoints());
    }
  }, [currentPhase, playerCommands]);

  const drawInitialHand = () => {
    if (cards.length > 0 && hand.length === 0) {
      let newHand = [];
      let availableCards = [...cards];

      let cardsToDraw = Math.min(7, availableCards.length);
      let drawnCards = 0;

      while (drawnCards < cardsToDraw) {
        let cardIndex = Math.floor(Math.random() * availableCards.length);
        let selectedCard = availableCards.splice(cardIndex, 1)[0];

        if (selectedCard) {
          newHand.push(selectedCard);
          drawnCards++;
        }
      }

      setHand(newHand);
    }
  };

  const drawInitialOpponentHand = () => {
    if (cards.length > 0 && opponentHand.length === 0) {
      let newOpponentHand = [];
      let availableCards = [...cards];

      let cardsToDraw = Math.min(7, availableCards.length);
      let drawnCards = 0;

      while (drawnCards < cardsToDraw) {
        let cardIndex = Math.floor(Math.random() * availableCards.length);
        let selectedCard = availableCards.splice(cardIndex, 1)[0];

        if (selectedCard) {
          newOpponentHand.push(selectedCard);
          drawnCards++;
        }
      }

      setOpponentHand(newOpponentHand);
    }
  };

  const calculateTotalCommandPoints = () => {
    return playerCommands.reduce((total, card) => {
      const cardDetails = cardsSpecifics.find(c => c.name === card.name) || card;
      return total + (cardDetails.type?.includes("Shipyard") ? 2 : 1);
    }, 0);
  };

  const handleCardClick = (card: any) => {
    if (selectedCard === card) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const drawCardFromDeck = () => {
    if (currentPhase !== Phases.COMMAND || hasDrawnCard || cards.length === 0) {
      console.error("Cannot draw a card now");
      return;
    }

    let availableCards = cards.filter(card => !hand.includes(card));
    if (availableCards.length > 0) {
      let drawnCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      setHand([...hand, drawnCard]);
      setHasDrawnCard(true);
    }
  };

  const handleEndPhase = () => {
    gameMechanics.endCurrentPhase();
    setCurrentPhase(gameMechanics.getCurrentPhase());
  };

  const deployCardToPlayerZone = (zone: string) => {
    if (!selectedCard) {
      console.error("No card selected");
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
        const cardDetails = cardsSpecifics.find(card => card.name === selectedCard.name) || selectedCard;
        if (cardDetails.commandCost > commandPoints) {
          console.error("Not enough command points to play this card");
          return;
        }
        setPlayerUnits([...playerUnits, selectedCard]);
        setCommandPoints(current => Math.max(0, current - cardDetails.commandCost));
        setHand(hand.filter(item => item !== selectedCard));
        setSelectedCard(null);
      }
      return;
    }

    if (gameMechanics.getCurrentPhase() === Phases.COMMAND) {
      if (zone === "player-command-zone") {
        if (hasPlayedCommandCard) {
          console.error("Can only play one card in the Command Phase into the command zone");
          return;
        }

        const cardDetails = cardsSpecifics.find(card => card.name === selectedCard.name) || selectedCard;
        let pointsToAdd = cardDetails.type?.includes("Shipyard") ? 2 : 1;
        setPlayerCommands([...playerCommands, selectedCard]);
        setCommandPoints(current => current + pointsToAdd);
        setHasPlayedCommandCard(true);
        setHand(hand.filter(item => item !== selectedCard));
        setSelectedCard(null);
      } else {
        console.error("During the Command Phase, cards can only be played in the command zone");
        return;
      }
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-900 text-cosmic-silver">
      {/* Game Header */}
      <div className="bg-cosmic-800/90 backdrop-blur-md border-b border-cosmic-600 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-cosmic-silver hover:text-cosmic-gold"
            >
              <i className="fas fa-arrow-left mr-2"></i>Exit Game
            </Button>
            <div className="flex items-center space-x-4">
              <div className="bg-cosmic-700 px-4 py-2 rounded-lg">
                <span className="text-cosmic-gold font-semibold">{currentPhase}</span>
              </div>
              <div className="bg-cosmic-700 px-4 py-2 rounded-lg">
                <span className="text-cosmic-silver">Turn: </span>
                <span className="text-cosmic-gold font-semibold">1</span>
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
              className="bg-green-600 hover:bg-green-700"
            >
              End Phase
            </Button>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Opponent Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <img 
                src="https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=48&h=48&fit=crop&crop=face" 
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
              <div className="text-red-400">Graveyard: {opponentGraveyard.length}</div>
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
            <Card className="bg-red-900/30 border-red-500/50 min-h-32">
              <CardContent className="p-4">
                <div className="text-red-400 text-sm font-semibold mb-2">Command Zone</div>
              </CardContent>
            </Card>
            <Card className="bg-red-900/30 border-red-500/50 min-h-32">
              <CardContent className="p-4">
                <div className="text-red-400 text-sm font-semibold mb-2">Unit Zone</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Battle Zone */}
        <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-red-400 font-bold text-lg mb-4">
              <i className="fas fa-crossed-swords mr-2"></i>
              Battle Zone
            </div>
            <div className="text-cosmic-silver/70">
              Combat will be resolved here during the Battle Phase
            </div>
          </CardContent>
        </Card>

        {/* Player Area */}
        <div className="space-y-4">
          {/* Player Zones */}
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className="bg-cosmic-gold/20 border-cosmic-gold/50 min-h-32 cursor-pointer hover:border-cosmic-gold transition-colors duration-200"
              onClick={() => deployCardToPlayerZone("player-command-zone")}
            >
              <CardContent className="p-4">
                <div className="text-cosmic-gold text-sm font-semibold mb-2">Your Command Zone</div>
                <div className="flex flex-wrap gap-2">
                  {playerCommands.map((card, index) => (
                    <div key={index} className="w-16 h-24 bg-cosmic-gold/20 border border-cosmic-gold rounded-lg overflow-hidden">
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cosmic-gold text-xs">
                          {card.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="bg-green-500/20 border-green-500/50 min-h-32 cursor-pointer hover:border-cosmic-gold transition-colors duration-200"
              onClick={() => deployCardToPlayerZone("player-unit-zone")}
            >
              <CardContent className="p-4">
                <div className="text-green-400 text-sm font-semibold mb-2">Your Unit Zone</div>
                <div className="flex flex-wrap gap-2">
                  {playerUnits.map((card, index) => (
                    <div 
                      key={index} 
                      className={`w-16 h-24 bg-green-500/20 border border-green-500 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 ${selectedCard === card ? 'ring-2 ring-cosmic-gold' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleCardClick(card); }}
                    >
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-green-400 text-xs">
                          {card.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Player Info */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=48&h=48&fit=crop&crop=face"} 
                alt="Player" 
                className="w-12 h-12 rounded-full border-2 border-blue-500 object-cover" 
              />
              <div>
                <div className="text-blue-400 font-semibold">{user?.firstName || "Player"}</div>
                <div className="text-blue-300">Health: {playerHP}/100</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={drawCardFromDeck}
                disabled={hasDrawnCard || currentPhase !== Phases.COMMAND}
                className="bg-cosmic-700 hover:bg-cosmic-600"
              >
                <i className="fas fa-plus mr-2"></i>Draw Card
              </Button>
              <div className="text-blue-400">Deck: {cards.length - hand.length}</div>
              <div className="text-blue-400">Graveyard: {graveyard.length}</div>
            </div>
          </div>

          {/* Player Hand */}
          <Card className="bg-cosmic-800/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center text-cosmic-silver/70 mb-3">Your Hand</div>
              <div className="flex justify-center space-x-3 overflow-x-auto">
                {hand.map((card, index) => (
                  <div 
                    key={index} 
                    className={`flex-shrink-0 w-24 h-36 bg-gradient-to-br from-cosmic-800 to-cosmic-700 border-2 rounded-lg cursor-pointer hover:scale-110 hover:-translate-y-2 transition-all duration-300 overflow-hidden ${selectedCard === card ? 'border-cosmic-gold' : 'border-cosmic-gold/50'}`}
                    onClick={() => handleCardClick(card)}
                  >
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-2 h-full flex flex-col justify-between text-xs">
                        <div className="text-cosmic-gold font-semibold">{card.name}</div>
                        <div className="space-y-1">
                          <div className="text-cosmic-silver">Cost: {card.commandCost}</div>
                          {card.attack && card.defense && (
                            <div className="flex justify-between">
                              <span className="text-red-400">A:{card.attack}</span>
                              <span className="text-blue-400">D:{card.defense}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BoosterAnimation visible={false} />
    </div>
  );
};

export default GameInterface;
