import { GameState, GameMove, Phases, GameEngine } from "./gameEngine";

export type AIDifficulty = "easy" | "medium" | "hard";

export class AIPlayer {
  static makeMove(gameState: GameState, difficulty: AIDifficulty): GameMove | null {
    const aiPlayerId = Object.keys(gameState.players).find(id => id.startsWith("ai_"));
    if (!aiPlayerId) return null;

    const aiPlayer = gameState.players[aiPlayerId];
    if (!aiPlayer) return null;

    switch (gameState.currentPhase) {
      case Phases.COMMAND:
        return this.makeCommandPhaseMove(gameState, aiPlayerId, difficulty);
      
      case Phases.DEPLOYMENT:
        return this.makeDeploymentPhaseMove(gameState, aiPlayerId, difficulty);
      
      case Phases.BATTLE:
        return this.makeBattlePhaseMove(gameState, aiPlayerId, difficulty);
      
      case Phases.END_TURN:
        return { type: 'end_phase', data: {}, playerId: aiPlayerId };
      
      default:
        return null;
    }
  }

  private static makeCommandPhaseMove(gameState: GameState, aiPlayerId: string, difficulty: AIDifficulty): GameMove | null {
    const aiPlayer = gameState.players[aiPlayerId];
    
    // Always try to draw a card first if possible
    if (!aiPlayer.hasDrawnCard && aiPlayer.deck.length > 0) {
      if (difficulty === "easy" && Math.random() < 0.3) {
        // Easy AI sometimes forgets to draw
        return { type: 'end_phase', data: {}, playerId: aiPlayerId };
      }
      return { type: 'draw_card', data: {}, playerId: aiPlayerId };
    }

    // Try to play a command card if we haven't yet
    if (!aiPlayer.hasPlayedCommandCard) {
      const playableCommandCards = aiPlayer.hand.filter(card => 
        card.type.includes("Shipyard") || card.type.includes("Command")
      );

      if (playableCommandCards.length > 0) {
        let selectedCard;
        
        switch (difficulty) {
          case "easy":
            // Random selection
            selectedCard = playableCommandCards[Math.floor(Math.random() * playableCommandCards.length)];
            break;
          
          case "medium":
            // Prefer shipyards for more command points
            selectedCard = playableCommandCards.find(card => card.type.includes("Shipyard")) || playableCommandCards[0];
            break;
          
          case "hard":
            // Strategic selection based on game state
            selectedCard = this.selectBestCommandCard(playableCommandCards, gameState, aiPlayerId);
            break;
        }

        if (selectedCard) {
          return {
            type: 'play_card',
            data: { card: selectedCard, targetZone: "command" },
            playerId: aiPlayerId
          };
        }
      }
    }

    // End phase if nothing else to do
    return { type: 'end_phase', data: {}, playerId: aiPlayerId };
  }

  private static makeDeploymentPhaseMove(gameState: GameState, aiPlayerId: string, difficulty: AIDifficulty): GameMove | null {
    const aiPlayer = gameState.players[aiPlayerId];
    
    // Find playable unit cards
    const playableUnits = aiPlayer.hand.filter(card => 
      card.type.includes("Unit") && card.commandCost <= aiPlayer.commandPoints
    );

    if (playableUnits.length > 0) {
      let selectedCard;
      
      switch (difficulty) {
        case "easy":
          // Play cheapest card
          selectedCard = playableUnits.reduce((cheapest, card) => 
            card.commandCost < cheapest.commandCost ? card : cheapest
          );
          break;
        
        case "medium":
          // Balance cost and power
          selectedCard = playableUnits.reduce((best, card) => 
            (card.attack + card.defense) / card.commandCost > (best.attack + best.defense) / best.commandCost ? card : best
          );
          break;
        
        case "hard":
          // Strategic deployment based on board state
          selectedCard = this.selectBestUnitCard(playableUnits, gameState, aiPlayerId);
          break;
      }

      if (selectedCard) {
        return {
          type: 'play_card',
          data: { card: selectedCard, targetZone: "unit" },
          playerId: aiPlayerId
        };
      }
    }

    // End phase if no good plays
    return { type: 'end_phase', data: {}, playerId: aiPlayerId };
  }

  private static makeBattlePhaseMove(gameState: GameState, aiPlayerId: string, difficulty: AIDifficulty): GameMove | null {
    const aiPlayer = gameState.players[aiPlayerId];
    const opponentId = Object.keys(gameState.players).find(id => !id.startsWith("ai_"));
    
    if (!opponentId) {
      return { type: 'end_phase', data: {}, playerId: aiPlayerId };
    }

    const opponent = gameState.players[opponentId];
    
    // Find units that can attack
    const attackingUnits = aiPlayer.unitZone.filter(unit => unit.attack > 0);
    
    if (attackingUnits.length === 0) {
      return { type: 'end_phase', data: {}, playerId: aiPlayerId };
    }

    // Simple attack strategy based on difficulty
    for (const unit of attackingUnits) {
      let target = null;
      
      switch (difficulty) {
        case "easy":
          // Random attacks
          if (Math.random() < 0.5 && opponent.unitZone.length > 0) {
            target = opponent.unitZone[Math.floor(Math.random() * opponent.unitZone.length)];
          }
          break;
        
        case "medium":
          // Attack weak units or go face
          target = opponent.unitZone.find(u => u.defense <= unit.attack);
          break;
        
        case "hard":
          // Optimal targeting
          target = this.selectBestTarget(unit, opponent, gameState);
          break;
      }

      return {
        type: 'attack',
        data: { attackerId: unit.id, targetId: target?.id },
        playerId: aiPlayerId
      };
    }

    return { type: 'end_phase', data: {}, playerId: aiPlayerId };
  }

  private static selectBestCommandCard(cards: any[], gameState: GameState, aiPlayerId: string): any {
    // Prefer shipyards for command point generation
    const shipyards = cards.filter(card => card.type.includes("Shipyard"));
    if (shipyards.length > 0) {
      return shipyards[0];
    }
    
    // Otherwise return first available command card
    return cards[0];
  }

  private static selectBestUnitCard(cards: any[], gameState: GameState, aiPlayerId: string): any {
    const opponentId = Object.keys(gameState.players).find(id => !id.startsWith("ai_"));
    if (!opponentId) return cards[0];

    const opponent = gameState.players[opponentId];
    const aiPlayer = gameState.players[aiPlayerId];
    
    // If opponent has no units, prioritize attack
    if (opponent.unitZone.length === 0) {
      return cards.reduce((best, card) => card.attack > best.attack ? card : best);
    }
    
    // If opponent has strong units, prioritize defense or removal
    const strongestOpponentUnit = opponent.unitZone.reduce((strongest, unit) => 
      unit.attack > strongest.attack ? unit : strongest
    );
    
    if (strongestOpponentUnit.attack >= 4) {
      // Look for units that can defend well
      return cards.reduce((best, card) => card.defense > best.defense ? card : best);
    }
    
    // Default to best cost/power ratio
    return cards.reduce((best, card) => 
      (card.attack + card.defense) / card.commandCost > (best.attack + best.defense) / best.commandCost ? card : best
    );
  }

  private static selectBestTarget(attacker: any, opponent: any, gameState: GameState): any | null {
    // If we can destroy a unit without dying, do it
    const destroyableUnits = opponent.unitZone.filter(unit => 
      unit.defense <= attacker.attack && unit.attack < attacker.defense
    );
    
    if (destroyableUnits.length > 0) {
      // Target the most valuable destroyable unit
      return destroyableUnits.reduce((best, unit) => 
        (unit.attack + unit.defense) > (best.attack + best.defense) ? unit : best
      );
    }
    
    // If no safe targets and opponent has no units, attack face
    if (opponent.unitZone.length === 0) {
      return null; // null target means attack player directly
    }
    
    // If we can't attack safely, consider if trading is worth it
    const tradableUnits = opponent.unitZone.filter(unit => 
      unit.defense <= attacker.attack && unit.attack >= attacker.defense
    );
    
    if (tradableUnits.length > 0) {
      // Trade with the most valuable unit
      return tradableUnits.reduce((best, unit) => 
        (unit.attack + unit.defense) > (best.attack + best.defense) ? unit : best
      );
    }
    
    // No good targets, don't attack
    return null;
  }

  static evaluateGameState(gameState: GameState, aiPlayerId: string): number {
    const aiPlayer = gameState.players[aiPlayerId];
    const opponentId = Object.keys(gameState.players).find(id => !id.startsWith("ai_"));
    
    if (!opponentId) return 0;
    
    const opponent = gameState.players[opponentId];
    
    let score = 0;
    
    // Health difference
    score += (aiPlayer.health - opponent.health) * 2;
    
    // Board presence
    const aiBoardValue = aiPlayer.unitZone.reduce((total, unit) => total + unit.attack + unit.defense, 0);
    const opponentBoardValue = opponent.unitZone.reduce((total, unit) => total + unit.attack + unit.defense, 0);
    score += (aiBoardValue - opponentBoardValue) * 3;
    
    // Hand size advantage
    score += (aiPlayer.hand.length - opponent.hand.length) * 2;
    
    // Command point advantage
    score += (aiPlayer.commandPoints - opponent.commandPoints);
    
    return score;
  }
}
