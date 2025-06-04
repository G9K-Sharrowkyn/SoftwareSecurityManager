import { GameState, PlayerState, GameMove } from "./gameEngine";

export type AIDifficulty = "Easy" | "Medium" | "Hard";

export class AIEngine {
  private difficulty: AIDifficulty;

  constructor(difficulty: AIDifficulty) {
    this.difficulty = difficulty;
  }

  async makeMove(gameState: GameState): Promise<GameMove | null> {
    const aiPlayer = this.getAIPlayer(gameState);
    if (!aiPlayer) return null;

    switch (gameState.currentPhase) {
      case "Command Phase":
        return this.makeCommandPhaseMove(aiPlayer, gameState);
      case "Deployment Phase":
        return this.makeDeploymentPhaseMove(aiPlayer, gameState);
      case "Battle Phase":
        return this.makeBattlePhaseMove(aiPlayer, gameState);
      case "End Turn":
        return { playerId: "AI", action: "end_turn" };
      default:
        return { playerId: "AI", action: "end_phase" };
    }
  }

  private getAIPlayer(gameState: GameState): PlayerState | null {
    return gameState.players["AI"] || null;
  }

  private makeCommandPhaseMove(aiPlayer: PlayerState, gameState: GameState): GameMove {
    // AI strategy for command phase
    if (!aiPlayer.hasDrawnCard && aiPlayer.deck.length > 0) {
      // Always draw a card if possible
      return { playerId: "AI", action: "draw_card" };
    }

    if (!aiPlayer.hasPlayedCommandCard) {
      // Try to play a command card
      const commandCards = aiPlayer.hand.filter(card => 
        card.type.includes("Shipyard") || this.isCommandCard(card)
      );

      if (commandCards.length > 0) {
        const cardIndex = aiPlayer.hand.indexOf(commandCards[0]);
        return {
          playerId: "AI",
          action: "play_card",
          data: { cardIndex, zone: "command" }
        };
      }
    }

    // End phase if nothing else to do
    return { playerId: "AI", action: "end_phase" };
  }

  private makeDeploymentPhaseMove(aiPlayer: PlayerState, gameState: GameState): GameMove {
    // AI strategy for deployment phase
    const deployableUnits = aiPlayer.hand.filter(card => 
      this.isUnitCard(card) && card.commandCost <= aiPlayer.commandPoints
    );

    if (deployableUnits.length > 0) {
      // Deploy strongest affordable unit based on difficulty
      let selectedCard;
      
      switch (this.difficulty) {
        case "Easy":
          // Random selection
          selectedCard = deployableUnits[Math.floor(Math.random() * deployableUnits.length)];
          break;
        case "Medium":
          // Prefer higher attack
          selectedCard = deployableUnits.sort((a, b) => b.attack - a.attack)[0];
          break;
        case "Hard":
          // Optimal cost-to-power ratio
          selectedCard = deployableUnits.sort((a, b) => {
            const ratioA = (a.attack + a.defense) / Math.max(a.commandCost, 1);
            const ratioB = (b.attack + b.defense) / Math.max(b.commandCost, 1);
            return ratioB - ratioA;
          })[0];
          break;
      }

      const cardIndex = aiPlayer.hand.indexOf(selectedCard);
      return {
        playerId: "AI",
        action: "play_card",
        data: { cardIndex, zone: "unit" }
      };
    }

    // End phase if no units to deploy
    return { playerId: "AI", action: "end_phase" };
  }

  private makeBattlePhaseMove(aiPlayer: PlayerState, gameState: GameState): GameMove {
    // AI strategy for battle phase
    if (aiPlayer.unitZone.length === 0) {
      return { playerId: "AI", action: "end_phase" };
    }

    const opponents = Object.values(gameState.players).filter(p => p.id !== "AI");
    const target = opponents[0]; // For now, target first opponent

    if (!target) {
      return { playerId: "AI", action: "end_phase" };
    }

    // Choose attack strategy based on difficulty
    switch (this.difficulty) {
      case "Easy":
        return this.makeEasyAttack(aiPlayer, target);
      case "Medium":
        return this.makeMediumAttack(aiPlayer, target);
      case "Hard":
        return this.makeHardAttack(aiPlayer, target);
      default:
        return { playerId: "AI", action: "end_phase" };
    }
  }

  private makeEasyAttack(aiPlayer: PlayerState, target: PlayerState): GameMove {
    // Easy AI: Random attacks
    const attackerIndex = Math.floor(Math.random() * aiPlayer.unitZone.length);
    
    if (target.unitZone.length > 0 && Math.random() > 0.5) {
      // Attack random unit
      const targetIndex = Math.floor(Math.random() * target.unitZone.length);
      return {
        playerId: "AI",
        action: "attack",
        data: { attackerIndex, targetPlayerId: target.id, targetIndex }
      };
    } else {
      // Direct attack
      return {
        playerId: "AI",
        action: "attack",
        data: { attackerIndex, targetPlayerId: target.id }
      };
    }
  }

  private makeMediumAttack(aiPlayer: PlayerState, target: PlayerState): GameMove {
    // Medium AI: Prefer favorable trades or direct attacks
    for (let i = 0; i < aiPlayer.unitZone.length; i++) {
      const attacker = aiPlayer.unitZone[i];
      
      // Look for favorable unit trades
      for (let j = 0; j < target.unitZone.length; j++) {
        const defender = target.unitZone[j];
        
        if (attacker.attack >= defender.defense && 
            (defender.attack < attacker.defense || attacker.attack > defender.attack)) {
          // Favorable trade
          return {
            playerId: "AI",
            action: "attack",
            data: { attackerIndex: i, targetPlayerId: target.id, targetIndex: j }
          };
        }
      }
    }

    // If no favorable trades, direct attack with strongest unit
    const strongestIndex = aiPlayer.unitZone.reduce((maxIndex, unit, index, array) => 
      unit.attack > array[maxIndex].attack ? index : maxIndex, 0);

    return {
      playerId: "AI",
      action: "attack",
      data: { attackerIndex: strongestIndex, targetPlayerId: target.id }
    };
  }

  private makeHardAttack(aiPlayer: PlayerState, target: PlayerState): GameMove {
    // Hard AI: Calculate optimal attacks considering all possibilities
    const bestMove = this.calculateBestAttack(aiPlayer, target);
    
    if (bestMove) {
      return {
        playerId: "AI",
        action: "attack",
        data: bestMove
      };
    }

    return { playerId: "AI", action: "end_phase" };
  }

  private calculateBestAttack(aiPlayer: PlayerState, target: PlayerState): any {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < aiPlayer.unitZone.length; i++) {
      const attacker = aiPlayer.unitZone[i];

      // Consider attacking each enemy unit
      for (let j = 0; j < target.unitZone.length; j++) {
        const defender = target.unitZone[j];
        const score = this.evaluateAttack(attacker, defender, true);
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = { attackerIndex: i, targetPlayerId: target.id, targetIndex: j };
        }
      }

      // Consider direct attack
      const directScore = this.evaluateDirectAttack(attacker, target);
      if (directScore > bestScore) {
        bestScore = directScore;
        bestMove = { attackerIndex: i, targetPlayerId: target.id };
      }
    }

    return bestMove;
  }

  private evaluateAttack(attacker: any, defender: any, isUnitTarget: boolean): number {
    let score = 0;

    if (isUnitTarget) {
      // Score for destroying enemy unit
      if (attacker.attack >= defender.defense) {
        score += defender.attack + defender.defense; // Value of destroyed unit
      }

      // Penalty for losing our unit
      if (defender.attack >= attacker.defense) {
        score -= attacker.attack + attacker.defense;
      }
    }

    return score;
  }

  private evaluateDirectAttack(attacker: any, target: PlayerState): number {
    // Simple evaluation: damage dealt to player
    return attacker.attack;
  }

  private isCommandCard(card: any): boolean {
    return !this.isUnitCard(card) && !card.type.includes("Shipyard");
  }

  private isUnitCard(card: any): boolean {
    return card.type.includes("Unit") || 
           card.type.includes("Machine") || 
           card.type.includes("Biological");
  }
}
