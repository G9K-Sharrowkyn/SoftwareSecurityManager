import { useState, useEffect, useCallback } from 'react';
import { GameMechanics, Phases } from './GameMechanics';
import { cardsSpecifics, applyCardTraits } from './CardsSpecifics';
import { Card } from '@shared/schema';

interface GameInterfaceProps {
  deck: Card[];
  setDeck: (deck: Card[]) => void;
  gameId?: string;
  isMultiplayer?: boolean;
  onGameEnd?: (result: { won: boolean; stats: any }) => void;
}

export const GameInterface = ({ deck, setDeck, gameId, isMultiplayer = false, onGameEnd }: GameInterfaceProps) => {
  const [graveyard, setGraveyard] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [playerUnits, setPlayerUnits] = useState<Card[]>([]);
  const [playerCommands, setPlayerCommands] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [gameMechanics] = useState(new GameMechanics());
  const [currentPhase, setCurrentPhase] = useState(gameMechanics.getCurrentPhase());
  const [playerHP, setPlayerHP] = useState(100);
  const [shouldAnimateButton, setShouldAnimateButton] = useState(false);
  const [commandPoints, setCommandPoints] = useState(0);
  const [hasPlayedCommandCard, setHasPlayedCommandCard] = useState(false);
  const [hasDrawnCard, setHasDrawnCard] = useState(false);
  const [shouldAnimateDeckButton, setShouldAnimateDeckButton] = useState(false);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [opponentGraveyard, setOpponentGraveyard] = useState<Card[]>([]);
  const [turnNumber, setTurnNumber] = useState(1);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // WebSocket connection for multiplayer
  useEffect(() => {
    if (isMultiplayer && gameId) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connected');
        socket.send(JSON.stringify({
          type: 'join_game',
          gameId,
          userId: 'current_user', // This should come from auth context
        }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      setWs(socket);

      return () => {
        socket.close();
      };
    }
  }, [isMultiplayer, gameId]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'game_update':
        // Handle opponent moves
        handleOpponentMove(data.move);
        break;
      case 'game_state_updated':
        // Sync game state
        syncGameState(data.gameState);
        break;
      case 'player_joined':
        console.log('Player joined:', data.userId);
        break;
      case 'player_left':
        console.log('Player left');
        break;
    }
  };

  const handleOpponentMove = (move: any) => {
    // Handle different types of opponent moves
    console.log('Opponent move:', move);
  };

  const syncGameState = (gameState: any) => {
    setCurrentPhase(gameState.currentPhase);
    setTurnNumber(gameState.turnNumber);
    setCommandPoints(gameState.commandPoints);
    // Sync other game state as needed
  };

  const sendGameMove = (move: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'game_move',
        gameId,
        userId: 'current_user', // This should come from auth context
        move,
      }));
    }
  };

  const sendGameStateUpdate = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const gameState = {
        currentPhase,
        turnNumber,
        commandPoints,
        playerHP,
        opponentHealth,
        currentPlayerId: 'current_user', // This should come from auth context
      };

      ws.send(JSON.stringify({
        type: 'game_state_update',
        gameId,
        gameState,
      }));
    }
  };

  useEffect(() => {
    console.log("hasPlayedCommandCard updated to:", hasPlayedCommandCard);
  }, [hasPlayedCommandCard]);

  useEffect(() => {
    drawInitialHand();
  }, [deck]);

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

  useEffect(() => {
    drawInitialOpponentHand();
  }, [deck]);

  const drawInitialOpponentHand = () => {
    if (deck.length > 0 && opponentHand.length === 0) {
      let newOpponentHand: Card[] = [];
      let newDeck = [...deck];

      let cardsToDraw = Math.min(7, newDeck.length);
      let drawnCards = 0;

      while (drawnCards < cardsToDraw) {
        let cardIndex = Math.floor(Math.random() * newDeck.length);
        let selectedCard = newDeck.splice(cardIndex, 1)[0];

        if (selectedCard) {
          newOpponentHand.push(selectedCard);
          drawnCards++;
        }
      }

      setOpponentHand(newOpponentHand);
      setDeck(newDeck);
    }
  };

  const calculateTotalCommandPoints = () => {
    return playerCommands.reduce((total, card) => {
      const cardDetails = cardsSpecifics.find(c => c.name === card.name);
      return total + (cardDetails?.type.includes("Shipyard") ? 2 : 1);
    }, 0);
  };

  const handleCardClick = (card: Card) => {
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

    let newDeck = [...deck];
    let drawnCard = newDeck.shift();
    if (drawnCard) {
      setDeck(newDeck);
      setHand([...hand, drawnCard]);
      setHasDrawnCard(true);

      if (isMultiplayer) {
        sendGameMove({
          type: 'draw_card',
          data: { cardId: drawnCard.id },
        });
      }
    }
  };

  const drawInitialHand = () => {
    if (deck.length > 0 && hand.length === 0) {
      let newHand: Card[] = [];
      let newDeck = [...deck];

      let cardsToDraw = Math.min(7, newDeck.length);
      let drawnCards = 0;

      while (drawnCards < cardsToDraw) {
        let cardIndex = Math.floor(Math.random() * newDeck.length);
        let selectedCard = newDeck.splice(cardIndex, 1)[0];

        if (selectedCard) {
          newHand.push(selectedCard);
          drawnCards++;
        }
      }

      setHand(newHand);
      setDeck(newDeck);
    }
  };

  const handleEndPhase = () => {
    gameMechanics.endCurrentPhase();
    const newPhase = gameMechanics.getCurrentPhase();
    setCurrentPhase(newPhase);
    setShouldAnimateButton(false);

    if (newPhase === Phases.COMMAND) {
      setTurnNumber(prev => prev + 1);
    }

    if (isMultiplayer) {
      sendGameMove({
        type: 'end_phase',
        data: { newPhase, turnNumber },
      });
      sendGameStateUpdate();
    }
  };

  const selectCard = (card: Card) => {
    if (gameMechanics.getCurrentPhase() === Phases.BATTLE) {
      console.error("No card selection is allowed during the Battle Phase");
      return;
    }

    if (gameMechanics.getCurrentPhase() === Phases.END_TURN) {
      console.error("No card selection is allowed during the End Turn Phase");
      return;
    }

    if (selectedCard === card) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
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

        if (isMultiplayer) {
          sendGameMove({
            type: 'deploy_card',
            data: { card: selectedCard, zone, newCommandPoints: commandPoints - cardDetails.commandCost },
          });
        }
      } else if (zone === "player-command-zone") {
        setSelectedCard(null);
      }
      return;
    }

    if (gameMechanics.getCurrentPhase() === Phases.END_TURN) {
      console.error("No card deployment is allowed during the End Turn Phase");
      return;
    }

    if (gameMechanics.getCurrentPhase() === Phases.COMMAND) {
      if (zone === "player-command-zone") {
        if (hasPlayedCommandCard) {
          console.error("Can only play one card in the Command Phase into the command zone");
          return;
        }

        let pointsToAdd = cardDetails.type.includes("Shipyard") ? 2 : 1;
        setPlayerCommands([...playerCommands, selectedCard]);
        setCommandPoints(current => current + pointsToAdd);
        setShouldAnimateButton(true);
        setHasPlayedCommandCard(true);
        setHand(hand.filter(item => item !== selectedCard));
        setSelectedCard(null);

        if (isMultiplayer) {
          sendGameMove({
            type: 'deploy_command',
            data: { card: selectedCard, pointsAdded: pointsToAdd },
          });
        }
      } else {
        console.error("During the Command Phase, cards can only be played in the command zone");
        return;
      }
    }
  };

  // AI opponent logic (for single player games)
  const makeAIMove = useCallback(() => {
    if (isMultiplayer) return;

    // Simple AI that makes random valid moves
    setTimeout(() => {
      const aiActions = ['draw_card', 'play_command', 'end_phase'];
      const randomAction = aiActions[Math.floor(Math.random() * aiActions.length)];

      switch (randomAction) {
        case 'draw_card':
          if (opponentHand.length < 10) {
            const newCard = deck[Math.floor(Math.random() * deck.length)];
            if (newCard) {
              setOpponentHand(prev => [...prev, newCard]);
            }
          }
          break;
        case 'end_phase':
          handleEndPhase();
          break;
      }
    }, 1000);
  }, [isMultiplayer, deck, opponentHand.length]);

  useEffect(() => {
    if (!isMultiplayer && currentPhase === Phases.COMMAND) {
      makeAIMove();
    }
  }, [currentPhase, isMultiplayer, makeAIMove]);

  // Check for game end conditions
  useEffect(() => {
    if (playerHP <= 0) {
      onGameEnd?.({ won: false, stats: { turnNumber, cardsPlayed: playerUnits.length + playerCommands.length } });
    } else if (opponentHealth <= 0) {
      onGameEnd?.({ won: true, stats: { turnNumber, cardsPlayed: playerUnits.length + playerCommands.length } });
    }
  }, [playerHP, opponentHealth, onGameEnd, turnNumber, playerUnits.length, playerCommands.length]);

  return (
    <div className="flex flex-col h-screen justify-between bg-gradient-to-b from-space-black via-cosmic-blue to-space-black">
      {/* Opponent Area */}
      <div className="hand absolute top-0 flex justify-center items-start flex-wrap gap-4 mt-4 w-full">
        {opponentHand.map((card, index) => (
          <div key={index} className="card bg-gradient-to-br from-red-900 to-red-700 shadow-lg rounded overflow-hidden border border-red-500" style={{ maxWidth: '10%' }}>
            <div className="w-full h-24 bg-red-800 flex items-center justify-center">
              <i className="fas fa-question text-red-300"></i>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-0 left-0 p-4">
        <div className="mb-4">
          <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded block w-full">
            Opponent HP: {opponentHealth}
          </button>
        </div>
        <div className="mb-4">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded block w-full">
            Opponent Deck ({opponentDeck.length})
          </button>
        </div>
        <div>
          <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded block w-full">
            Opponent Graveyard ({opponentGraveyard.length})
          </button>
        </div>
      </div>

      {/* Game Controls */}
      <div className="zones-container flex-grow flex justify-center items-center">
        <div className="flex items-center space-x-4 bg-cosmic-blue/80 backdrop-blur-md rounded-xl p-4 border border-mystic-gold/30">
          <button className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded w-[300px]" disabled>
            Current Phase: {gameMechanics.getCurrentPhase()}
          </button>
          <button 
            className={`bg-mystic-gold hover:bg-amber text-space-black font-bold py-2 px-4 rounded transition-all duration-300 ${shouldAnimateButton ? 'animate-pulse-gold' : ''}`}
            onClick={handleEndPhase}
          >
            {currentPhase === Phases.BATTLE ? 'End Turn' : 'End Phase'}
          </button>
          <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Command Points: {commandPoints}
          </button>
          <div className="text-mystic-gold font-semibold">
            Turn: {turnNumber}
          </div>
        </div>
      </div>

      {/* Battle Zones */}
      <div className="opponent-zones flex-grow">
        <div className="opponent-unit-zone bg-red-900/30 border border-red-500/50 p-4 m-2 rounded cursor-pointer min-h-[14rem]">
          <div className="text-red-400 text-sm font-semibold mb-2">Opponent Units</div>
        </div>
        <div className="opponent-command-zone bg-red-900/30 border border-red-500/50 p-4 m-2 rounded cursor-pointer min-h-[14rem]">
          <div className="text-red-400 text-sm font-semibold mb-2">Opponent Command</div>
        </div>
      </div>

      <div className="player-zones flex-grow">
        <div 
          className="player-unit-zone bg-blue-900/30 border border-blue-500/50 p-4 m-2 rounded cursor-pointer min-h-[14rem] hover:border-mystic-gold transition-colors duration-300"
          onClick={() => deployCardToPlayerZone("player-unit-zone")}
        >
          <div className="text-blue-400 text-sm font-semibold mb-2">Your Units</div>
          {playerUnits.map((card, index) => (
            <div 
              key={index} 
              className={`inline-block mx-2 relative ${selectedCard === card ? 'scale-110 z-10' : ''} cursor-pointer hover:scale-105 transition-transform duration-200`} 
              onClick={(e) => { e.stopPropagation(); handleCardClick(card); }}
              style={{ maxWidth: '10%' }}
            >
              <div className="w-20 h-28 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg border border-blue-300 shadow-lg">
                <div className="p-2 h-full flex flex-col justify-between">
                  <div className="text-xs text-blue-100 font-semibold">{card.name}</div>
                  <div className="text-xs text-blue-200">{card.attack}/{card.defense}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div 
          className="player-command-zone bg-green-900/30 border border-green-500/50 p-4 m-2 rounded cursor-pointer min-h-[14rem] hover:border-mystic-gold transition-colors duration-300"
          onClick={() => deployCardToPlayerZone("player-command-zone")}
        >
          <div className="text-green-400 text-sm font-semibold mb-2">Your Command</div>
          {playerCommands.map((card, index) => (
            <div 
              key={index} 
              className={`inline-block mx-2 relative ${selectedCard === card ? 'scale-110 z-10' : ''} cursor-pointer hover:scale-105 transition-transform duration-200`} 
              onClick={(e) => { e.stopPropagation(); handleCardClick(card); }}
              style={{ maxWidth: '10%' }}
            >
              <div className="w-20 h-28 bg-gradient-to-br from-green-500 to-green-700 rounded-lg border border-green-300 shadow-lg">
                <div className="p-2 h-full flex flex-col justify-between">
                  <div className="text-xs text-green-100 font-semibold">{card.name}</div>
                  <div className="text-xs text-green-200">Shipyard</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Area */}
      <div className="bg-gradient-to-t from-cosmic-blue/30 to-transparent p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 overflow-hidden border-2 border-green-400">
              <div className="w-full h-full bg-green-500/20 flex items-center justify-center">
                <i className="fas fa-user text-green-200"></i>
              </div>
            </div>
            <div>
              <div className="font-semibold text-green-200">You</div>
              <div className="text-sm text-green-300/70">Health: {playerHP}/100</div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-green-400">Deck: {deck.length}</div>
            <div className="text-green-400">Graveyard: {graveyard.length}</div>
            <button 
              className={`bg-cosmic-blue hover:bg-blue-700 px-4 py-2 rounded text-sm transition-colors ${shouldAnimateDeckButton ? 'animate-pulse' : ''}`}
              onClick={drawCardFromDeck}
              disabled={currentPhase !== Phases.COMMAND || hasDrawnCard}
            >
              <i className="fas fa-plus mr-1"></i>Draw Card
            </button>
          </div>
        </div>

        {/* Player Hand */}
        <div className="flex justify-center space-x-3 overflow-x-auto pb-4">
          {hand.map((card, index) => (
            <div 
              key={index} 
              className={`flex-shrink-0 w-24 h-36 bg-gradient-to-br from-cosmic-blue to-midnight rounded-lg cursor-pointer border-2 transition-all duration-300 ${
                selectedCard === card 
                  ? 'border-mystic-gold shadow-lg shadow-mystic-gold/50 scale-110 -translate-y-2' 
                  : 'border-mystic-gold/50 hover:border-mystic-gold hover:scale-105 hover:-translate-y-1'
              }`}
              onClick={() => selectCard(card)}
            >
              <div className="p-2 h-full flex flex-col justify-between">
                <div className="text-xs text-mystic-gold font-semibold">{card.name}</div>
                <div className="text-xs text-star-silver">
                  <div>Cost: {card.commandCost}</div>
                  {card.attack > 0 && <div>ATK: {card.attack}</div>}
                  {card.defense > 0 && <div>DEF: {card.defense}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameInterface;
