export interface GameState {
  gameId: string;
  players: {
    [playerId: string]: {
      health: number;
      hand: number[];
      deck: number[];
      graveyard: number[];
      commandZone: number[];
      unitZone: number[];
      commandPoints: number;
      hasDrawnCard: boolean;
      hasPlayedCommandCard: boolean;
    };
  };
  currentPhase: 'Command Phase' | 'Deployment Phase' | 'Battle Phase' | 'End Turn';
  currentPlayerId: string;
  turnNumber: number;
  gameStatus: 'waiting' | 'active' | 'finished';
  winnerId?: string;
}

export interface GameAction {
  type: string;
  data: any;
}

export class GameEngine {
  static createInitialGameState(): GameState {
    return {
      gameId: '',
      players: {},
      currentPhase: 'Command Phase',
      currentPlayerId: '',
      turnNumber: 1,
      gameStatus: 'waiting',
    };
  }

  static initializePlayer(gameState: GameState, playerId: string, deck: number[]): GameState {
    const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);
    const initialHand = shuffledDeck.splice(0, 7);

    gameState.players[playerId] = {
      health: 100,
      hand: initialHand,
      deck: shuffledDeck,
      graveyard: [],
      commandZone: [],
      unitZone: [],
      commandPoints: 0,
      hasDrawnCard: false,
      hasPlayedCommandCard: false,
    };

    if (!gameState.currentPlayerId) {
      gameState.currentPlayerId = playerId;
    }

    return gameState;
  }

  static processAction(gameState: GameState, actionType: string, actionData: any): GameState {
    const newState = JSON.parse(JSON.stringify(gameState)); // Deep clone
    const currentPlayer = newState.players[newState.currentPlayerId];

    switch (actionType) {
      case 'DRAW_CARD':
        return this.handleDrawCard(newState);

      case 'PLAY_CARD':
        return this.handlePlayCard(newState, actionData);

      case 'END_PHASE':
        return this.handleEndPhase(newState);

      case 'DEPLOY_UNIT':
        return this.handleDeployUnit(newState, actionData);

      case 'ATTACK':
        return this.handleAttack(newState, actionData);

      case 'USE_ABILITY':
        return this.handleUseAbility(newState, actionData);

      default:
        console.warn('Unknown action type:', actionType);
        return newState;
    }
  }

  private static handleDrawCard(gameState: GameState): GameState {
    const currentPlayer = gameState.players[gameState.currentPlayerId];

    if (gameState.currentPhase !== 'Command Phase' || currentPlayer.hasDrawnCard || currentPlayer.deck.length === 0) {
      return gameState;
    }

    const drawnCard = currentPlayer.deck.shift();
    if (drawnCard) {
      currentPlayer.hand.push(drawnCard);
      currentPlayer.hasDrawnCard = true;
    }

    return gameState;
  }

  private static handlePlayCard(gameState: GameState, actionData: { cardId: number, zone: string }): GameState {
    const currentPlayer = gameState.players[gameState.currentPlayerId];
    const { cardId, zone } = actionData;

    // Remove card from hand
    const cardIndex = currentPlayer.hand.indexOf(cardId);
    if (cardIndex === -1) {
      return gameState;
    }

    currentPlayer.hand.splice(cardIndex, 1);

    // Add to appropriate zone
    if (zone === 'command') {
      if (gameState.currentPhase === 'Command Phase' && !currentPlayer.hasPlayedCommandCard) {
        currentPlayer.commandZone.push(cardId);
        currentPlayer.hasPlayedCommandCard = true;
        // Add command points based on card type
        currentPlayer.commandPoints += this.getCommandPointsForCard(cardId);
      }
    } else if (zone === 'unit') {
      if (gameState.currentPhase === 'Deployment Phase') {
        const cardCost = this.getCardCost(cardId);
        if (currentPlayer.commandPoints >= cardCost) {
          currentPlayer.unitZone.push(cardId);
          currentPlayer.commandPoints -= cardCost;
        } else {
          // Return card to hand if not enough command points
          currentPlayer.hand.push(cardId);
        }
      }
    }

    return gameState;
  }

  private static handleEndPhase(gameState: GameState): GameState {
    switch (gameState.currentPhase) {
      case 'Command Phase':
        gameState.currentPhase = 'Deployment Phase';
        break;
      case 'Deployment Phase':
        gameState.currentPhase = 'Battle Phase';
        break;
      case 'Battle Phase':
        gameState.currentPhase = 'End Turn';
        break;
      case 'End Turn':
        // Switch to next player and reset to Command Phase
        const playerIds = Object.keys(gameState.players);
        const currentIndex = playerIds.indexOf(gameState.currentPlayerId);
        const nextIndex = (currentIndex + 1) % playerIds.length;
        gameState.currentPlayerId = playerIds[nextIndex];
        gameState.currentPhase = 'Command Phase';
        
        if (nextIndex === 0) {
          gameState.turnNumber++;
        }

        // Reset phase-specific flags
        Object.values(gameState.players).forEach(player => {
          player.hasDrawnCard = false;
          player.hasPlayedCommandCard = false;
        });
        break;
    }

    return gameState;
  }

  private static handleDeployUnit(gameState: GameState, actionData: { cardId: number, position: number }): GameState {
    // Unit deployment logic would go here
    return gameState;
  }

  private static handleAttack(gameState: GameState, actionData: { attackerId: number, targetId: number }): GameState {
    // Combat logic would go here
    const { attackerId, targetId } = actionData;
    
    // This would implement the actual combat rules
    // For now, just a placeholder
    
    return gameState;
  }

  private static handleUseAbility(gameState: GameState, actionData: { cardId: number, targetId?: number, additionalData?: any }): GameState {
    // Ability usage logic would go here
    return gameState;
  }

  private static getCommandPointsForCard(cardId: number): number {
    // This would look up card data to determine command points
    // For now, return default values
    return 1; // Most cards give 1 point, Shipyards give 2
  }

  private static getCardCost(cardId: number): number {
    // This would look up card data to determine cost
    // For now, return default cost
    return 1;
  }

  static checkWinCondition(gameState: GameState): string | null {
    for (const [playerId, player] of Object.entries(gameState.players)) {
      if (player.health <= 0) {
        // Find the winner (not the player with 0 health)
        const playerIds = Object.keys(gameState.players);
        const winnerId = playerIds.find(id => id !== playerId);
        return winnerId || null;
      }
    }
    return null;
  }

  static canPlayCard(gameState: GameState, playerId: string, cardId: number, zone: string): boolean {
    const player = gameState.players[playerId];
    
    if (!player.hand.includes(cardId)) {
      return false;
    }

    if (zone === 'command' && gameState.currentPhase === 'Command Phase' && !player.hasPlayedCommandCard) {
      return true;
    }

    if (zone === 'unit' && gameState.currentPhase === 'Deployment Phase') {
      const cardCost = this.getCardCost(cardId);
      return player.commandPoints >= cardCost;
    }

    return false;
  }
}
