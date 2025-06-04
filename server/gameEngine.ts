export interface GameState {
  currentPhase: 'Command' | 'Deployment' | 'Battle' | 'End Turn';
  currentPlayer: string;
  turnNumber: number;
  player1Health: number;
  player2Health: number;
  player1Hand: Card[];
  player2Hand: Card[];
  player1Field: { command: Card[]; units: Card[] };
  player2Field: { command: Card[]; units: Card[] };
  player1CommandPoints: number;
  player2CommandPoints: number;
  player1Deck: Card[];
  player2Deck: Card[];
  gameLog: GameLogEntry[];
}

export interface Card {
  id: number;
  name: string;
  type: string;
  cost: number;
  attack: number;
  defense: number;
  commandCost: number;
  unitMembers: number;
  rarity: string;
  imageUrl?: string;
  specialAbility?: string;
  traits: string[];
}

export interface GameLogEntry {
  timestamp: Date;
  playerId: string;
  action: string;
  details: any;
}

export interface GameAction {
  type: 'play_card' | 'end_phase' | 'draw_card' | 'attack' | 'use_ability';
  cardId?: number;
  targetId?: number;
  zoneType?: 'command' | 'unit';
  data?: any;
}

export class GameEngine {
  constructor() {}

  initializeGame(player1Id: string, player2Id?: string): GameState {
    // This would typically load deck data from the database
    // For now, creating a basic starting state
    const initialDeck = this.createStarterDeck();
    
    const initialState: GameState = {
      currentPhase: 'Command',
      currentPlayer: player1Id,
      turnNumber: 1,
      player1Health: 100,
      player2Health: 100,
      player1Hand: this.drawCards(initialDeck, 7),
      player2Hand: player2Id ? this.drawCards(initialDeck, 7) : [],
      player1Field: { command: [], units: [] },
      player2Field: { command: [], units: [] },
      player1CommandPoints: 0,
      player2CommandPoints: 0,
      player1Deck: initialDeck.slice(7),
      player2Deck: player2Id ? initialDeck.slice(7) : [],
      gameLog: []
    };

    this.addLogEntry(initialState, 'system', 'Game initialized');
    return initialState;
  }

  processAction(gameState: GameState, action: GameAction, playerId: string): GameState {
    const newState = { ...gameState };

    // Validate if it's the player's turn
    if (newState.currentPlayer !== playerId && playerId !== 'ai') {
      return newState;
    }

    switch (action.type) {
      case 'play_card':
        return this.handlePlayCard(newState, action, playerId);
      case 'end_phase':
        return this.handleEndPhase(newState, playerId);
      case 'draw_card':
        return this.handleDrawCard(newState, playerId);
      case 'attack':
        return this.handleAttack(newState, action, playerId);
      case 'use_ability':
        return this.handleUseAbility(newState, action, playerId);
      default:
        return newState;
    }
  }

  private handlePlayCard(gameState: GameState, action: GameAction, playerId: string): GameState {
    const newState = { ...gameState };
    const isPlayer1 = playerId === newState.currentPlayer && playerId !== 'ai';
    const hand = isPlayer1 ? newState.player1Hand : newState.player2Hand;
    const field = isPlayer1 ? newState.player1Field : newState.player2Field;
    
    const cardIndex = hand.findIndex(card => card.id === action.cardId);
    if (cardIndex === -1) return newState;

    const card = hand[cardIndex];
    
    // Check if card can be played in current phase
    if (!this.canPlayCard(card, newState.currentPhase, action.zoneType)) {
      return newState;
    }

    // Check command points for deployment phase
    if (newState.currentPhase === 'Deployment' && action.zoneType === 'unit') {
      const commandPoints = isPlayer1 ? newState.player1CommandPoints : newState.player2CommandPoints;
      if (card.commandCost > commandPoints) {
        return newState;
      }
      
      if (isPlayer1) {
        newState.player1CommandPoints -= card.commandCost;
      } else {
        newState.player2CommandPoints -= card.commandCost;
      }
    }

    // Remove card from hand and add to appropriate field
    hand.splice(cardIndex, 1);
    
    if (action.zoneType === 'command') {
      field.command.push(card);
      // Add command points if it's a shipyard
      if (card.type === 'Shipyard') {
        if (isPlayer1) {
          newState.player1CommandPoints += 2;
        } else {
          newState.player2CommandPoints += 2;
        }
      } else {
        if (isPlayer1) {
          newState.player1CommandPoints += 1;
        } else {
          newState.player2CommandPoints += 1;
        }
      }
    } else if (action.zoneType === 'unit') {
      field.units.push(card);
    }

    this.addLogEntry(newState, playerId, `Played ${card.name} to ${action.zoneType} zone`);
    
    return newState;
  }

  private handleEndPhase(gameState: GameState, playerId: string): GameState {
    const newState = { ...gameState };
    
    switch (newState.currentPhase) {
      case 'Command':
        newState.currentPhase = 'Deployment';
        break;
      case 'Deployment':
        newState.currentPhase = 'Battle';
        break;
      case 'Battle':
        newState.currentPhase = 'End Turn';
        break;
      case 'End Turn':
        // Switch to next player and start new turn
        newState.currentPhase = 'Command';
        newState.turnNumber++;
        // For AI games, keep player1 as current player
        if (newState.player2Health > 0) {
          newState.currentPlayer = newState.currentPlayer === newState.currentPlayer ? 'ai' : newState.currentPlayer;
        }
        break;
    }

    this.addLogEntry(newState, playerId, `Ended ${gameState.currentPhase} phase`);
    
    return newState;
  }

  private handleDrawCard(gameState: GameState, playerId: string): GameState {
    const newState = { ...gameState };
    
    // Only allow drawing in Command phase
    if (newState.currentPhase !== 'Command') {
      return newState;
    }

    const isPlayer1 = playerId === newState.currentPlayer && playerId !== 'ai';
    const deck = isPlayer1 ? newState.player1Deck : newState.player2Deck;
    const hand = isPlayer1 ? newState.player1Hand : newState.player2Hand;

    if (deck.length > 0) {
      const drawnCard = deck.shift()!;
      hand.push(drawnCard);
      this.addLogEntry(newState, playerId, `Drew a card`);
    }

    return newState;
  }

  private handleAttack(gameState: GameState, action: GameAction, playerId: string): GameState {
    const newState = { ...gameState };
    
    // Only allow attacks in Battle phase
    if (newState.currentPhase !== 'Battle') {
      return newState;
    }

    // Implementation for combat system
    // This would handle unit vs unit combat, direct attacks, etc.
    this.addLogEntry(newState, playerId, `Initiated attack`);
    
    return newState;
  }

  private handleUseAbility(gameState: GameState, action: GameAction, playerId: string): GameState {
    const newState = { ...gameState };
    
    // Implementation for special abilities
    this.addLogEntry(newState, playerId, `Used special ability`);
    
    return newState;
  }

  private canPlayCard(card: Card, phase: string, zoneType?: string): boolean {
    if (phase === 'Command' && zoneType === 'command') {
      return true;
    }
    
    if (phase === 'Deployment' && zoneType === 'unit') {
      return card.type !== 'Shipyard';
    }
    
    return false;
  }

  private createStarterDeck(): Card[] {
    // This would typically load from a predefined starter deck
    // For now, creating some basic cards
    const starterCards: Card[] = [];
    
    // Add basic cards with proper structure
    for (let i = 0; i < 30; i++) {
      starterCards.push({
        id: 1000 + i,
        name: `Basic Unit ${i + 1}`,
        type: 'Unit',
        cost: Math.floor(i / 5) + 1,
        attack: Math.floor(i / 10) + 1,
        defense: Math.floor(i / 10) + 1,
        commandCost: Math.floor(i / 5) + 1,
        unitMembers: 1,
        rarity: 'Common',
        traits: ['Basic']
      });
    }
    
    return starterCards;
  }

  private drawCards(deck: Card[], count: number): Card[] {
    const drawn = [];
    for (let i = 0; i < Math.min(count, deck.length); i++) {
      drawn.push(deck[i]);
    }
    return drawn;
  }

  private addLogEntry(gameState: GameState, playerId: string, action: string, details?: any): void {
    gameState.gameLog.push({
      timestamp: new Date(),
      playerId,
      action,
      details
    });
  }

  isGameOver(gameState: GameState): { isOver: boolean; winner?: string } {
    if (gameState.player1Health <= 0) {
      return { isOver: true, winner: gameState.player2Health > 0 ? 'player2' : undefined };
    }
    
    if (gameState.player2Health <= 0) {
      return { isOver: true, winner: gameState.player1Health > 0 ? 'player1' : undefined };
    }
    
    return { isOver: false };
  }
}
