import { GameState, PlayerState, GameMove } from "./gameEngine";
import { Card } from "@shared/schema";

interface AIMove {
  type: string;
  data: any;
  priority: number;
}

class AIEngine {
  calculateMove(gameState: GameState, difficulty: string): { type: string; data: any } {
    const aiPlayer = gameState.players["ai"];
    const humanPlayer = gameState.players[Object.keys(gameState.players).find(id => id !== "ai") || ""];

    if (!aiPlayer || !humanPlayer) {
      return { type: "end_phase", data: {} };
    }

    const possibleMoves = this.generatePossibleMoves(gameState, aiPlayer);
    
    switch (difficulty) {
      case "Easy":
        return this.selectRandomMove(possibleMoves);
      case "Medium":
        return this.selectStrategicMove(possibleMoves, gameState, aiPlayer, humanPlayer);
      case "Hard":
        return this.selectOptimalMove(possibleMoves, gameState, aiPlayer, humanPlayer);
      default:
        return this.selectRandomMove(possibleMoves);
    }
  }

  private generatePossibleMoves(gameState: GameState, aiPlayer: PlayerState): AIMove[] {
    const moves: AIMove[] = [];

    switch (gameState.currentPhase) {
      case "Command":
        // Draw card if available
        if (!aiPlayer.hasDrawnCard && aiPlayer.deck.length > 0) {
          moves.push({ type: "draw_card", data: {}, priority: 8 });
        }

        // Play shipyard cards
        const shipyardCards = aiPlayer.hand.filter(card => card.type.includes("Shipyard"));
        shipyardCards.forEach(card => {
          if (!aiPlayer.hasPlayedCommandCard) {
            moves.push({
              type: "play_card",
              data: { cardId: card.id, zone: "command" },
              priority: 7
            });
          }
        });

        // End phase
        moves.push({ type: "end_phase", data: {}, priority: 1 });
        break;

      case "Deployment":
        // Play unit cards
        const affordableUnits = aiPlayer.hand.filter(card => 
          card.type === "Unit" && card.commandCost <= aiPlayer.commandPoints
        );
        affordableUnits.forEach(card => {
          const priority = this.calculateUnitPriority(card, gameState, aiPlayer);
          moves.push({
            type: "play_card",
            data: { cardId: card.id, zone: "unit" },
            priority
          });
        });

        // Play command cards
        const affordableCommands = aiPlayer.hand.filter(card => 
          card.type === "Command" && card.commandCost <= aiPlayer.commandPoints
        );
        affordableCommands.forEach(card => {
          const priority = this.calculateCommandPriority(card, gameState, aiPlayer);
          moves.push({
            type: "play_card",
            data: { cardId: card.id, zone: "command" },
            priority
          });
        });

        // End phase
        moves.push({ type: "end_phase", data: {}, priority: 2 });
        break;

      case "Battle":
        // Attack with units
        aiPlayer.unitZone.forEach(unit => {
          // Direct attack
          moves.push({
            type: "attack",
            data: { attackerId: unit.id },
            priority: this.calculateAttackPriority(unit, gameState, aiPlayer)
          });

          // Attack enemy units
          const enemyPlayer = this.getEnemyPlayer(gameState, aiPlayer.id);
          enemyPlayer.unitZone.forEach(target => {
            moves.push({
              type: "attack",
              data: { attackerId: unit.id, targetId: target.id },
              priority: this.calculateCombatPriority(unit, target)
            });
          });
        });

        // End phase
        moves.push({ type: "end_phase", data: {}, priority: 1 });
        break;

      default:
        moves.push({ type: "end_phase", data: {}, priority: 1 });
    }

    return moves;
  }

  private selectRandomMove(moves: AIMove[]): { type: string; data: any } {
    if (moves.length === 0) {
      return { type: "end_phase", data: {} };
    }
    
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return { type: randomMove.type, data: randomMove.data };
  }

  private selectStrategicMove(moves: AIMove[], gameState: GameState, aiPlayer: PlayerState, humanPlayer: PlayerState): { type: string; data: any } {
    if (moves.length === 0) {
      return { type: "end_phase", data: {} };
    }

    // Apply basic strategy: prefer higher priority moves
    moves.sort((a, b) => b.priority - a.priority);
    
    // Add some randomness to make AI less predictable
    const topMoves = moves.slice(0, Math.min(3, moves.length));
    const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
    
    return { type: selectedMove.type, data: selectedMove.data };
  }

  private selectOptimalMove(moves: AIMove[], gameState: GameState, aiPlayer: PlayerState, humanPlayer: PlayerState): { type: string; data: any } {
    if (moves.length === 0) {
      return { type: "end_phase", data: {} };
    }

    // Advanced strategy considerations
    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      let score = move.priority;

      // Evaluate game state after this move
      score += this.evaluateGameState(gameState, aiPlayer, humanPlayer);
      
      // Bonus for aggressive plays when ahead
      if (aiPlayer.health > humanPlayer.health && move.type === "attack") {
        score += 2;
      }
      
      // Bonus for defensive plays when behind
      if (aiPlayer.health < humanPlayer.health && move.type === "play_card") {
        const card = aiPlayer.hand.find(c => c.id === move.data.cardId);
        if (card && card.defense > card.attack) {
          score += 3;
        }
      }

      // Prefer finishing moves
      if (move.type === "attack" && humanPlayer.health <= 10) {
        score += 10;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return { type: bestMove.type, data: bestMove.data };
  }

  private calculateUnitPriority(card: Card, gameState: GameState, aiPlayer: PlayerState): number {
    let priority = 5;
    
    // Prefer cost-efficient units
    priority += (card.attack + card.defense) / Math.max(card.commandCost, 1);
    
    // Prefer low-cost units early game
    if (gameState.turnNumber <= 3 && card.commandCost <= 3) {
      priority += 2;
    }
    
    // Prefer high-power units late game
    if (gameState.turnNumber > 5 && card.attack >= 5) {
      priority += 3;
    }
    
    return priority;
  }

  private calculateCommandPriority(card: Card, gameState: GameState, aiPlayer: PlayerState): number {
    let priority = 4;
    
    // Prefer card draw when hand is small
    if (card.name.includes("Draw") && aiPlayer.hand.length <= 3) {
      priority += 4;
    }
    
    // Prefer damage spells when enemy is low on health
    const enemyPlayer = this.getEnemyPlayer(gameState, aiPlayer.id);
    if (card.name.includes("Strike") && enemyPlayer.health <= 20) {
      priority += 5;
    }
    
    return priority;
  }

  private calculateAttackPriority(unit: Card, gameState: GameState, aiPlayer: PlayerState): number {
    let priority = 3;
    
    const enemyPlayer = this.getEnemyPlayer(gameState, aiPlayer.id);
    
    // Prefer direct attack when enemy has no units
    if (enemyPlayer.unitZone.length === 0) {
      priority += 5;
    }
    
    // Prefer direct attack when it would win the game
    if (unit.attack >= enemyPlayer.health) {
      priority += 20;
    }
    
    return priority;
  }

  private calculateCombatPriority(attacker: Card, defender: Card): number {
    let priority = 2;
    
    // Prefer favorable trades
    if (attacker.attack >= defender.defense && attacker.defense > defender.attack) {
      priority += 8; // Favorable trade
    } else if (attacker.attack >= defender.defense) {
      priority += 4; // Can destroy defender
    } else if (attacker.defense <= defender.attack) {
      priority -= 3; // Will lose own unit
    }
    
    // Prefer attacking high-value targets
    priority += (defender.attack + defender.defense) / 4;
    
    return priority;
  }

  private evaluateGameState(gameState: GameState, aiPlayer: PlayerState, humanPlayer: PlayerState): number {
    let score = 0;
    
    // Health advantage
    score += (aiPlayer.health - humanPlayer.health) / 10;
    
    // Board presence
    const aiUnitsValue = aiPlayer.unitZone.reduce((sum, unit) => sum + unit.attack + unit.defense, 0);
    const humanUnitsValue = humanPlayer.unitZone.reduce((sum, unit) => sum + unit.attack + unit.defense, 0);
    score += (aiUnitsValue - humanUnitsValue) / 5;
    
    // Card advantage
    score += (aiPlayer.hand.length - humanPlayer.hand.length);
    
    // Command point advantage
    score += (aiPlayer.commandPoints - humanPlayer.commandPoints) / 2;
    
    return score;
  }

  private getEnemyPlayer(gameState: GameState, playerId: string): PlayerState {
    const enemyId = Object.keys(gameState.players).find(id => id !== playerId);
    return gameState.players[enemyId || ""];
  }

  // Difficulty-based decision making
  shouldPlayCard(card: Card, gameState: GameState, difficulty: string): boolean {
    switch (difficulty) {
      case "Easy":
        return Math.random() > 0.3; // Often skips optimal plays
      case "Medium":
        return Math.random() > 0.1; // Occasionally makes suboptimal plays
      case "Hard":
        return true; // Always makes calculated decisions
      default:
        return Math.random() > 0.5;
    }
  }

  getReactionTime(difficulty: string): number {
    switch (difficulty) {
      case "Easy":
        return 2000 + Math.random() * 3000; // 2-5 seconds
      case "Medium":
        return 1000 + Math.random() * 2000; // 1-3 seconds
      case "Hard":
        return 500 + Math.random() * 1000; // 0.5-1.5 seconds
      default:
        return 2000;
    }
  }
}

export const aiEngine = new AIEngine();
