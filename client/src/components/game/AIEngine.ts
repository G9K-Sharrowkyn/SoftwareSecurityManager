import { GameMechanics, GameState, Phases } from './GameMechanics';
import { cardsSpecifics, CardData } from './CardsSpecifics';

export type AIDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface AIDecision {
  type: 'play_card' | 'end_phase' | 'attack' | 'pass';
  cardIndex?: number;
  targetZone?: string;
  targetCard?: any;
}

export class AIEngine {
  private difficulty: AIDifficulty;
  private gameMechanics: GameMechanics;

  constructor(difficulty: AIDifficulty = 'Medium') {
    this.difficulty = difficulty;
    this.gameMechanics = new GameMechanics();
  }

  setGameMechanics(gameMechanics: GameMechanics): void {
    this.gameMechanics = gameMechanics;
  }

  makeDecision(gameState: GameState): AIDecision {
    const currentPhase = gameState.currentPhase;
    
    switch (currentPhase) {
      case Phases.COMMAND:
        return this.makeCommandPhaseDecision(gameState);
      case Phases.DEPLOYMENT:
        return this.makeDeploymentPhaseDecision(gameState);
      case Phases.BATTLE:
        return this.makeBattlePhaseDecision(gameState);
      case Phases.END_TURN:
        return { type: 'end_phase' };
      default:
        return { type: 'pass' };
    }
  }

  private makeCommandPhaseDecision(gameState: GameState): AIDecision {
    const hand = gameState.opponentHand;
    
    // Look for shipyard cards first (priority for command points)
    const shipyardCards = hand.filter(card => {
      const cardData = cardsSpecifics.find(c => c.name === card.name);
      return cardData?.type.includes('Shipyard');
    });

    if (shipyardCards.length > 0) {
      const cardIndex = hand.indexOf(shipyardCards[0]);
      return {
        type: 'play_card',
        cardIndex,
        targetZone: 'opponent-command-zone'
      };
    }

    // If no shipyards, end phase
    return { type: 'end_phase' };
  }

  private makeDeploymentPhaseDecision(gameState: GameState): AIDecision {
    const hand = gameState.opponentHand;
    const commandPoints = gameState.commandPoints;
    
    // Find playable units based on command points
    const playableUnits = hand.filter(card => {
      const cardData = cardsSpecifics.find(c => c.name === card.name);
      return cardData && 
             !cardData.type.includes('Shipyard') && 
             cardData.commandCost <= commandPoints;
    });

    if (playableUnits.length > 0) {
      // Choose based on difficulty
      let selectedCard;
      
      switch (this.difficulty) {
        case 'Easy':
          // Random selection
          selectedCard = playableUnits[Math.floor(Math.random() * playableUnits.length)];
          break;
        case 'Medium':
          // Prefer higher attack units
          selectedCard = playableUnits.sort((a, b) => {
            const cardA = cardsSpecifics.find(c => c.name === a.name);
            const cardB = cardsSpecifics.find(c => c.name === b.name);
            return (cardB?.attack || 0) - (cardA?.attack || 0);
          })[0];
          break;
        case 'Hard':
          // Strategic selection based on game state
          selectedCard = this.selectStrategicUnit(playableUnits, gameState);
          break;
        default:
          selectedCard = playableUnits[0];
      }

      const cardIndex = hand.indexOf(selectedCard);
      return {
        type: 'play_card',
        cardIndex,
        targetZone: 'opponent-unit-zone'
      };
    }

    return { type: 'end_phase' };
  }

  private makeBattlePhaseDecision(gameState: GameState): AIDecision {
    // Simple battle phase - just end phase for now
    // In a more complex implementation, this would handle targeting decisions
    return { type: 'end_phase' };
  }

  private selectStrategicUnit(playableUnits: any[], gameState: GameState): any {
    const playerUnits = gameState.playerUnits;
    const opponentUnits = gameState.opponentUnits;

    // Calculate threat level
    const playerThreat = playerUnits.reduce((total, unit) => {
      const cardData = cardsSpecifics.find(c => c.name === unit.name);
      return total + (cardData?.attack || 0);
    }, 0);

    // If player has high threat, prioritize defensive units
    if (playerThreat > 10) {
      const defensiveUnits = playableUnits.filter(card => {
        const cardData = cardsSpecifics.find(c => c.name === card.name);
        return cardData && cardData.defense >= cardData.attack;
      });
      
      if (defensiveUnits.length > 0) {
        return defensiveUnits.sort((a, b) => {
          const cardA = cardsSpecifics.find(c => c.name === a.name);
          const cardB = cardsSpecifics.find(c => c.name === b.name);
          return (cardB?.defense || 0) - (cardA?.defense || 0);
        })[0];
      }
    }

    // Otherwise, prioritize attack
    return playableUnits.sort((a, b) => {
      const cardA = cardsSpecifics.find(c => c.name === a.name);
      const cardB = cardsSpecifics.find(c => c.name === b.name);
      return (cardB?.attack || 0) - (cardA?.attack || 0);
    })[0];
  }

  // Simulate AI turn
  simulateAITurn(gameState: GameState): GameState {
    let currentState = { ...gameState };
    currentState.currentPlayer = 'opponent';
    currentState.currentPhase = Phases.COMMAND;

    // Execute AI decisions for each phase
    while (currentState.currentPlayer === 'opponent') {
      const decision = this.makeDecision(currentState);
      
      if (decision.type === 'end_phase') {
        this.gameMechanics.updateGameState(currentState);
        this.gameMechanics.endCurrentPhase();
        currentState = this.gameMechanics.getGameState();
      } else if (decision.type === 'play_card' && decision.cardIndex !== undefined) {
        // Apply the AI's card play
        const card = currentState.opponentHand[decision.cardIndex];
        if (card) {
          // Remove from hand
          currentState.opponentHand.splice(decision.cardIndex, 1);
          
          // Add to appropriate zone
          if (decision.targetZone === 'opponent-command-zone') {
            currentState.opponentCommands.push(card);
          } else if (decision.targetZone === 'opponent-unit-zone') {
            currentState.opponentUnits.push(card);
          }
        }
      }

      // Prevent infinite loops
      if (currentState.currentPhase === Phases.END_TURN) {
        break;
      }
    }

    return currentState;
  }

  // Get AI personality traits based on difficulty
  getAIPersonality(): { name: string; description: string; avatar: string } {
    switch (this.difficulty) {
      case 'Easy':
        return {
          name: 'Cadet Zyx',
          description: 'A rookie commander learning the ropes',
          avatar: '🤖'
        };
      case 'Medium':
        return {
          name: 'Commander Nexus',
          description: 'An experienced tactical officer',
          avatar: '👽'
        };
      case 'Hard':
        return {
          name: 'Admiral Vortex',
          description: 'A legendary strategist with countless victories',
          avatar: '💀'
        };
      default:
        return {
          name: 'AI Opponent',
          description: 'Unknown difficulty',
          avatar: '❓'
        };
    }
  }
}

export default AIEngine;
