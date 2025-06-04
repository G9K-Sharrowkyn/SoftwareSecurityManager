import type { GameState } from './gameEngine';

export interface AIAction {
  type: string;
  data: any;
}

export class AIEngine {
  static getNextAction(gameState: GameState, difficulty: string = 'Medium'): AIAction | null {
    const aiPlayerId = this.findAIPlayerId(gameState);
    if (!aiPlayerId || gameState.currentPlayerId !== aiPlayerId) {
      return null;
    }

    const aiPlayer = gameState.players[aiPlayerId];
    
    switch (gameState.currentPhase) {
      case 'Command Phase':
        return this.getCommandPhaseAction(gameState, aiPlayerId, difficulty);
      
      case 'Deployment Phase':
        return this.getDeploymentPhaseAction(gameState, aiPlayerId, difficulty);
      
      case 'Battle Phase':
        return this.getBattlePhaseAction(gameState, aiPlayerId, difficulty);
      
      case 'End Turn':
        return { type: 'END_PHASE', data: {} };
      
      default:
        return null;
    }
  }

  private static findAIPlayerId(gameState: GameState): string | null {
    // In AI games, we assume one player is 'AI'
    // This could be improved to track AI players better
    const playerIds = Object.keys(gameState.players);
    return playerIds.find(id => id === 'AI') || playerIds[1] || null;
  }

  private static getCommandPhaseAction(gameState: GameState, aiPlayerId: string, difficulty: string): AIAction | null {
    const aiPlayer = gameState.players[aiPlayerId];

    // First, try to draw a card if we haven't already
    if (!aiPlayer.hasDrawnCard && aiPlayer.deck.length > 0) {
      return { type: 'DRAW_CARD', data: {} };
    }

    // Then, try to play a command card if we haven't already
    if (!aiPlayer.hasPlayedCommandCard && aiPlayer.hand.length > 0) {
      const commandCards = this.getCommandCardsInHand(aiPlayer.hand);
      if (commandCards.length > 0) {
        const selectedCard = this.selectBestCommandCard(commandCards, difficulty);
        return {
          type: 'PLAY_CARD',
          data: { cardId: selectedCard, zone: 'command' }
        };
      }
    }

    // End phase if nothing else to do
    return { type: 'END_PHASE', data: {} };
  }

  private static getDeploymentPhaseAction(gameState: GameState, aiPlayerId: string, difficulty: string): AIAction | null {
    const aiPlayer = gameState.players[aiPlayerId];

    // Try to deploy units based on available command points
    const deployableUnits = this.getDeployableUnits(aiPlayer.hand, aiPlayer.commandPoints);
    
    if (deployableUnits.length > 0) {
      const selectedUnit = this.selectBestUnit(deployableUnits, difficulty, gameState, aiPlayerId);
      return {
        type: 'PLAY_CARD',
        data: { cardId: selectedUnit, zone: 'unit' }
      };
    }

    // End phase if no deployable units
    return { type: 'END_PHASE', data: {} };
  }

  private static getBattlePhaseAction(gameState: GameState, aiPlayerId: string, difficulty: string): AIAction | null {
    const aiPlayer = gameState.players[aiPlayerId];
    const enemyPlayerId = this.getEnemyPlayerId(gameState, aiPlayerId);
    
    if (!enemyPlayerId) {
      return { type: 'END_PHASE', data: {} };
    }

    const enemyPlayer = gameState.players[enemyPlayerId];

    // Simple AI strategy: attack with all units
    if (aiPlayer.unitZone.length > 0) {
      const attackingUnit = aiPlayer.unitZone[0];
      
      // Choose target based on difficulty
      let targetId: number | string;
      
      if (enemyPlayer.unitZone.length > 0 && difficulty !== 'Easy') {
        // Attack enemy units if they exist (except on Easy)
        targetId = enemyPlayer.unitZone[0];
      } else {
        // Attack player directly
        targetId = enemyPlayerId;
      }

      return {
        type: 'ATTACK',
        data: { attackerId: attackingUnit, targetId }
      };
    }

    // End phase if no units to attack with
    return { type: 'END_PHASE', data: {} };
  }

  private static getCommandCardsInHand(hand: number[]): number[] {
    // This would check card types to find command cards
    // For now, assume any card can be played as command
    return hand.slice(0, 1); // Just take first card for simplicity
  }

  private static selectBestCommandCard(commandCards: number[], difficulty: string): number {
    // AI decision making based on difficulty
    switch (difficulty) {
      case 'Easy':
        // Random selection
        return commandCards[Math.floor(Math.random() * commandCards.length)];
      
      case 'Medium':
        // Slightly better selection (prefer higher value cards)
        return commandCards[0]; // Simplified
      
      case 'Hard':
        // Optimal selection based on game state
        return this.getOptimalCommandCard(commandCards);
      
      default:
        return commandCards[0];
    }
  }

  private static getDeployableUnits(hand: number[], commandPoints: number): number[] {
    // This would filter units by cost vs available command points
    // For now, assume all cards in hand are deployable if we have any points
    return commandPoints > 0 ? hand.slice(0, Math.min(hand.length, commandPoints)) : [];
  }

  private static selectBestUnit(deployableUnits: number[], difficulty: string, gameState: GameState, aiPlayerId: string): number {
    // AI unit selection based on difficulty
    switch (difficulty) {
      case 'Easy':
        return deployableUnits[Math.floor(Math.random() * deployableUnits.length)];
      
      case 'Medium':
        // Prefer units that cost more (generally stronger)
        return deployableUnits[0];
      
      case 'Hard':
        // Consider game state and opponent's units
        return this.getOptimalUnit(deployableUnits, gameState, aiPlayerId);
      
      default:
        return deployableUnits[0];
    }
  }

  private static getOptimalCommandCard(commandCards: number[]): number {
    // Advanced AI logic for selecting best command card
    // This would consider card abilities, current game state, etc.
    return commandCards[0]; // Simplified for now
  }

  private static getOptimalUnit(deployableUnits: number[], gameState: GameState, aiPlayerId: string): number {
    // Advanced AI logic for selecting best unit
    // This would consider unit stats, abilities, current board state, etc.
    return deployableUnits[0]; // Simplified for now
  }

  private static getEnemyPlayerId(gameState: GameState, aiPlayerId: string): string | null {
    const playerIds = Object.keys(gameState.players);
    return playerIds.find(id => id !== aiPlayerId) || null;
  }

  static evaluateGameState(gameState: GameState, playerId: string): number {
    // Evaluate how good the current game state is for the AI
    // Returns a score (higher = better for AI)
    const player = gameState.players[playerId];
    const enemyId = this.getEnemyPlayerId(gameState, playerId);
    
    if (!enemyId) return 0;
    
    const enemy = gameState.players[enemyId];
    
    let score = 0;
    
    // Health difference
    score += (player.health - enemy.health) * 2;
    
    // Unit advantage
    score += (player.unitZone.length - enemy.unitZone.length) * 10;
    
    // Command point advantage
    score += (player.commandPoints - enemy.commandPoints) * 5;
    
    // Hand size advantage
    score += (player.hand.length - enemy.hand.length) * 3;
    
    return score;
  }
}
